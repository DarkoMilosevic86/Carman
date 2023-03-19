const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require("helmet");
const path = require('path');
const toobusy = require('toobusy-js');
const pool = require("./database");
const fs = require('fs');
const hpp = require('hpp');
const https = require('https');
const rateLimit = require('express-rate-limit');
const http = require('http');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const app = express();
/* helmet start */

app.use(helmet.crossOriginEmbedderPolicy());
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }));
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
/* helmet end */

//Handle responses when server too much bust so it will not crash (prevent DoS attack)
app.use(function(req, res, next) {
    if (toobusy()) {
        // log if you see necessary
        res.status(503).send("Server Too Busy")

    } else {
        next();
    }
});

//Handle mutliple params with same name (prevent HTTP Parameter Pollution attack)
app.use(hpp());

app.disable('x-powered-by');
app.use(cors());
app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static("public"));
//app.use(express.static(__dirname + '/public'));

//allow files to be stored in uploads folder
app.use('/uploads', express.static('uploads'));
//app.use(express.static(__dirname));

//routes
const dashboardapi = require('./routes/dashboard-api');
const appendpoints = require('./routes/app-endpoints');
const authorization = require('./routes/authorization');
const collapi = require('./routes/coll-api');
const accountapi = require('./routes/account-api');
const bidapi = require('./routes/bids-api');
const config = require('./config/config');

app.use('/dashboard', dashboardapi);
app.use('/app', appendpoints);
app.use('/authorization', authorization);
app.use('/collections', collapi);
app.use('/account', accountapi);
app.use('/bids', bidapi);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to API calls only (only for dashboard)
app.use('/api', apiLimiter);

app.get('/',(req,res) => {
    res.send("Welcome");
});
/** ERROR HANDLERS */

// custom 404
app.use((req, res, next) => {
    res.status(404).send("Sorry can't find that!")
});
// custom error handler
app.use((err, req, res, next) => {
    /*console.log('Error status: ', err.status)
    console.log('Message: ', err.message)*/
    res.status(err.status || 500).send(err.message)
});

/** ERROR HANDLERS */

/* FUNCTIONS */

const createAuction  = async ({token, vehicleId, startDate, expirationDate, startPrice}) => {
    try {
        const { accountid } = jwt.verify(token, config.serverSecretKey);

        const data = {
            accountid: accountid, 
            vehicleId, 
            start_date: startDate, 
            current_date: moment.unix(), 
            expiration_date: expirationDate, 
            startPrice, 
            currentPrice: startPrice, 
        };
        // Insert data query.
        const query = 'INSERT INTO auction (accountid, vehicleid, start_date, current_date, expiration_date, start_price, current_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id';
        const { rows } = await pool.query(query, [accountid, vehicleId, startDate, data.current_date, expirationDate, startPrice, startPrice, 1]);
        
        if(rows.length > 0 ){
            return {...data, id: rows[0].id};
        }

        return null;
    }
    catch (err) {
        console.log('createAuctionError', err);
        return null;
    }
}

const createBid  = async ({token, auctionId, price, bid_count, expiration_date}) => {
    try {
        const { accountid } = jwt.verify(token, config.serverSecretKey);
        const data = {
            accountid, 
            auctionId, 
            price,
            bid_count: bid_count + 1,
            creation_date: moment().unix()
        };
        const query = "INSERT INTO bid (accountid, auctionid, price, creation_date) VALUES ($1, $2, $3, $4) RETURNING id";
        const { rows } = await pool.query(query, [accountid, auctionId, data.price, data.creation_date]);
        
        if (rows.length > 0) {
            // Updating auction price
            //const query = "UPDATE auction SET current_price=$2 WHERE id=$1";
            const now = moment(new Date()); //todays date
            const end = moment(expiration_date * 1000); // another date
            const duration = moment.duration(end.diff(now));
            const minutes = duration.asMinutes();

            if(minutes > 0 ){
                // Insert into public.bids query
                let new_expiration_date = expiration_date;
                if(minutes < 10){
                    new_expiration_date = end.add( 10 - minutes,'minutes').unix()
                }
                const query = "UPDATE auction SET current_price=$2, expiration_date=$3  WHERE id=$1";
                await pool.query(query, [auctionId, data.price, new_expiration_date]);
                return {
                    bid_id: rows[0].id,
                    ...data
                };

            }else {
                //"Auction has been expired!"
            }
        }

        return null;
    }
    catch (err) {
        console.log('createBidError', err);
        return null;
    }
}

const closeDealOld = async ({ token, auctionId }) => {
    try {
        const { accountid } = jwt.verify(token, config.serverSecretKey);

        const buyer = await findBuyerId({ auctionId });
        const priceObj = await getAuctionPrices({ auctionId });

        const query = `UPDATE auction a SET status=2, buyerid=$3 WHERE a.id=$1 AND a.accountid = $2`;
        await pool.query(query,[auctionId, accountid, buyer]);

        if(priceObj){
            const { seller_fee, buyer_fee } = priceObj;

            let curr_time = moment().unix();

            const queryPayment = `INSERT INTO public.payment(creation_date, price, accountid, type, state) VALUES ($1, $2, $3, $4, $5),($6, $7, $8, $9, $10)`;
            await pool.query(queryPayment,[
                curr_time, seller_fee,  accountid, 'CAR_SELLER', 0,
                curr_time, buyer_fee,  buyer, 'CAR_BUYER', 0
            ]);
        }

        return {
            auctionId,
            accountid
        }
    } catch (error) {
        console.log({closeDealError : error});
        return null;
    }
}


const closeDeal = async ({ token, auctionId }) => {
    const { accountid } = jwt.verify(token, config.serverSecretKey);

    try {
        const buyerPromise = findBuyerId({ auctionId });
        const pricePromise = getAuctionPrices({ auctionId });

        let buyer = await buyerPromise;
        if(!buyer) {
            const query = `UPDATE auction a SET status=0 WHERE a.id=$1 AND a.accountid = $2`;
            await pool.query(query,[auctionId, accountid]);

            return {
                auctionId,
                accountid
            }
        }

        /*const query = `UPDATE auction a SET status=2, buyerid=$3 WHERE a.id=$1 AND a.accountid = $2`;
        await pool.query(query,[auctionId, accountid, buyer]);

        const query2 = `UPDATE coll_vehicle SET type = 'archive' WHERE id = (SELECT vehicleid FROM auction WHERE id = $1)`;
        await pool.query(query2, [auctionId]);
        */
        let priceObj = await pricePromise;
        if(priceObj){
            const { seller_fee, buyer_fee } = priceObj;

            const query = `UPDATE auction a SET status=2, buyerid=$3, buyer_fee=$4, seller_fee=$5 WHERE a.id=$1 AND a.accountid = $2`;
            await pool.query(query,[auctionId, accountid, buyer, seller_fee, buyer_fee]);

            const query2 = `UPDATE coll_vehicle SET type = 'archive' WHERE id = (SELECT vehicleid FROM auction WHERE id = $1)`;
            await pool.query(query2, [auctionId]);

            const curr_time = moment().unix();
            const queryPayments = `SELECT accountid, price FROM payment WHERE (accountid = $1 OR accountid=$2) AND state=0`;
            const { rows } = await pool.query(queryPayments,[accountid, buyer]);
            if(rows.length === 0){
                const queryPayment = `INSERT INTO public.payment(creation_date, price, accountid, type, state) VALUES ($1, $2, $3, $4, $5),($6, $7, $8, $9, $10)`;
                await pool.query(queryPayment,[
                    curr_time, buyer_fee,  accountid, `${auctionId}`, 0,
                    curr_time, seller_fee,  buyer, `${auctionId}`, 0,
                ]);
            }else {
                let seller_pay = rows.find((r) => r.accountid === accountid);
                let buyer_pay = rows.find((r) => r.accountid === buyer);
                
                if(seller_pay){
                    const queryPayment2 = `UPDATE payment SET type = type || ',${auctionId}', price=$2, last_date=$3   WHERE accountid =$1`;
                    await pool.query(queryPayment2,[accountid, seller_pay.price + buyer_fee, curr_time]);
                }else {
                    const queryPayment3 = `INSERT INTO public.payment(creation_date, price, accountid, type, state) VALUES ($1, $2, $3, $4, $5)`;
                    await pool.query(queryPayment3,[
                        curr_time, buyer_fee,  accountid, `${auctionId}`, 0
                    ]);
                }

                if(buyer_pay){
                    const queryPayment4 = `UPDATE payment SET type = type || ',${auctionId}', price=$2, last_date=$3  WHERE accountid =$1`;
                    await pool.query(queryPayment4,[buyer, buyer_pay.price + seller_fee, curr_time]);
                }else {
                    const queryPayment5 = `INSERT INTO public.payment(creation_date, price, accountid, type, state) VALUES ($1, $2, $3, $4, $5)`;
                    await pool.query(queryPayment5,[
                        curr_time, seller_fee,  buyer, `${auctionId}`, 0
                    ]);
                }
            }
        }

        const emailList = await getEmails({ 
            acc1: accountid,
            acc2: buyer 
        });

        const emailInfo = await sendEmail({
            subject: 'Car sold confirmation',
            text: 'Car sold confirmation',
            to: emailList,
        });

        return {
            auctionId,
            accountid
        }
    } catch (error) {
        console.log({closeDealError : error});
        return null;
    }
}

const sendEmail = async ({ subject, text, to}) => {
    try {
        let transporter2 = nodemailer.createTransport({
            service: "Outlook365",// "Outlook365",
            auth: {
              user: 'no@thankyou.com',
              pass: 'yourpass'
            },tls: {
                rejectUnauthorized: false
            }
        });
    
        // send mail with defined transport object
        // You should change the email address in the code
        let info = await transporter2.sendMail({
            from: '"No Thankyou" <no@thankyou.com>', // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
        });

        return info;
    } catch (error) {
        return null;
    }
}

const findBuyerId = async ({auctionId}) => {
    try {
        const query = `SELECT * FROM bid WHERE auctionid=$1 ORDER BY creation_date LIMIT 1`;
        const { rows } = await pool.query(query,[auctionId]);

        if(rows.length > 0){
            return rows[0].accountid;
        }

        return null;
    } catch (error) {
        console.log({findBuyerIdError : error});
        return null;
    }
}

const getEmails = async ({ acc1, acc2 }) => {
    try {
        const query = `SELECT email FROM account WHERE accountid IN (${acc1}, ${acc2})`;
        const { rows } = await pool.query(query,[]);
        return rows.map((item) => item.email);
    } catch (error) {
        //console.log({getEmailsError : error});
        return { error: error.message };
    }
}


const getAuctionPrices = async ({auctionId}) => {
    try {
        const query = `SELECT start_price, current_price FROM auction WHERE id=$1`;
        const { rows } = await pool.query(query,[auctionId]);
        if(rows.length > 0){
            const auction = rows[0];

            const profit = getProfit(auction.start_price, auction.current_price);
            const seller_fee = (auction.current_price < 10000 ? auction.current_price * 0.01 : auction.current_price * 0.005);
            const buyer_fee = getBuyerFee(profit,auction.current_price).toFixed(2);

            return {
                seller_fee: parseFloat(seller_fee),
                buyer_fee: parseFloat(buyer_fee)
            }
        }

        return null;
    } catch (error) {
        console.log({findBuyerIdError : error});
        return null;
    }
}


const getProfit = (start, end) => {
    return (((end - start) / start) * 100).toFixed(2);
}


const getBuyerFee = (profit, price) => {
    if(profit < 5) return 0;

    if(profit < 20) 
        return price * 0.005;

    if(profit < 100)
        return price * 0.01;


    return price * 0.02;
}


const extendAuctionTime = async ({ token, days, minutes, auctionId, force }) => {
    try {
        const { accountid } = jwt.verify(token, config.serverSecretKey);

        let rows = [];

        if(force){
            const res = await pool.query('SELECT * FROM auction WHERE id =$1',[auctionId]);
            rows = res.rows;
        }else {
            const res = await pool.query('SELECT * FROM auction WHERE id =$1 AND accountid = $2',[auctionId, accountid]);
            rows = res.rows;
        }
        
        if(!rows || rows.length <= 0){
            return null;
        }

        const { expiration_date } = rows[0];
        const new_date = moment(parseInt(expiration_date) * 1000)
            .add(parseInt(minutes) || 0, 'minutes')
            .add(parseInt(days) || 0, 'days')
            .unix();

        if(!force){
            const query = `UPDATE auction a SET expiration_date=$1 WHERE a.id=$2 AND a.accountid = $3`;
            await pool.query(query,[new_date, auctionId, accountid]);
        }else {
            const query = `UPDATE auction a SET expiration_date=$1 WHERE a.id=$2`;
            await pool.query(query,[new_date, auctionId]);
        }

        

        return {
            auctionId,
            new_expiration_date: new_date
        }
    } catch (error) {
        console.log({extendAuctionTimeError : error});
        return { error : error.message};
    }
}

/* FUNCTIONS */

const port = config.port;

const isHttps = false;
if(isHttps){
    const options = {
        key: fs.readFileSync(__dirname + '/private.pem', 'utf8'),
        cert: fs.readFileSync(__dirname + '/public.pem', 'utf8')
    };
// These certificate files are created using the Open SSL. You must provide your own

    const server = https.createServer(options, app);
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('a user connected');
    });

    server.listen(port, () => console.log("running 8181"));
}else {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: '*',
        }
    });

    app.set('socketio', io);
    
    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        socket.on('new_auction', async (data) => {
            const { token, vehicleId, startDate, expirationDate, startPrice } = data;
            const new_auction = await createAuction({ token, vehicleId, startDate, expirationDate, startPrice });

            if(new_auction){
                io.sockets.emit("new_auction_response", new_auction)
            }
        });
        
        socket.on('new_bid', async (data) => {
            if(!data) return;
            io.sockets.emit("bidding_response", {
                auctionId: data.auctionId, 
                price: data.price
            });

            const { token, auctionId, price, bid_count, expiration_date } = data;
            const new_bid = await createBid({ token, auctionId, price, bid_count, expiration_date });

            if(new_bid){
                io.sockets.emit("new_bid_response", new_bid);

                //extend for 10minutes
                /*const res = await extendAuctionTime({ token, days: 0 , minutes: 10, auctionId, force });
                if(res){
                    io.sockets.emit("extend_auction_time_response", {...res, sendData: { token, days: 0 , minutes: 10, auctionId }})
                }*/
            }
        });

        socket.on('close_deal', async (data) => {
            if(!data) return;

            io.sockets.emit("closing_deal_response", { auctionId: data.auctionId });


            const { token, auctionId } = data;
            const { accountid } = jwt.verify(token, config.serverSecretKey);
            io.sockets.emit("close_deal_response", {
                auctionId,
                accountid
            });

            const res = await closeDeal({ token, auctionId });
            if(res){
                //io.sockets.emit("close_deal_response", res);
            }
        });

        socket.on('extend_auction_time', async (data) => {
            const { token, days, minutes, auctionId } = data;
            //io.sockets.emit("extend_auction_time_response", data)
            
            //console.log('extend_auction_time: ', data);
            const res = await extendAuctionTime({ token, days, minutes, auctionId });

            if(res){
                io.sockets.emit("extend_auction_time_response", {...res, sendData: { token, days, minutes, auctionId }})
            }
        });

        socket.on('test_socket', async (data) => {
            const { token, days, minutes, auctionId } = data;
            io.sockets.emit("test_socket_response", { token, days, minutes, auctionId })
        });

    });
    
    server.listen(port, () => console.log("running " + port));
}