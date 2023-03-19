const express = require('express');
const router = express.Router();
const pool = require("../database");
const config = require('../config/config');
const moment = require('moment');
const expressJwt = require('express-jwt');
const nodemailer = require("nodemailer");

const roles = [1, 4];

router.route('/createAuction').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    let retVal = {msg: '', auction: null};
    try {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        // Body request parameters
        const {vehicleId, startDate, startPrice, minutes, days } = req.body;
        const expirationDate = moment(startDate * 1000)
            .add(minutes || 0, 'minutes')
            .add(days || 0, 'days')
            .unix();

        const created_auction = await createAuction({accountid: req.user.accountid, vehicleId, startDate, expirationDate, startPrice});
        if(created_auction?.id){
            retVal.auction = created_auction.id;
            
            const auctions = await getAuctions({ id: created_auction.id, accountid: req.user.accountid });
            
            if(auctions?.length > 0){
                const io = req.app.get('socketio');
                io.sockets.emit('new_auction_response', auctions[0]);
            }

            retVal.msg = "OK";
            res.status(200).json(retVal);
            return;
        }else {
            retVal.msg = "ERROR";
            res.status(200).json(retVal);
            return;
        }
        
        
    }
    catch (err) {
        console.log('createAuctionError', err);
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

const createAuction  = async ({accountid, vehicleId, startDate, expirationDate, startPrice}) => {
    try {
        const data = {
            accountid: accountid, 
            vehicleId, 
            start_date: startDate, 
            creation_date: moment().unix(), 
            expiration_date: expirationDate, 
            startPrice, 
            currentPrice: startPrice
        };
        // Insert data query.
        const query = 'INSERT INTO auction (accountid, vehicleid, start_date, creation_date, expiration_date, start_price, current_price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id';
        const params = [accountid, vehicleId, startDate, data.creation_date, expirationDate, startPrice, startPrice, 1];
        const { rows } = await pool.query(query, params);
        
        if(rows.length > 0 ){
            const query = `UPDATE coll_vehicle SET type = 'bid' WHERE id=$1`;
            await pool.query(query, [vehicleId]);

            return {
                ...data, 
                id: rows[0].id
            };
        }

        return null;
    }
    catch (err) {
        console.log('createAuctionError', err);
        return null;
    }
}

router.route('/createBid').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    // Response
    let retVal = {msg: '', bid: null};
    // Try-Catch block
    try {
        // If user is not authorised
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}
        // Request body
        const { auctionId, price } = req.body;
        // Insert into public.bids query
        const data = await createBid({ accountId: req.user.accountid, auctionId, price});

        retVal.bid = data;
        res.status(200).json(retVal);
        return;
    }
    catch(err) {
        // Logs the error, and sets retVal.msg to the err.message value
        console.log('createBidError', err);
        retVal.msg = err.message;
        res.status(400).json(retVal);
        return;
    }
});

const createBid2  = async ({accountId, auctionId, price}) => {
    try {
        const data = {
            accountId, 
            auctionId, 
            price,
            creation_date: moment().unix()
        };

        const queryPrice = "SELECT current_price FROM auction WHERE id=$1";
        const { rows: auctions } = await pool.query(queryPrice, [auctionId]);
        if(!(auctions?.length > 0)){
            return null;
        }

        if(auctions[0].current_price !== price){
            return { msg: 'Price changed', new_price: auctions[0].current_price };
        }

        const query = "INSERT INTO bid (accountid, auctionid, price, creation_date) VALUES ($1, $2, $3, $4) RETURNING id";
        const { rows } = await pool.query(query, [accountId, auctionId, price, data.creation_date]);

        // If length of rows has less then 0
        if (rows.length > 0) {
            // Updating auction price
            const query = "UPDATE auction SET current_price= current_price + 100 WHERE id=$2";
            await pool.query(query, [price, auctionId]);

            return data
        }

        return null;
    }
    catch (err) {
        console.log('createBidError', err);
        return null;
    }
}


const createBid  = async ({accountId, auctionId, price }) => {
    try {
        const data = {
            accountId, 
            auctionId, 
            price,
            //bid_count: bid_count + 1,
            creation_date: moment().unix()
        };
        const query = "INSERT INTO bid (accountid, auctionid, price, creation_date) VALUES ($1, $2, $3, $4) RETURNING id";
        const { rows } = await pool.query(query, [accountId, auctionId, data.price, data.creation_date]);
        
        if (rows.length > 0) {
            // Updating auction price
            //const query = "UPDATE auction SET current_price=$2 WHERE id=$1";
            const query = "UPDATE auction SET current_price=$2, expiration_date=expiration_date+600  WHERE id=$1";

            await pool.query(query, [auctionId, data.price]);

            return {
                bid_id: rows[0].id,
                ...data
            };
        }

        return null;
    }
    catch (err) {
        console.log('createBidError', err);
        return null;
    }
}

router.route('/getActiveAuctionsByAccount').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        //fetch data 
        const query = `SELECT x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, a.start_price, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
            WHERE a.accountid=$1 AND a.status=1 ORDER BY a.id`;
        // status=1 means active
        const { rows } = await pool.query(query,[req.user.accountid]);
        retVal.auctions = rows.map((auction) => ({
            ...auction,
            bid_count: auction?.bid_count ? parseInt(auction.bid_count) : 0,
        }));

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getActiveAuctionsByAccount: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getAuctions').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        //fetch data 
        const query = `SELECT * from auction`;
        // status=1 means active
        const { rows } = await pool.query(query,[]);
        retVal.auctions = rows;

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getAuctions: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const getAuctions = async(conditions) => {
    try {
        let query = `SELECT x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, a.start_price, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid`;

        let params = []; 
        const paramNames = Object.keys(conditions);

        paramNames.forEach((key, index) => {
            query += index === 0 ? ` WHERE ` : ` AND `;

            query += `a.${key}=$${params.length + 1}`;
            params.push(conditions[key]);
        });
        const queryResponse = await pool.query(query,params);
        
        return queryResponse?.rows || [];
    } catch (error) {
        return [];
    }
}

router.route('/getAllActiveAuctions').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        await checkUnclosedDeals();


        const { brands, models, fromYear, toYear, fromPrice, toPrice, fromMillage, toMillage } = req.body;
        
        const curr_date = moment().unix();

        //fetch data 
        let query = `SELECT bd.accountid as account_bid, bd.price as account_price, x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, a.start_price, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
            LEFT OUTER  JOIN ( SELECT bdd.accountid, bdd.price, bdd.auctionid FROM bid bdd WHERE bdd.accountid=$1 ORDER BY price DESC LIMIT 1 ) bd ON bd.auctionid = a.id
            WHERE a.status=1  AND a.accountid != $1 AND a.expiration_date > $2 `;
        
        let params = [req.user.accountid, curr_date];
        
        if(brands && brands.length > 0){
            query += ` AND v.brandid IN (`;
            for (let i = 0; i < brands.length; i++) {
                const brandId = brands[i];
                query += brandId;
                if(i + 1 < brands.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(models && models.length > 0){
            query += ` AND v.modelid IN (`;
            for (let i = 0; i < models.length; i++) {
                const modelId = models[i];

                query += modelId;
                if(i + 1 < models.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(fromYear > 0 && toYear > 0){
            query += ` AND v.market_date >= $${params.length + 1} AND v.market_date <= $${params.length + 2}`;
            const from_year = moment('01/01/' + fromYear).startOf('year').unix();
            const to_year = moment('01/01/' + toYear).startOf('year').unix();

            params.push(from_year);
            params.push(to_year);
        }

        if(fromPrice > 0 && toPrice > 0){
            query += ` AND a.current_price >= $${params.length + 1} AND a.current_price <= $${params.length + 2}`;

            params.push(fromPrice);
            params.push(toPrice);
        }

        if(fromMillage > 0 && toMillage > 0){
            query += ` AND v.millage >= $${params.length + 1} AND v.millage <= $${params.length + 2}`;

            params.push(fromMillage);
            params.push(toMillage);
        }            
        query += '  ORDER BY a.id';
        // status=1 means active
        const { rows } = await pool.query(query,params);
        //let auctions = rows.filter((a) => a.accountid !== req.user.accountid);
        retVal.auctions = rows.map((auction) => ({
            ...auction,
            bid_count: auction?.bid_count ? parseInt(auction?.bid_count) : 0,
            hasBid: auction.account_bid > 0,
            hasHighestBid: auction.account_price === auction.current_price,
        }));
        
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getAllActiveAuctions: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/getAuctionsBidByAccount').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        const { brands, models, fromYear, toYear, fromPrice, toPrice, fromMillage, toMillage } = req.body;
        await checkUnclosedDeals();

        const curr_date = moment().unix();
        
        //fetch data 
        let query = `SELECT  bd.price as account_price, bd.id as bid_id, x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, a.start_price, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
            LEFT JOIN bid bd ON bd.id = ( 
				SELECT id FROM bid bdd 
				WHERE accountid=$1 AND auctionid = a.id 
				ORDER BY price DESC LIMIT 1 
			)
        WHERE a.status=1 AND bd.accountid =$1 AND a.accountid != $1 AND a.expiration_date > $2`;
        
        //LEFT JOIN ( SELECT bdd.accountid, bdd.price, bdd.auctionid, bdd.id FROM bid bdd WHERE bdd.accountid=$1 AND bdd.auctionid = a.id ORDER BY price DESC LIMIT 1 ) bd ON bd.auctionid = a.id
        
        let params = [req.user.accountid, curr_date];
        
        if(brands && brands.length > 0){
            query += ` AND v.brandid IN (`;
            for (let i = 0; i < brands.length; i++) {
                const brandId = brands[i];
                query += brandId;
                if(i + 1 < brands.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(models && models.length > 0){
            query += ` AND v.modelid IN (`;
            for (let i = 0; i < models.length; i++) {
                const modelId = models[i];

                query += modelId;
                if(i + 1 < models.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(fromYear > 0 && toYear > 0){
            query += ` AND v.market_date >= $${params.length + 1} AND v.market_date <= $${params.length + 2}`;
            const from_year = moment('01/01/' + fromYear).startOf('year').unix();
            const to_year = moment('01/01/' + toYear).startOf('year').unix();

            params.push(from_year);
            params.push(to_year);
        }

        if(fromPrice > 0 && toPrice > 0){
            query += ` AND a.current_price >= $${params.length + 1} AND a.current_price <= $${params.length + 2}`;

            params.push(fromPrice);
            params.push(toPrice);
        }

        if(fromMillage > 0 && toMillage > 0){
            query += ` AND v.millage >= $${params.length + 1} AND v.millage <= $${params.length + 2}`;

            params.push(fromMillage);
            params.push(toMillage);
        }
            
        query += '  ORDER BY a.id';
        // status=1 means active
        const { rows: auctions } = await pool.query(query,params);
        //let auctions = rows.reduce((acc,row) => acc.find((a) => a.auction_id === row.auction_id) ? acc : [...acc, row], [])
        /*let auctions = []

        rows.forEach(row => {
            let find = auctions.find((a) => a.auction_id === row.auction_id);
            if(!find){
                auctions.push(row);
            }
        });*/
        retVal.auctions = auctions.map((auction) => ({
            ...auction,
            bid_count: auction?.bid_count ? parseInt(auction?.bid_count) : 0,
            hasBid: true,
            hasHighestBid: auction.account_price === auction.current_price,
        }));
        
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getAuctionsBidByAccount: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getHistoryOfAuctions').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        //fetch data 
        const query = `SELECT x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
            WHERE a.status=2`;
            
        // status=1 means active
        const { rows } = await pool.query(query,[]);
        retVal.auctions = rows;

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getHistoryOfAuctions: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getHistoryOfAuctionsByAccount').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}
        //fetch data 
        
        const query = `SELECT x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
            WHERE a.accountid=$1 AND a.status=2`;

        // status=1 means active
        const { rows } = await pool.query(query,[req.user.accountid]);
        retVal.auctions = rows;

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getHistoryOfAuctionsByAccount: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getAuctionDetails').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', data: null };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        await checkUnclosedDeals();


        const { auctionId } = req.body;
        //fetch data 
        const queryAuction = `SELECT x.bid_count, a.id as auction_id, a.current_price, a.start_date, a.expiration_date, a.accountid as seller_id, a.start_price,
            CAST(coalesce(v.market_date, '0') AS integer) as market_date, v.id as vehicle_id,
            m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id
        FROM auction a
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT OUTER JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN coll_brands b ON b.id = v.brandid
            LEFT OUTER JOIN coll_models m ON m.id = v.modelid
        WHERE a.id=$1`;

        const { rows:auctions } = await pool.query(queryAuction,[auctionId]);
        console.log({auctions});
        if(!(auctions?.length > 0))
            return res.status(200).json(retVal);

        //Vehicle data
        let queryVehicle = `SELECT v.*, 
            st.front_tirebrandid as st_front_tirebrandid, st.rear_tirebrandid as st_rear_tirebrandid, st.front_tirebrandid as st_front_tirebrandid, st.rimid, st.profil_front as st_profil_front, st.profil_rear as st_profil_rear,
            stfd.width as stfd_width, stfd.height as stfd_height, stfd.design as stfd_design, stfd.load_index as stfd_load_index, stfd.tire_size as stfd_tire_size, stfd.speed_index as stfd_speed_index,
            strd.width as strd_width, strd.height as strd_height, strd.design as strd_design, strd.load_index as strd_load_index,strd.tire_size as strd_tire_size, strd.speed_index as strd_speed_index,
            strim.id as st_rim_id, strim.name as st_rim_name, 
            stfb.name as stf_brand_name, 
            strb.name as str_brand_name,

            wt.front_tirebrandid as wt_front_tirebrandid, wt.rear_tirebrandid as wt_rear_tirebrandid, wt.front_tirebrandid as wt_front_tirebrandid, wt.rimid, wt.profil_front as wt_profil_front, wt.profil_rear as wt_profil_rear,
            wtfd.width as wtfd_width, wtfd.height as wtfd_height, wtfd.design as wtfd_design, wtfd.load_index as wtfd_load_index,wtfd.tire_size as wtfd_tire_size, wtfd.speed_index as wtfd_speed_index,
            wtrd.width as wtrd_width, wtrd.height as wtrd_height, wtrd.design as wtrd_design, wtrd.load_index as wtrd_load_index,  wtrd.tire_size as wtrd_tire_size, wtrd.speed_index as wtrd_speed_index,
            wtrim.id as wt_rim_id, wtrim.name as wt_rim_name, 
            wtfb.name as wtf_brand_name, 
            wtrb.name as wtr_brand_name,

            at.front_tirebrandid as at_front_tirebrandid, at.rear_tirebrandid as at_rear_tirebrandid, at.front_tirebrandid as at_front_tirebrandid, at.rimid, at.profil_front as at_profil_front, at.profil_rear as at_profil_rear,
            atfd.width as atfd_width, atfd.height as atfd_height, atfd.design as atfd_design, atfd.load_index as atfd_load_index, atfd.tire_size as atfd_tire_size,  atfd.speed_index as atfd_speed_index,
            atrd.width as atrd_width, atrd.height as atrd_height, atrd.design as atrd_design, atrd.load_index as atrd_load_index,atrd.tire_size as atrd_tire_size, atrd.speed_index as atrd_speed_index,
            atrim.id as at_rim_id, atrim.name as at_rim_name,
            atfb.name as atf_brand_name, 
            atrb.name as atr_brand_name
            
        FROM coll_vehicle v
            LEFT OUTER JOIN coll_tire st ON st.id = v.summer_tire_id
            LEFT OUTER JOIN coll_tire_dimention stfd ON stfd.id = st.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention strd ON strd.id = st.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim strim ON strim.id = st.rimid
            LEFT OUTER JOIN coll_tire_brands stfb ON stfb.id = st.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands strb ON strb.id = st.rear_tirebrandid

            LEFT OUTER JOIN coll_tire wt ON wt.id = v.winter_tire_id
            LEFT OUTER JOIN coll_tire_dimention wtfd ON wtfd.id = wt.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention wtrd ON wtrd.id = wt.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim wtrim ON wtrim.id = wt.rimid
            LEFT OUTER JOIN coll_tire_brands wtfb ON wtfb.id = wt.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands wtrb ON wtrb.id = wt.rear_tirebrandid

            LEFT OUTER JOIN coll_tire at ON at.id = v.allseason_tire_id
            LEFT OUTER JOIN coll_tire_dimention atfd ON atfd.id = at.front_dimentionid
            LEFT OUTER JOIN coll_tire_dimention atrd ON atrd.id = at.rear_dimentionid
            LEFT OUTER JOIN coll_tire_rim atrim ON atrim.id = at.rimid
            LEFT OUTER JOIN coll_tire_brands atfb ON atfb.id = at.front_tirebrandid
            LEFT OUTER JOIN coll_tire_brands atrb ON atrb.id = at.rear_tirebrandid
        WHERE v.id=$1`; 

        // status=1 means active
        const { rows:vehicles } = await pool.query(queryVehicle,[auctions[0].vehicle_id]);
        if(!(vehicles.length > 0))
            return res.status(200).json(retVal);

        //let vehicle_data = vehicles[0];
        //Photos
        const vehiclePhotosQuery = `SELECT id, url FROM coll_vehicle_photos WHERE vehicleid = $1`;
        const { rows:photos } = await pool.query(vehiclePhotosQuery,[auctions[0].vehicle_id]);

        //Damages
        const vehicleDamagesQuery = `SELECT id, name, price, imageurl FROM coll_vehicle_damage WHERE vehicleid = $1`;
        const { rows:damages } = await pool.query(vehicleDamagesQuery,[auctions[0].vehicle_id]);

        const vehicleCostsQuery = `SELECT id, name, price FROM coll_vehicle_cost WHERE vehicleid = $1`;
        const { rows:costs } = await pool.query(vehicleCostsQuery,[auctions[0].vehicle_id]);

        //Create data structure

        /*damages.forEach(damage => {
            damage.photos = damage.photos?.length > 0 ? damage.photos.split(',') : [];
        });*/

        const vehicle_data = createVehicleObject({ 
            vehicle_data: vehicles[0],
            photos,
            damages,
            costs
        });
        retVal.data = {
            ...auctions[0],
            bid_count: auctions[0]?.bid_count ? parseInt(auctions[0]?.bid_count) : 0,
            vehicle_data 
        };

        return res.status(200).json(retVal);
    }catch(err){
        console.log({getAuctionDetailsError: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


const createVehicleObject = ({ vehicle_data, photos, damages, costs}) => {

    const tags = vehicle_data?.tags?.split(',');

    const resultObj = {
        id: vehicle_data.id,
        vin: vehicle_data.vin,
        brandid: vehicle_data.brandid,
        modelid: vehicle_data.modelid,
        fueltypeid: vehicle_data.fueltypeid,
        colorid: vehicle_data.colorid,
        type_certification: vehicle_data.type_certification,
        internal_number: vehicle_data.internal_number,
        market_date: vehicle_data.market_date,
        battery: vehicle_data.battery,
        service: vehicle_data.service,
        service_price: vehicle_data.service_price,
        mfk: vehicle_data.mfk,
        mfk_price: vehicle_data.mfk_price,
        breaks_front: vehicle_data.breaks_front,
        breaks_rear: vehicle_data.breaks_rear,
        engine_oil_leak: vehicle_data.engine_oil_leak,
        engine_oil_leak_price: vehicle_data.engine_oil_leak_price,
        trans_oil_leak: vehicle_data.trans_oil_leak,
        control_light: vehicle_data.control_light,
        trans_type: vehicle_data.trans_type,
        drivable: vehicle_data.drivable,
        axel_loader1: vehicle_data.axel_loader1,
        axel_loader2: vehicle_data.axel_loader2,
        note: vehicle_data.note,
        millage: vehicle_data.millage,
        small: vehicle_data.small === 'true' || false,
        small_price: vehicle_data.small_price,
        big: vehicle_data.big === 'true' || false,
        big_price: vehicle_data.big_price,
        price_breaks_front: vehicle_data.price_breaks_front,
        price_breaks_rear: vehicle_data.price_breaks_rear,
        price_trans_oil_leak: vehicle_data.price_trans_oil_leak,
        price_control_light: vehicle_data.price_control_light,
        interior: vehicle_data.interior,
        type: vehicle_data.type,
        tags: tags,
        summerTires : vehicle_data.summer_tire_id ? {
            front_tirebrandid: vehicle_data.st_front_tirebrandid,
            rear_tirebrandid: vehicle_data.st_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.stf_brand_name,
            rear_tirebrand_name: vehicle_data.str_brand_name,
            profil_front: vehicle_data.st_profil_front,
            profil_rear: vehicle_data.st_profil_rear,
            rim_name: vehicle_data.st_rim_name,
            rim_id: vehicle_data.st_rim_id,
            frontDimension: {
                width: vehicle_data.stfd_width,
                height: vehicle_data.stfd_height,
                design: vehicle_data.stfd_design,
                load_index: vehicle_data.stfd_load_index,
                size: vehicle_data.stfd_tire_size,
                speed_index: vehicle_data.stfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.strd_width,
                height: vehicle_data.strd_height,
                design: vehicle_data.strd_design,
                load_index: vehicle_data.strd_load_index,
                size: vehicle_data.strd_tire_size,
                speed_index: vehicle_data.strd_speed_index,
            },
        } : null,
        winterTires : vehicle_data.winter_tire_id ? {
            front_tirebrandid: vehicle_data.wt_front_tirebrandid,
            rear_tirebrandid: vehicle_data.wt_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.wtf_brand_name,
            rear_tirebrand_name: vehicle_data.wtr_brand_name,
            profil_front: vehicle_data.wt_profil_front,
            profil_rear: vehicle_data.wt_profil_rear,
            rim_name: vehicle_data.wt_rim_name,
            rim_id: vehicle_data.wt_rim_id,
            frontDimension: {
                width: vehicle_data.wtfd_width,
                height: vehicle_data.wtfd_height,
                design: vehicle_data.wtfd_design,
                load_index: vehicle_data.wtfd_load_index,
                size: vehicle_data.wtfd_tire_size,
                speed_index: vehicle_data.wtfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.wtrd_width,
                height: vehicle_data.wtrd_height,
                design: vehicle_data.wtrd_design,
                load_index: vehicle_data.wtrd_load_index,
                size: vehicle_data.wtrd_tire_size,
                speed_index: vehicle_data.wtrd_speed_index,
            },
        } : null,
        allseasonTires : vehicle_data.allseason_tire_id ? {
            front_tirebrandid: vehicle_data.at_front_tirebrandid,
            rear_tirebrandid: vehicle_data.at_rear_tirebrandid,
            front_tirebrand_name: vehicle_data.atf_brand_name,
            rear_tirebrand_name: vehicle_data.atr_brand_name,
            profil_front: vehicle_data.at_profil_front,
            profil_rear: vehicle_data.at_profil_rear,
            rim_name: vehicle_data.at_rim_name,
            rim_id: vehicle_data.at_rim_id,
            frontDimension: {
                width: vehicle_data.atfd_width,
                height: vehicle_data.atfd_height,
                design: vehicle_data.atfd_design,
                load_index: vehicle_data.atfd_load_index,
                size: vehicle_data.atfd_tire_size,
                speed_index: vehicle_data.atfd_speed_index,
            },
            rearDimension: {
                width: vehicle_data.atrd_width,
                height: vehicle_data.atrd_height,
                design: vehicle_data.atrd_design,
                load_index: vehicle_data.atrd_load_index,
                size: vehicle_data.atrd_tire_size,
                speed_index: vehicle_data.atrd_speed_index,
            },
        } : null,
        photos,
        damages,
        costs
    };

    return resultObj;
}

router.route('/deleteAuction').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '' };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        const { auctionId } = req.body;
        //fetch data 
        const query1 = `DELETE from bid WHERE auctionid=$1`;
        await pool.query(query1,[auctionId]);

        console.log({
            query1
        });
        const query2 = `DELETE from auction WHERE id=$1`;
        await pool.query(query2,[auctionId]);

        return res.status(200).json(retVal);
    }catch(err){
        console.log({closeDealError: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/closeDeal').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', data: null };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        const { auctionId } = req.body;
        //fetch data 
        const data = await closeDeal({ 
            accountid: req.user.accountid, 
            auctionId
        });

        if(!data){
            retVal.msg = "Error while closing the deal.";
        }else {
            
        }

        retVal.data = data;

        return res.status(200).json(retVal);
    }catch(err){
        console.log({ closeDealError: err });
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


const closeDeal = async (data) => {
    const { accountid, auctionId  } = data

    try {
        const buyerPromise = findBuyerId({ auctionId });
        const pricePromise = getAuctionPrices({ auctionId });

        buyer = await buyerPromise;
        if(!buyer) {
            const query = `UPDATE auction a SET status=0 WHERE a.id=$1 AND a.accountid = $2`;
            await pool.query(query,[auctionId, accountid]);

            return data;
        }

        /*const query = `UPDATE auction a SET status=2, buyerid=$3 WHERE a.id=$1 AND a.accountid = $2`;
        await pool.query(query,[auctionId, accountid, buyer]);

        const query2 = `UPDATE coll_vehicle SET type = 'archive' WHERE id = (SELECT vehicleid FROM auction WHERE id = $1)`;
        await pool.query(query2, [auctionId]);*/

        priceObj = await pricePromise;
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

        const emailList = await getEmails({ acc1: accountid, acc2: buyer });
        const emailInfo = await sendEmail({
            subject: 'Car sold confirmation',
            text: 'Car sold confirmation',
            to: emailList,
        });
       

        return {...data, emailList};
    } catch (error) {
        console.log({closeDealError : error});
        return { error: error.message };
    }
}
/*
const closeDealOld = async (data) => {
    const { accountid, auctionId  } = data

    try {
        const buyerPromise = findBuyerId({ auctionId });
        const pricePromise = getAuctionPrices({ auctionId });

        buyer = await buyerPromise;
        if(!buyer) {
            const query = `UPDATE auction a SET status=0 WHERE a.id=$1 AND a.accountid = $2`;
            await pool.query(query,[auctionId, accountid]);

            return data;
        }

        const query = `UPDATE auction a SET status=2, buyerid=$3 WHERE a.id=$1 AND a.accountid = $2`;
        await pool.query(query,[auctionId, accountid, buyer]);

        const query2 = `UPDATE coll_vehicle SET type = 'archive' WHERE id = (SELECT vehicleid FROM auction WHERE id = $1)`;
        await pool.query(query2, [auctionId]);

        priceObj = await pricePromise;
        if(priceObj){
            const { seller_fee, buyer_fee } = priceObj;

            let curr_time = moment().unix();

            const queryPayment = `INSERT INTO public.payment(creation_date, price, accountid, type, state) VALUES ($1, $2, $3, $4, $5),($6, $7, $8, $9, $10)`;
            await pool.query(queryPayment,[
                curr_time, buyer_fee,  accountid, 'CAR_SELLER', 0,
                curr_time, seller_fee,  buyer, 'CAR_BUYER', 0
            ]);
        }

        const emailList = await getEmails({ acc1: accountid, acc2: buyer });
        const emailInfo = await sendEmail({
            subject: 'Car sold confirmation',
            text: 'Car sold confirmation',
            to: emailList,
        });
       

        return {...data, emailList};
    } catch (error) {
        console.log({closeDealError : error});
        return { error: error.message };
    }
}
*/

router.route('/testemail').post(async function (req, res) {
    let retVal = { msg: '', data: null };
	try
	{
        let accountid = 1;

        const emailList = await getEmails({ acc1: accountid, acc2: accountid });


        retVal.data = emailList;

        return res.status(200).json(retVal);
    }catch(err){
        console.log({ closeDealError: err });
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


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

const sendEmail = async ({ subject, text, to}) => {
    try {
        let transporter2 = nodemailer.createTransport({
            service: "Outlook365",// "Outlook365",
            auth: {
              user: 'garage@revo-innovations.com',
              pass: 'YWxK=m[yEWym-tofO]i/I7R-/o+XmdEo'
            },tls: {
                rejectUnauthorized: false
            }
        });
    
        // send mail with defined transport object
        let info = await transporter2.sendMail({
            from: '"Revo Garage" <garage@revo-innovations.com>', // sender address
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
        const query = `SELECT * FROM bid WHERE auctionid=$1 ORDER BY creation_date DESC LIMIT 1`;
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

const getAuctionPrices = async ({auctionId}) => {
    try {
        const query = `SELECT start_price, current_price FROM auction WHERE id=$1`;
        const { rows } = await pool.query(query,[auctionId]);
        if(rows.length > 0){
            const auction = rows[0];

            const profit = getProfit(auction.start_price,auction.current_price);
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


/*const closeDeal = async ({ accountid, auctionId }) => {
    try {
        const query = `UPDATE auction a SET status=2 WHERE a.id=$1 AND a.accountid = $2`;
        await pool.query(query,[auctionId, accountid]);

        return {
            auctionId,
            accountid
        }
    } catch (error) {
        console.log({closeDealError : error});
        return null;
    }
}*/

router.route('/extendAuctionTime').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auction: null };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        const { days, minutes, auctionId } = req.body;
        const data = await extendAuctionTime({ accountid: req.user.accountid, days, minutes, auctionId });

        retVal.auction = data;
        retVal.msg = data ? '' : 'Error while extending time.';
        return res.status(200).json(retVal);
    }catch(err){
        console.log({extendAuctionTimeError: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const extendAuctionTime = async ({ accountid, days, minutes, auctionId }) => {
    try {
        const { rows } = await pool.query('SELECT * FROM auction WHERE id =$1 AND accountid = $2',[auctionId, accountid]);
        
        if(!rows || rows.length <= 0){
            return null;
        }

        const { expiration_date } = rows[0];
        const new_date = moment(parseInt(expiration_date) * 1000)
            .add(minutes || 0, 'minutes')
            .add(days || 0, 'days')
            .unix();

        const query = `UPDATE auction a SET expiration_date=$1 WHERE a.id=$2 AND a.accountid = $3`;
        await pool.query(query,[new_date, auctionId, accountid]);

        return {
            auctionId,
            new_expiration_date: new_date
        }
    } catch (error) {
        console.log({extendAuctionTimeError : error});
        return null;
    }
}



router.route('/getBoughtAuctionVehicles').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [] };
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const hasPermission = await getAccountRoles(roles, req.user.accountid);
        if (!hasPermission) {res.sendStatus(401); return;}

        const { brands, models, fromYear, toYear, fromPrice, toPrice, fromMillage, toMillage } = req.body;
        await checkUnclosedDeals();

        //fetch data
        let query = `SELECT  x.bid_count, CAST(coalesce(v.market_date, '0') AS integer) as market_date, p.url as img_url, m.name as model_name, b.name as brand_name, m.id as model_id, b.id as brand_id, a.start_date, a.expiration_date, a.current_price, a.accountid, a.id as auction_id, a.start_price, v.id as vehicle_id, v.millage FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT OUTER JOIN (SELECT auctionid, count(*) bid_count FROM bid GROUP BY auctionid) x ON x.auctionid = a.id
            LEFT JOIN coll_vehicle_photos p ON p.id = ( 
                SELECT id FROM coll_vehicle_photos
                WHERE vehicleid = a.vehicleid
                ORDER BY id ASC
                LIMIT 1
            )
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
        WHERE a.status=2 AND a.buyerid=$1`;
        
        let params = [req.user.accountid];
        
        if(brands && brands.length > 0){
            query += ` AND v.brandid IN (`;
            for (let i = 0; i < brands.length; i++) {
                const brandId = brands[i];
                query += brandId;
                if(i + 1 < brands.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(models && models.length > 0){
            query += ` AND v.modelid IN (`;
            for (let i = 0; i < models.length; i++) {
                const modelId = models[i];

                query += modelId;
                if(i + 1 < models.length){
                    query += ',';
                }
            }
            query += ')';
        }

        if(fromYear > 0 && toYear > 0){
            query += ` AND v.market_date >= $${params.length + 1} AND v.market_date <= $${params.length + 2}`;
            const from_year = moment('01/01/' + fromYear).startOf('year').unix();
            const to_year = moment('01/01/' + toYear).startOf('year').unix();

            params.push(from_year);
            params.push(to_year);
        }

        if(fromPrice > 0 && toPrice > 0){
            query += ` AND a.current_price >= $${params.length + 1} AND a.current_price <= $${params.length + 2}`;

            params.push(fromPrice);
            params.push(toPrice);
        }

        if(fromMillage > 0 && toMillage > 0){
            query += ` AND v.millage >= $${params.length + 1} AND v.millage <= $${params.length + 2}`;

            params.push(fromMillage);
            params.push(toMillage);
        }
            
        query += '  ORDER BY a.id';
        // status=1 means active
        const { rows: auctions } = await pool.query(query,params);
        //let auctions = rows.reduce((acc,row) => acc.find((a) => a.auction_id === row.auction_id) ? acc : [...acc, row], [])
        /*let auctions = []

        rows.forEach(row => {
            let find = auctions.find((a) => a.auction_id === row.auction_id);
            if(!find){
                auctions.push(row);
            }
        });*/
        retVal.auctions = auctions.map((auction) => ({
            ...auction,
            bid_count: auction?.bid_count ? parseInt(auction?.bid_count) : 0,
        }));
        
        return res.status(200).json(retVal);
    }catch(err){
        console.log({getBoughtAuctions: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const checkUnclosedDeals = async () => {
    const curr_date = moment().unix();
    try {
        //fetch data 
        const query = `SELECT a.id as auction_id, b.accountid as buyer_id, a.accountid as seller_id, a.status FROM auction a
            LEFT JOIN bid b ON b.id = ( 
                SELECT id FROM bid
                    WHERE auctionid = a.id
                ORDER BY creation_date DESC
                LIMIT 1
            )
        WHERE a.status = 1 AND a.expiration_date < $1 
        ORDER BY a.id`;

        const { rows } = await pool.query(query,[curr_date]);
        for (let i = 0; i < rows.length; i++) {
            const { seller_id, auction_id } = rows[i];
            const good = await closeDeal({ accountid: seller_id, auctionId: auction_id});
        }

        return true;
    } catch (error) {
        return false
    }
}

/*

router.route('/getAccountRoles').post( async function (req, res) {
    let retVal = {  msg: ''};
    try {
        const rez = await getAccountRoles(roles, 82);

        return res.status(200).json({ msg: "", rez});
    } catch (error) {
        console.log({ getWorkError: error.message });
        retVal.msg = error.message;
        return res.status(200).json(retVal);
    }
});*/

const getAccountRoles = async (accountRoles, accountID) => {
    const query = `SELECT role FROM account WHERE accountid=$1 AND role = ANY ($2)`;
    const response = await pool.query(query, [accountID, accountRoles]);
    let rows = response.rows;

    console.log({rows});
    if (rows.length > 0) {
        return true;
    }
    else {
        return false;
    }
}


module.exports = router;
