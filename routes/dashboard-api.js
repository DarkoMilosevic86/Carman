const express = require('express');
const router = express.Router();
const pool = require("../database");
const config = require('../config/config');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const PDFDocument = require("pdfkit-table");  
const moment = require('moment');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require("nodemailer");
const _ = require("lodash");

var bcrypt = require('bcrypt');

const cryptPassword = (password, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
        if (err) 
            return callback(err);

        bcrypt.hash(password, salt, function(err, hash) {
            return callback(err, hash);
        });
    });
};

const comparePassword = (plainPass, hashword, callback) => {
   bcrypt.compare(plainPass, hashword, (err, isPasswordMatch) => {   
       return err == null ?
           callback(null, isPasswordMatch) :
           callback(err);
   });
};

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, moment().unix() + '_' + file.originalname);
    }
});


var upload = multer({ storage: storage });

/* SUPER USER START  */
router.route('/superLogin').post(async function (req, res) {
	try
	{
		var retVal = { idToken : null, msg : '', isAdmin: false};
		if (!req.body) {res.status(200).json(retVal);  return; }

        let query = 'SELECT * FROM superuser WHERE username = $1';
        const admins = await pool.query(query,[req.body.username]);
        let adminRows = admins.rows;
        let user_db = null;

        if(adminRows !== undefined && adminRows !== null && adminRows.length > 0){
            user_db = adminRows[0];
            match = true;

            comparePassword(req.body.password,user_db.password, (err, isMatch) => {
                if(true || (!err && isMatch)){
            
                    const token = jwt.sign({ id: user_db.id, username : req.body.username, isAdmin : true}, config.serverSecretKey, { expiresIn: '2d' });
                    retVal.idToken = token;
                    retVal.isAdmin = true;
                }else {
                    retVal.msg = 'Password is not valid';
                }
                
                return res.status(200).json(retVal);
            })
        }else {
            res.status(200).json(retVal);
        }
	}
	catch(err) {
        console.log(err);
		res.status(200).json([]);
	}
});
/*
// Login Endpoint
app.get('/sendSmsVerificationCode2', (req,res) => {
    

    if (req.query.phonenumber) {
       client
       .verify
       .services("VA317de516df378abf07b341e5be71a6d5")
       .verifications
       .create({
           to: `+${req.query.phonenumber}`,
           channel: 'sms' 
       })
       .then(data => {
           console.log({
               data
           });
           res.status(200).send({
               message: "Verification is sent!!",
               phonenumber: req.query.phonenumber,
               data
           })
       })
    } else {
        console.log({
            daa: "err"
        });
       res.status(400).send({
           message: "Wrong phone number :(",
           phonenumber: req.query.phonenumber,
           data
       })
    }
})

// Verify Endpoint
app.get('/verifySmsVerificationCode', (req, res) => {
    try {
        
        
        if (req.query.phonenumber && (req.query.code).length === 6) {
    
            client
            .verify
            .services("VA317de516df378abf07b341e5be71a6d5")
            .verificationChecks
            .create({
                to: `+${req.query.phonenumber}`,
                code: req.query.code
            })
            .then(data => {
                console.log({
                    data
                });
                if (data.status === "approved") {
                    res.status(200).send({
                        message: "User is Verified!!",
                        data
                    })
                }
            }).catch((err) => {
                res.status(200).send({
                    message: "Wrong phone number or code :(",
                    phonenumber: req.query.phonenumber,
                })
            });
       } else {
           res.status(400).send({
               message: "Wrong phone number or code :(",
               phonenumber: req.query.phonenumber,
           })
       }
    } catch (error) {
        res.status(200).send({
            message: "Something went wrong!"
        })
    }
   
})
*/
router.route('/createNewUser').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	let retVal = { success : false, msg : '', isNameAvailable: true };

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { username, password, firstName, lastName } = req.query;

        const query = 'SELECT * FROM users WHERE username = $1';
        const { rows } = await pool.query(query,[username]);
        if(rows !== undefined && rows !== null && rows.length > 0){
            retVal.msg = 'Username already exist';
            retVal.isNameAvailable = true;

            return res.status(200).json(retVal);
        }

        cryptPassword(password, async (err, hash) => {
            if(!err){
                const queryInsert = 'INSERT INTO users (username, password, firstname, lastname) VALUES ($1,$2,$3,$4)  RETURNING id';
                await pool.query(queryInsert,[username, hash, firstName, lastName]);
    
                retVal.success = true;
                retVal.msg = 'Success';
            }else {
                retVal.success = false;
                retVal.msg = 'Error in hashing pass';
            }

            return res.status(200).json(retVal);
        });
	}
	catch(err) {
        console.log({createNewUser: err});
		res.status(200).json(retVal);
	}
});

//$2b$10$THuRT/ogKoCO2vEWUSFdaOMzmagDyBNSpKrxOhNtP8LyoS9LvrMyS
router.route('/getAllUsers').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', users: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { limit, offset, search } = req.query;
        const query = `SELECT * FROM users WHERE (username LIKE \'%\' || $3 || \'%\' OR firstname LIKE \'%\' || $3 || \'%\') ORDER BY firstname ASC LIMIT $1 OFFSET $2`;
        const { rows } = await pool.query(query,[limit, offset, search]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let queryCount = `SELECT COUNT(*) FROM users WHERE (username LIKE \'%\' || $1 || \'%\' OR firstname LIKE \'%\' || $1 || \'%\')`;
            const countRes = await pool.query(queryCount,[search]);
            
            retVal.count = countRes.rows[0].count;
            retVal.users = rows;

            return res.status(200).json(retVal);
        }else {
            //retVal.msg = 'empty';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        //console.log(err);
		res.status(200).json([]);
	}
});

router.route('/getUserData').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', user: {}};
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { userId } = req.query;
        const query = `SELECT * FROM users WHERE id=$1`;
        const { rows } = await pool.query(query,[userId]);
        if(rows !== undefined && rows !== null && rows.length > 0){
            retVal.user = rows[0];

            return res.status(200).json(retVal);
        }else {
            //retVal.msg = 'empty';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
		res.status(200).json(retVal);
	}
});

router.route('/deleteUser').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', user: {}};
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { userId } = req.query;
        const queryAccount = `SELECT accountid FROM account WHERE userid=$1`;
        const { rows }  = await pool.query(queryAccount,[userId]);

        for (let i = 0; i < rows.length; i++) {
            await deleteAccount(rows[i].accountid);
        }

        const query = `DELETE FROM users WHERE id=$1`;
        await pool.query(query,[userId]);

        res.status(200).json(retVal);
	}
	catch(err) {
        retVal.msg = err.message;
        console.log({err});
		res.status(200).json(retVal);
	}
});


const deleteAccount = async (accountId) => {
    const queryContactDelete = `DELETE FROM contactperson WHERE accountid=$1`;
    await pool.query(queryContactDelete,[
        accountId
    ]);

    const queryDeviceDelete = `DELETE FROM device WHERE accountid=$1`;
    await pool.query(queryDeviceDelete,[ 
        accountId,
    ]);

    const querySmsDocsDelete = `DELETE FROM sms_documents
        WHERE smsid IN (SELECT id 
        FROM sms 
        WHERE accountid =$1)`;
    await pool.query(querySmsDocsDelete,[
        accountId
    ]);

    const queryCustomerSmsGroupDelete = `DELETE FROM customer2smsgroup
        WHERE customerid IN (SELECT id 
        FROM customer 
        WHERE accountid =$1)`;
    await pool.query(queryCustomerSmsGroupDelete,[
        accountId
    ]);

    const queryCustomerSmsTemplateDelete = `DELETE FROM customer2smstemplate
        WHERE customerid IN (SELECT id 
        FROM customer 
        WHERE accountid =$1)`;
    await pool.query(queryCustomerSmsTemplateDelete,[
        accountId
    ]);

    const querySmsGroupDelete = `DELETE FROM smsgroup WHERE accountid=$1`;
    await pool.query(querySmsGroupDelete,[
        accountId
    ]);

    const queryCustomerSmsTemplatedDocsDelete = `DELETE FROM smstemplate_documents
        WHERE smstemplateID IN (SELECT id 
        FROM smstemplate 
        WHERE accountid =$1)`;
    await pool.query(queryCustomerSmsTemplatedDocsDelete,[
        accountId
    ]);

    const querySmsTemplateDelete = `DELETE FROM smstemplate WHERE accountid=$1`;
    await pool.query(querySmsTemplateDelete,[
        accountId
    ]);

    const querySmsDelete = `DELETE FROM sms WHERE accountid=$1`;
    await pool.query(querySmsDelete,[
        accountId
    ]);

    const queryCustomerImagesDelete = `DELETE FROM customer_images
        WHERE customerid IN (SELECT id 
        FROM customer 
        WHERE accountid =$1)`;
    await pool.query(queryCustomerImagesDelete,[
        accountId
    ]);

    const queryDriveDelete = `DELETE FROM drive WHERE accountid=$1`;
    await pool.query(queryDriveDelete,[
        accountId
    ]);

    const queryVehicleDelete = `DELETE FROM vehicle WHERE accountid=$1`;
    await pool.query(queryVehicleDelete,[
        accountId
    ]);


    const queryCustomerDelete = `DELETE FROM customer WHERE accountid=$1`;
    await pool.query(queryCustomerDelete,[
        accountId
    ]);

    const querylicenseplateDelete = `DELETE FROM licenseplate WHERE accountid=$1`;
    await pool.query(querylicenseplateDelete,[
        accountId
    ]);

    const queryRightsDelete = `DELETE FROM rights WHERE accountid=$1`;
    await pool.query(queryRightsDelete,[
        accountId
    ]);

    const querybilled_smsDelete = `DELETE FROM billed_sms WHERE accountid=$1`;
    await pool.query(querybilled_smsDelete,[
        accountId
    ]);
    
    await deleteAuctions({ accountid: accountId});
    await deleteVehicle({ accountid: accountId});

    const vehicleTireQuery = `DELETE FROM coll_tire WHERE accountid = $1`;
    await pool.query(vehicleTireQuery, [accountId]);

    const vehicleTireDimQuery = `DELETE FROM coll_tire_dimention WHERE accountid=$1`;
    await pool.query(vehicleTireDimQuery, [accountId]);

    const vehicleDimQuery = `DELETE FROM coll_dimention WHERE accountid=$1`;
    await pool.query(vehicleDimQuery, [accountId]);

    const queryEmployeeDelete = `DELETE FROM employee WHERE accountid=$1`;
    await pool.query(queryEmployeeDelete,[accountId]);

    const queryAccountDelete = `DELETE FROM account WHERE accountid=$1`;
    await pool.query(queryAccountDelete,[ 
        accountId,
    ]);
}


const deleteVehicle = async ({ accountid }) => {
    try {
        const costSelectQuery = `SELECT * FROM coll_vehicle_cost WHERE accountid=$1`;
        const costSelectResponse = await pool.query(costSelectQuery, [accountid]);
        let costSelectRows = costSelectResponse.rows;
        if (costSelectRows.length > 0) {
            const costDeleteQuery = `DELETE FROM coll_vehicle_cost WHERE accountid=$1`;
            const costDeleteResponse = await pool.query(costDeleteQuery, [accountid]);
        }
        const damageSelectQuery = `SELECT * FROM coll_vehicle_damage WHERE accountid=$1`;
        const damageSelectResponse = await pool.query(damageSelectQuery, [accountid]);
        let damageSelectRows = damageSelectResponse.rows;
        if (damageSelectRows.length > 0) {
            const damageDeleteQuery = `DELETE FROM coll_vehicle_damage WHERE accountid=$1`;
            const damageDeleteResponse = await pool.query(damageDeleteQuery, [accountid]);
        }
        const photosSelectQuery = `SELECT * FROM coll_vehicle_photos WHERE accountid=$1`;
        const photosSelectResponse = await pool.query(photosSelectQuery, [accountid]);
        let photosSelectRows = photosSelectResponse.rows;
        if (photosSelectRows.length > 0) {
            const photosDeleteQuery = `DELETE FROM coll_vehicle_photos WHERE accountid=$1`;
            const photosDeleteResponse = await pool.query(photosDeleteQuery, [accountid]);
        }
        
        const vehicleSelectQuery = `SELECT id FROM coll_vehicle WHERE accountid=$1`;
        const vehicleSelectResponse = await pool.query(vehicleSelectQuery, [accountid]);


        let vehicleSelectRows = vehicleSelectResponse.rows;
        if (vehicleSelectRows.length > 0) {

            const vehicleDeleteQuery = `DELETE FROM coll_vehicle WHERE accountid=$1`;
            const vehicleDeleteResponse = await pool.query(vehicleDeleteQuery, [accountid]);
            
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        console.log({
            deleteVehicle: error
        });
        return false;
    }
    
}

const deleteAuctions = async ({ accountid }) => {
    try {
        //fetch data 
        const query1 = `DELETE from bid b
            WHERE b.accountid=$1 OR auctionid IN (SELECT id 
                FROM auction 
                WHERE accountid =$1)
        `;
        await pool.query(query1,[accountid]);

        const query2 = `DELETE from auction WHERE accountid=$1`;
        await pool.query(query2,[accountid]);
    } catch (error) {
        console.log({error});
    }
}

router.route('/saveUserData').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', user: {}};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { userId, username, firstname, lastname, roles, newPassword } = req.query;

        if(newPassword && newPassword.length > 0){
            cryptPassword(newPassword, async (err, hash) => {
                if(!err){
                    const query = `UPDATE public.users SET username=$1, role=$2, firstname=$3, lastname=$4, password=$6 WHERE id=$5;`;
                    await pool.query(query,[ username, roles, firstname, lastname, userId, hash]);
                    retVal.success = true;
                    retVal.msg = '';
                }else {
                    retVal.success = false;
                    retVal.msg = 'Error in hashing pass';
                }
    
                return res.status(200).json(retVal);
            });
            
        }else {
            const query = `UPDATE public.users SET username=$1, role=$2, firstname=$3, lastname=$4 WHERE id=$5;`;
            await pool.query(query,[ username, roles, firstname, lastname,userId]);
        }

        

        res.status(200).json(retVal);
	}
	catch(err) {
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});


/* SUPER USER END  */


/*  USER START  */
/*
router.route('/userLogin').post(async function (req, res) {
	try
	{
		var retVal = { idToken : null, msg : '', isAdmin: false, validity: 0};
		if (!req.body) {res.status(200).json(retVal);  return; }

        let query = 'SELECT * FROM users WHERE username = $1';
        const { rows } = await pool.query(query,[req.body.username]);

        let user_db = null;

        if(rows.length <= 0){    
            return res.status(200).json(retVal);
        }

        user_db = rows[0];
        comparePassword(req.body.password,user_db.password, (err, isPasswordMatch) => {
            if (isPasswordMatch) {
                token = jwt.sign({ id: user_db.id, username : req.body.username}, config.serverSecretKey, { expiresIn: 10 });
                retVal.idToken = token;
                retVal.validity = 0;
            } 
            else {
                retVal.msg = 'Password is not valid';
            }

            return res.status(200).json(retVal);
        })
	}
	catch(err) {
		res.status(200).json([]);
	}
});
*/

router.route('/createAccount').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accountId: undefined};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.create){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { 
            username,
            password,
            email,
            phoneNumber,
            companyLogo,
            companyName,
            location,
            streetNumber,
            city,
            place,
            note,
            maxDevices,
            demoDays,
            isSms,
            isDemoAccount,
            hasDevices,
            persons,
            isDemo
        } = req.body;

        const creationDate = moment().unix();

        const queryInsert = 'INSERT INTO account (userid, username, password, companyname, companylogo, phone, email, note, maxdevices, isactive,isSms,datebirth,demodays,creationdate,street, number, city, place) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)  RETURNING accountid';
        const { rows } = await pool.query(queryInsert,[ 
            req.user.id,
            username,
            password,
            companyName,
            companyLogo,
            phoneNumber,
            email,
            note,
            maxDevices || 0,
            isDemoAccount ? 0 : 1,
            isSms,
            location,
            demoDays || 0,
            creationDate,
            location,
            streetNumber,
            city,
            place,
        ]);

        if(rows !== undefined && rows !== null && rows.length > 0){
            retVal.accountId = rows[0].accountid;

            if(persons && persons.length > 0){

                persons.forEach(async (person) => {
                    var queryContact = `INSERT INTO contactperson( name, accountid) VALUES ($1, $2)`;
                    await pool.query(queryContact,[ person, rows[0].accountid]);
                });
            }
            
            return res.status(200).json(retVal);
        }else {
            retVal.msg = 'ERROR';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({createAccount: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});

router.route('/getAllLicenseAccountsByUserId').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            return res.status(401).send('Auth Error');
        }

        const { search, limit, offset } = req.query;
        const query = `SELECT a.*  FROM account a
            WHERE isactive=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')  ORDER BY creationdate DESC LIMIT $2 OFFSET $3
        `;

        const {rows} = await pool.query(query,[search, limit, offset]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let queryCount = `SELECT COUNT(*) FROM account a 
            WHERE isactive=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')`;
            const countRes = await pool.query(queryCount,[/*req.user.id,*/ search]);
            
            retVal.count = countRes.rows[0].count;
            retVal.accounts = rows;
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllLicenseAccountsByUserIdError: err});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

router.route('/getAllDemoAccountsByUserId').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { search, limit, offset } = req.query;
        const query = `SELECT * FROM account a
            WHERE isactive=false AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')  ORDER BY creationdate DESC LIMIT $2 OFFSET $3
        `;

        const {rows} = await pool.query(query,[ search, limit, offset]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let queryCount = `SELECT COUNT(*) FROM account a 
            WHERE isactive=false AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')`;
            const countRes = await pool.query(queryCount,[ search]);
            
            retVal.count = countRes.rows[0].count;
            retVal.accounts = rows;
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllDemoAccountsByUserIdError: err});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

router.route('/getOneAccountDetails').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', account: { persons: [], devices: [], sms: [], billedSmsArray: []}};
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { accountId } = req.query;
        const query = `SELECT *  FROM account
            WHERE accountid=$1
        `;

        const {rows} = await pool.query(query,[accountId]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            const queryPersons = `SELECT * FROM contactperson WHERE accountid=$1`;
            const personsRes = await pool.query(queryPersons,[accountId]);

            const queryDevice = `SELECT * FROM device WHERE accountid=$1`;
            const deviceRes = await pool.query(queryDevice,[accountId]);

            const queryEmployees = `SELECT * FROM employee WHERE accountid=$1`;
            const empoyeesResponse = await pool.query(queryEmployees,[accountId]);

            const querySms = `SELECT * FROM sms WHERE accountid=$1 order by date`;
            const smsRes = await pool.query(querySms,[accountId]);
            const sms_struct_array = await getSmsArrayStructure({ smsRes });

            const billedSmsArray  = await getAllBilledSmsForAccount({ accountId });
            
            retVal.account = {
                persons: personsRes.rows,
                devices: deviceRes.rows,
                employees: empoyeesResponse.rows,
                sms: sms_struct_array,
                billedSmsArray: billedSmsArray,
                ...rows[0]
            };
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getOneAccountDetailsError: err});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

const getDaysArray = () => {
    let days = [];
    for (let i = 0; i < 31; i++) {
        days.push({
            day : i + 1, total: 0
        })
    }

    return days;
}

const getSmsArrayStructure = async ({ smsRes }) => {
    let sms_struct_array = [];
    if(smsRes.rows && smsRes.rows.length > 0){
        let sms_array = smsRes.rows;
        let new_array = [];
        let [index, year, month, day] = [-1,0,0, 0];


        sms_array.forEach(item => {
            var sentDate = moment(item.date * 1000);
            var sms_day = parseInt(sentDate.format('D'));
            var sms_month = parseInt(sentDate.format('M'));
            var sms_year = parseInt(sentDate.format('YYYY'));

            if(sms_year != year){
                index++;
                year = sms_year;
                month = sms_month;
                let daysObj = getDaysArray();

                new_array.push(
                    {
                        year: sms_year,
                        total: 1,
                        months: [
                            { month : 'January', total: 0, days: getDaysArray()},
                            { month : 'February', total: 0, days: getDaysArray()},
                            { month : 'March', total: 0, days: getDaysArray()},
                            { month : 'April', total: 0, days: getDaysArray()},
                            { month : 'May', total: 0, days: getDaysArray()},
                            { month : 'Jun', total: 0, days: getDaysArray()},
                            { month : 'Jul', total: 0, days: getDaysArray()},
                            { month : 'Avgust', total: 0, days: getDaysArray()},
                            { month : 'September', total: 0, days: getDaysArray()},
                            { month : 'October', total: 0, days: getDaysArray()},
                            { month : 'November', total: 0, days: getDaysArray()},
                            { month : 'December', total: 0, days: getDaysArray()},
                        ]
                    }
                );
                new_array[index].months[sms_month - 1].total = 1;
                new_array[index].months[sms_month - 1].total = 1;
                console.log("add day",{
                    item
                });
                new_array[index].months[sms_month - 1].days[sms_day - 1].total = 1;
            }
            else {
                new_array[index].total += 1;
                new_array[index].months[sms_month - 1].total += 1;
                new_array[index].months[sms_month - 1].days[sms_day - 1].total  += 1;
                
            }
        });

        sms_struct_array = new_array.reverse();
    }

    return sms_struct_array;
}

router.route('/updateAccountDetails').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	var retVal = { msg : '', deleteEmployees: []};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.update){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { 
            accountId,
            username,
            password,
            email,
            phoneNumber,
            companyLogo,
            companyName,
            dateBirth,
            streetNumber,
            city,
            place,
            note,
            maxDevices,
            demoDays,
            isSms,
            isDemoAccount,
            hasDevices,
            personsDelete,
            personsAdd,
            deleteEmployees
        } = req.body;

        const queryUpdate = `UPDATE account SET  username=$2, password=$3, companyname=$4, companylogo=$5, phone=$6, email=$7, note=$8, maxdevices=$9,isSms=$10,datebirth=$11, demodays=$12,street=$13,number=$14, city=$15, place=$16 WHERE accountid=$1;`;
        await pool.query(queryUpdate,[ 
            accountId,
            username,
            password,
            companyName,
            companyLogo,
            phoneNumber,
            email,
            note,
            maxDevices || 0,
            isSms,
            dateBirth,
            demoDays,
            dateBirth,
            streetNumber,
            city,
            place,
        ]);

        if(personsAdd && personsAdd.length > 0 ){
            personsAdd.forEach(async (person) => {
                var queryContactInsert = `INSERT INTO contactperson( name, accountid) VALUES ($1, $2)`;
                await pool.query(queryContactInsert,[person, accountId]);
            });
        }

        if(personsDelete && personsDelete.length > 0 ){
            personsDelete.forEach(async (person) => {
                var queryContactDelete = `DELETE FROM contactperson WHERE accountid=$1 AND id=$2`;
                await pool.query(queryContactDelete,[accountId, person]);
            });
        }

        retVal.deleteEmployees = deleteEmployees;

        if(deleteEmployees && deleteEmployees.length > 0 ){
            deleteEmployees.forEach(async (employee) => {
                var queryEmployeeDelete = `DELETE FROM employee WHERE accountid=$1 AND id=$2`;
                await pool.query(queryEmployeeDelete,[accountId, employee]);
            });
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({updateAccountDetails: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});

router.route('/deleteAccount').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accountId: undefined};
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.delete){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { accountId } = req.query;
        /*const queryContactDelete = `DELETE FROM contactperson WHERE accountid=$1`;
        await pool.query(queryContactDelete,[
            accountId
        ]);

        const queryAccountUpdate = `DELETE FROM account WHERE accountid=$1`;
        await pool.query(queryAccountUpdate,[ 
            accountId,
        ]);*/

        await deleteAccount(accountId);

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({deleteAccount: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});


router.route('/activateDemoAccount').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accountId: undefined};
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.update){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { 
            accountId,
        } = req.query;

        const activationDate = moment().unix();
        const queryActivate = `UPDATE account SET isactive=true, creationdate=$2, role=$3 WHERE accountid=$1`;
        await pool.query(queryActivate,[
            accountId,
            activationDate,
            1
        ]);

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({activateDemoAccount: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

router.route('/uploadImages').post(expressJwt({ secret: config.serverSecretKey }),upload.array("files"), async function (req, res) {
    let retVal = { msg: '', logoUrl: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}

        let files = req.files;
        console.log({
            files
        });
        if(files && files.length > 0 ){
            retVal.imageUrl = 'http://93.115.253.83:5000/uploads/' + files[0].filename;
            retVal.logoUrl = 'http://93.115.253.83:5000/uploads/' + files[0].filename;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);

    }catch(err){
        console.log({err : err.message});
        res.status(401);
    }
});

router.route('/testUpload').post(upload.array("files"), async function (req, res) {
    let retVal = { msg: '', logoUrl: ''};

	try
	{
        let files = req.files;
        console.log({
            files
        });

        
        if(files && files.length > 0 ){
            retVal.imageUrl = 'http://93.115.253.83:5000/uploads/' + files[0].filename;
            retVal.logoUrl = 'http://93.115.253.83:5000/uploads/' + files[0].filename;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);
    }catch(err){
        console.log({err : err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/getAllBilledSmsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', billedSmsArray: [], count: 0};
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}
        
        const { accountId, offset, limit } = req.query;
        //Database get billed sms
        const billedSmsArray  = await getAllBilledSmsForAccount({ accountId });
        console.log({
            billedSmsArray
        });
        retVal.billedSmsArray = billedSmsArray.filter((a,i) => (i >= offset) && ( i < (offset + limit)) );
        retVal.count = billedSmsArray.length;
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getAllBilledSmsForAccountError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
    }
});

const getAllBilledSmsForAccount = async ({ accountId }) => {
    //Database get billed sms
    const queryBilledSms = `SELECT chargingdate as date, ammount as total FROM billed_sms WHERE accountid=$1  order by chargingdate desc`;
    const { rows } = await pool.query(queryBilledSms,[accountId]);

    return rows;
}

router.route('/exportAllBilledSmsForUser').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}
        
        const { accountId } = req.query;
        const billedSmsArray  = await getAllBilledSmsForAccount({ accountId });
        const { rows } = await pool.query(`SELECT * FROM account WHERE accountid=$1`,[ 
            accountId,
        ]);     
        // start pdf document
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));

        // -----------------------------------------------------------------------------------------------------
        // Simple Table with Array
        // -----------------------------------------------------------------------------------------------------
        let total = 0;
        billedSmsArray.forEach(element => {
            total+= element.total;
        });

        const tableArray = {
            title: rows[0].companyname + ":  Billed Messages",
            subtitle: "Total: " + total,
            headers: ["Charging Date", "Total"],
            rows: billedSmsArray.map((item) => {
                return [moment(item.date * 1000).format('LLLL'), item.total]
            })
        };
        doc.table( tableArray, { width: 595 }); // A4 595.28 x 841.89 (portrait) (about width sizes)

        
        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportAllBilledSmsForUser: err.message});
        res.status(401);
    }
});

router.route('/exportSmsByYearForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}

        
        const { accountId } = req.query;
        const querySms = `SELECT * FROM sms WHERE accountid=$1 order by date`;
        const smsRes = await pool.query(querySms,[accountId]);
        const sms_struct_array = await getSmsArrayStructure({ smsRes });        // start pdf document
        const { rows } = await pool.query(`SELECT * FROM account WHERE accountid=$1`,[ 
            accountId,
        ]);
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));

        // -----------------------------------------------------------------------------------------------------
        // Simple Table with Array
        // -----------------------------------------------------------------------------------------------------
        let total = 0;
        sms_struct_array.forEach(element => {
            total+= element.total;
        });
        const tableArray = {
            title: rows[0].companyname + ":  Message sent by year",
            subtitle: "Total: " + total,
            headers: ["Year", "Total"],
            rows: sms_struct_array.map((item) => {
                return [item.year, item.total]
            })
        };
        doc.table( tableArray, { width: 595 });

        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportSmsByYearForAccount: err.message});
        res.status(401);
    }
});

router.route('/exportSmsOneYearForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}

        
        const { accountId, year } = req.query;
        const querySms = `SELECT * FROM sms WHERE accountid=$1 order by date`;
        const smsRes = await pool.query(querySms,[accountId]);
        const sms_struct_array = await getSmsArrayStructure({ smsRes });
        const { rows } = await pool.query(`SELECT * FROM account WHERE accountid=$1`,[ 
            accountId,
        ]);
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));

        sms_struct_array.forEach(item => {
            if(item.year == year){
                const tableArray = {
                    title: rows[0].companyname + ": Sent Messages for year " + item.year,
                    subtitle:  "Total : " + item.total,
                    headers: ["Month", "Total"],
                    rows: item.months.map((item2) => {
                        return [item2.month, item2.total]
                    })
                };
                doc.table( tableArray, { width: 595 });
            }
        });

        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportSmsOneYearForAccount: err.message});
        res.status(401);
    }
});

router.route('/exportSmsYearMonthsDaysForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}

        
        const { accountId, year } = req.query;
        const querySms = `SELECT * FROM sms WHERE accountid=$1 order by date`;
        const smsRes = await pool.query(querySms,[ accountId ]);
        const sms_struct_array = await getSmsArrayStructure({ smsRes });
        const { rows } = await pool.query(`SELECT * FROM account WHERE accountid=$1`,[ 
            accountId,
        ]);
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));

        const selected_year = sms_struct_array.find((item) => item.year == year);
        for (let i = 0; i < selected_year.months.length; i++) {
            const item = selected_year.months[i];
            const tableArray = {
                title: rows[0].companyname + ': ' + item.month,
                subtitle:  "Total : " + item.total,
                headers: ["Day", "Total"],
                rows: item.days.map((item2) => {
                    if(item2.total > 0 ){
                        console.log({
                            item2
                        });
                    }
                    return [item2.day, item2.total]
                })
                
            };

            doc.table( tableArray, { width: 595 });
            doc.moveDown(5); // separate tables
        }

        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportSmsYearMonthsDaysForAccount: err.message});
        res.status(401);
    }
});

router.route('/getAllSmsAccountsByUserId').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { search, limit, offset } = req.query;
        const query = `SELECT s.date, a.accountid, a.companyname, a.username, a.datebirth FROM sms s
            LEFT JOIN account a ON s.accountid = a.accountid
            WHERE s.charged!=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')  ORDER BY s.date ASC
        `;

        const { rows } = await pool.query(query,[search]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let accArray = [];
            let index = -1;
            rows.forEach((item) => {
                if(index == -1 || item.accountid != accArray[index].accountid) {
                    accArray.push(
                        {
                            companyName: item.companyname,
                            lastDate: item.date,
                            firstDate: item.date,
                            username: item.username,
                            accountid: item.accountid,
                            datebirth: item.datebirth,
                            total: 1
                        }
                    );

                    index++;
                }
                else {
                    accArray[index].total += 1;
                    accArray[index].lastDate = item.date;
                }
            });

            accArray = accArray.filter((a,i) => (i >= offset) && ( i < (offset + limit)) )
            const queryCount = `SELECT COUNT(DISTINCT s.accountid) FROM sms s
                LEFT JOIN account a ON s.accountid = a.accountid
                WHERE s.charged!=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')`;
            const countRes = await pool.query(queryCount,[search]);
            
            retVal.count = countRes.rows[0].count;
            retVal.accounts = accArray;
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllSmsAccountsByUserIdError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});


router.route('/chargeSmsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : ''};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.create){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { accountId, firstDate, lastDate, total } = req.query;
        const query = `SELECT count(*) FROM sms s
            WHERE s.accountid = $1 AND date <= $2 AND date >= $3
        `;
        const {rows} = await pool.query(query,[accountId, lastDate, firstDate]);

        if(rows !== undefined && rows !== null && rows.length > 0){
            if(rows[0].count && parseInt(rows[0].count) === parseInt(total)){
                /*const queryDelete = `DELETE FROM sms s
                    WHERE s.accountid = $1 AND date <= $2 AND date >= $3
                `;*/
                const queryDelete = `UPDATE sms s
                    SET charged=true
                    WHERE s.accountid = $1 AND date <= $2 AND date >= $3
                `;
                await pool.query(queryDelete,[accountId, lastDate, firstDate]);

                const chargingDate = moment().unix();
                const queryAddBilled = `INSERT INTO billed_sms(
                    accountid, ammount, chargingdate)
                    VALUES ( $1, $2, $3);
                `;
                await pool.query(queryAddBilled,[accountId, total, chargingDate]);
            }else {
                retVal.msg = 'WRONG TOTAL NUMBER';
            }
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllAccountsByUserIdError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

router.route('/getInvitationCode').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', code: null};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }

        if(!req.user?.roles?.create){
            res.status(200).json({ msg: 'Access denied!'});
        }

        const { accountId } = req.body;

        let unicode = uuidv4();
        const INVITATION_CODE = unicode.split('-')[0].toUpperCase();
        const query = `INSERT INTO invite_code(code,accountid,creation_date) VALUES($1,$2,$3) RETURNING code;`;
        const {rows} = await pool.query(query,[INVITATION_CODE, accountId, moment().unix()]);

        if(rows?.length > 0){
            retVal.code = rows[0].code;
        }
        else {
            retVal.msg = 'TRY AGAIN';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllAccountsByUserIdError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});

router.route('/sendInvitationCode').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', code: null};

	try
	{
       /* if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
*/
        const { phone } = req.body;

        let unicode = uuidv4();
        const INVITATION_CODE = unicode.split('-')[0].toUpperCase();
        let userid = undefined;
        if(!(userid && userid > 0)){
            const queryUser = `SELECT id FROM users LIMIT 1`;
            const { rows } = await pool.query(queryUser,[]);
            userid = rows[0].id;    
        }

        const query = `INSERT INTO invite_code(code,userid,creation_date) VALUES($1,$2,$3) RETURNING code;`;
        const { rows } = await pool.query(query,[INVITATION_CODE, userid, moment().unix()]);
        if(rows?.length > 0){
            const msg = await sendSmsWithTwilio("INVITATION CODE: " + rows[0].code, "",phone );
            if(msg?.sid){
                retVal.code = rows[0].code;
                retVal.msg = msg.body;
            }else {
                retVal.msg = 'TRY AGAIN';
            }
        }
        else {
            retVal.msg = 'TRY AGAIN';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllAccountsByUserIdError: err.message});
        retVal.msg =  err.message;
		res.status(200).json(retVal);
	}
});

const sendSmsWithTwilio = async (message, from, to, documents) => {
    try {
        const accountSid3 = 'ACc5fcfc49ac406eb951c50634cbe0b29d';
        const authToken3 = '22dd1f6ba6f2383a5138e44d40ac6955';

        //const client = require('twilio')(accountSid3, authToken3);
        const client = require('twilio')(config.twilioAccountSid, config.twilioAuthToken);


        let options = {
            body: message,
            from: '+41798079449',//'+19382531847',
            to,
            //sendAsMms: documents.length > 0,
            //mediaUrl: documents.length > 0 ? documents[0] : '',
        }

        if(documents?.length > 0){
            //options.sendAsMms = true;
            options.mediaUrl = documents[0];
        }

        const msg = await client.messages.create(options);
        console.log({msg});
        return msg;
    } catch (error) {
        console.log({ sendSmsWithTwilioError : error});
        return null;
    }
}

/*  USER END  */

/* APP START */
router.route('/sendSmsByAccount').post(expressJwt( { secret: config.serverSecretKey } ), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}

        
        const { accountId, message } = req.query;
        const sendingDate = moment().unix();
        //Database insert
        const queryContact = `INSERT INTO sms( message, accountid, date, charged) VALUES ($1, $2, $3, false)`;
        await pool.query(queryContact,[ message, accountId, sendingDate]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({sendSmsByAccountError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
    }
});
/* APP END */
router.route('/sendEmail').post( async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have r.createTestAccount();
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',//testAccount.smtp.host, //"lekaaa111.55@gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                //user1: testAccount.user, // generated ethereal user
                //pass1: testAccount.pass, // generated ethereal password
                user: 'garage@revo-innovations.com',
                pass: 'YWxK=m[yEWym-tofO]i/I7R-/o+XmdEo'
            },tls: {
                rejectUnauthorized: false
            }
        });

        var transporter2 = nodemailer.createTransport({
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
            from: '"Fred Foo 👻" <garage@revo-innovations.com>', // sender address
            to: ["lekaaa111.55@gmail.com"], // list of receivers
            subject: "Hello ✔", // Subject line
            text: "Hello world?", // plain text body
            html: "<b>Hello world?</b>", // html body
        });
    
        console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({sendEmailError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
    }
});


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
            from: '<garage@revo-innovations.com>', // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
        });

        return info;
    } catch (error) {
        return null;
    }
}

/** AUCTIONS  */


router.route('/getAllSmsAccountsByUserId2').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }
        const { search, limit, offset } = req.query;

        const query = `SELECT s.date, a.accountid, a.companyname, a.username, a.datebirth FROM sms s
            LEFT JOIN account a ON s.accountid = a.accountid
            WHERE s.charged!=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')  ORDER BY s.date ASC
        `;

        const { rows } = await pool.query(query,[search]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let accArray = [];
            let index = -1;
            rows.forEach((item) => {
                if(index == -1 || item.accountid != accArray[index].accountid) {
                    accArray.push(
                        {
                            companyName: item.companyname,
                            lastDate: item.date,
                            firstDate: item.date,
                            username: item.username,
                            accountid: item.accountid,
                            datebirth: item.datebirth,
                            total: 1
                        }
                    );

                    index++;
                }
                else {
                    accArray[index].total += 1;
                    accArray[index].lastDate = item.date;
                }
            });

            accArray = accArray.filter((a,i) => (i >= offset) && ( i < (offset + limit)) );
            const queryCount = `SELECT COUNT(DISTINCT s.accountid) FROM sms s
                LEFT JOIN account a ON s.accountid = a.accountid
                WHERE s.charged!=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')`;
            const countRes = await pool.query(queryCount,[search]);
            
            retVal.count = countRes.rows[0].count;
            retVal.accounts = accArray;
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllSmsAccountsByUserIdError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
	}
});


router.route('/getAllNotCharged').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { search, limit, offset } = req.query;
        const query = `SELECT s.date, a.accountid, a.companyname, a.username, a.datebirth, a.street FROM sms s
            LEFT JOIN account a ON s.accountid = a.accountid
            WHERE s.charged!=true AND (username LIKE \'%\' || $1 || \'%\' OR companyname LIKE \'%\' || $1 || \'%\')  ORDER BY s.date ASC
        `;

        const { rows } = await pool.query(query,[search]);
        if(rows !== undefined && rows !== null && rows.length > 0){

            let accArray = [];
            let index = -1;
            rows.forEach((item) => {
                if(index == -1 || item.accountid != accArray[index].accountid) {
                    accArray.push({
                        companyName: item.companyname,
                        lastDate: item.date,
                        firstDate: item.date,
                        username: item.username,
                        accountid: item.accountid,
                        datebirth: item.street,
                        total: 1
                    });

                    index++;
                }
                else {
                    accArray[index].total += 1;
                    accArray[index].lastDate = item.date;
                }
            });

            let query2 = `SELECT
                a.companyname, a.username, a.datebirth, a.street,
                p.id as payment_id, 
                p.creation_date as date, p.last_date
            FROM payment p
                LEFT JOIN account a ON a.accountid = p.accountid
            WHERE  (a.companyname LIKE \'%\' || $1 || \'%\' ) ORDER BY p.creation_date ASC`;
            
            let params = [search];
            // status=1 means active
            let { rows:payments } = await pool.query(query2,params);

            payments = payments.map((item) => ({
                companyName: item.companyname,
                lastDate: item.last_date || item.date,
                firstDate: item.date,
                username: item.username,
                accountid: item.accountid,
                datebirth: item.street,
                state: item.state,
                type: item.type,
                total: 1
            }));
            retVal.count = accArray.length;

            accArray = accArray.filter((a,i) => (i >= offset) && ( i < (offset + limit)));
            retVal.accounts = [...accArray, ... payments];
        }
        else {
            //retVal.msg = 'EMPTY';
        }

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllNotCharged: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});


router.route('/getAllPayments').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', accounts: [], count: 0};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        await checkUnclosedDeals();


        const { search, limit, offset } = req.query;
        let query2 = `SELECT
                a.companyname, a.username, a.datebirth, a.street, a.email, a.phone,
                p.id as payment_id, 
                p.creation_date as date, p.last_date, p.state, p.type, p.price, p.accountid
            FROM payment p
                LEFT JOIN account a ON a.accountid = p.accountid
            WHERE  (a.companyname LIKE \'%\' || $1 || \'%\' ) AND (p.state=0 OR p.state=1) ORDER BY p.creation_date DESC`;
        
        let params = [search];
        // status=1 means active
        let { rows:payments } = await pool.query(query2,params);

        payments = payments.map((item) => ({
            companyName: item.companyname,
            lastDate: item.last_date || item.date,
            firstDate: item.date,
            username: item.username,
            accountid: item.accountid,
            datebirth: item.street,
            state: item.state,
            type: item.type,
            payment_id: item.payment_id,
            phone: item.phone,
            email: item.email,
            price: item.price,
            total: item.price + ' CHF'
        }));

        /*
        let paymentsGrouped = _.groupBy(payments,(p) => p.accountid);
        payments = [];
        Object.keys(paymentsGrouped).forEach(function(p) {
            const { price, firstDate, lastDate } = calcValues(paymentsGrouped[p]);

            payments.push({
                ...paymentsGrouped[p][0],
                price: price,
                total: price + ' CHF',
                firstDate: firstDate,
                lastDate: lastDate,
                list: paymentsGrouped[p]
            })
        });
        */

        retVal.count = payments.length;
        payments = payments.filter((a,i) => (i >= offset) && ( i < (offset + limit))).sort((a,b) => a.lastDate > b.lastDate);


        retVal.accounts = payments;

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllPayments: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});


router.route('/getPaymentDetails').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', data: null };

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }
        await checkUnclosedDeals();

        const { auctions, accountid } = req.query;
        let query2 = `SELECT a.seller_fee, a.buyer_fee, a.accountid, a.buyerid, b.name as brand, m.name as model FROM auction a
            LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
            LEFT JOIN coll_brands b ON b.id = v.brandid
            LEFT JOIN coll_models m ON m.id = v.modelid
        WHERE a.id IN (${auctions})`;
        // status=1 means active
        const { rows } = await pool.query(query2,[]);
        const selled = rows.filter((r) => r.accountid === parseInt(accountid)).map((r) => ({
            amount: r.seller_fee,
            vehicle: r.brand + ' ' + r.model
        }));

        const bought = rows.filter((r) => r.buyerid === parseInt(accountid)).map((r) => ({
            amount: r.buyer_fee,
            vehicle: r.brand + ' ' + r.model
        }));

        retVal.data = {
            sold: selled,
            buy: bought
        };

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllPayments: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});

const calcValues = (arr) => {
    let sum = 0;
    let lastDate = 0;
    let firstDate = arr[0].firstDate;

    arr.forEach(el => {
        sum+= el.price;

        if(el.lastDate > lastDate) 
            lastDate = el.lastDate;

        if(el.firstDate < firstDate) 
            firstDate = el.firstDate;
    });

    return {
        price: sum,
        lastDate,
        firstDate
    };
}


router.route('/checkUnclosedDeals').post(async (req, res) => {
	let retVal = { msg : '', errors: [], count: 0};

	try
	{
        const msg = await sendSmsWithTwilio("Dealer test ", "", "+38267611334");
        //const arr = await checkUnclosedDeals();

        retVal.errors = arr;
        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllPayments: err.message});
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
        ORDER BY a.id LIMIT 1`;

        const { rows } = await pool.query(query,[curr_date]);
        console.log({rows});
        let errArr = [];
        for (let i = 0; i < rows.length; i++) {
            const { seller_id, auction_id } = rows[i];
            const good = await closeDeal({ accountid: seller_id, auctionId: auction_id});

            if(good.error){
                errArr.push(good.error);
            }
        }

        return errArr;
    } catch (error) {
        console.log({error});
        return false
    }
}


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
       

        return data;
    } catch (error) {
        console.log({closeDealError : error});
        return null;
    }
}*/

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


router.route('/getCompletedPaymentsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : '', payments: [], count: 0 };

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { search, limit, offset,accountId } = req.query;
        let query2 = `SELECT
                a.companyname, a.username, a.datebirth, a.street, a.email, a.phone,
                p.id as payment_id, 
                p.creation_date as date, p.last_date, p.state, p.type, p.price, p.accountid
            FROM payment p
                LEFT JOIN account a ON a.accountid = p.accountid
            WHERE  p.state = 2 AND p.accountid=$1 ORDER BY p.creation_date DESC`;
        
            console.log({accountId});
        let params = [accountId];
        // status=1 means active
        let { rows:payments } = await pool.query(query2,params);

        payments = payments.map((item) => ({
            companyName: item.companyname,
            lastDate: item.last_date || item.date,
            firstDate: item.date,
            username: item.username,
            accountid: item.accountid,
            datebirth: item.street,
            state: item.state,
            type: item.type,
            payment_id: item.payment_id,
            phone: item.phone,
            email: item.email,
            price: item.price,
            total: item.price + ' CHF',
        }));
        retVal.count = payments.length;

        payments = payments.filter((a,i) => (i >= offset) && ( i < (offset + limit)));

        retVal.payments = payments;

        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({getAllPayments: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});




router.route('/getCompletedAuctions').post(expressJwt({ secret: config.serverSecretKey }),async function (req, res) {
    let retVal = { msg: '', auctions: [], count: 0 };
	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined) {
            res.sendStatus(401); return;
        }
        await checkUnclosedDeals();


        const { startDate, endDate, search, limit, offset  } = req.query;
        let auctions = await getCompletedAuctions({ 
            startDate, 
            endDate, 
            search, 
            limit, 
            offset  
        });

        const queryCount = `SELECT COUNT(DISTINCT a.id) FROM auction a
                LEFT JOIN account buyer ON buyer.accountid = a.buyerid
                LEFT JOIN account seller ON seller.accountid = a.accountid
            WHERE a.status = 2  AND (buyer.companyname LIKE \'%\' || $1 || \'%\' OR seller.companyname LIKE \'%\' || $1 || \'%\')`;
        const { rows:countRows } = await pool.query(queryCount,[search]);
        retVal.count = countRows[0].count;

        auctions = auctions.filter((a,i) => (i >= offset) && ( i < (offset + limit)) );
        retVal.auctions = auctions.map((auction) => {

            const profit = getProfit(auction.start_price,auction.current_price);

            return ({
                ...auction,
                bid_count: auction?.bid_count ? parseInt(auction?.bid_count) : 0,
                profit: profit,
                //seller_fee: seller_fee,
                //buyer_fee: buyer_fee
            })
        });


        return res.status(200).json(retVal);
    }catch(err){
        console.log({getCompletedAuctions: err});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const getCompletedAuctions = async ({ startDate, endDate, search }) => {
    let query = `SELECT 
        buyer.companyname as buyer_company, a.buyerid as buyer_id, 
        seller.companyname as seller_company, a.accountid as seller_id, 
        b.id as brand_id, b.name as brand_name,
        m.id as model_id, m.name as model_name,  
        a.id as auction_id, 
        a.start_date, a.expiration_date,
        a.start_price, a.current_price,
        a.vehicleid, a.seller_fee, a.buyer_fee
        FROM auction a
        LEFT JOIN coll_vehicle v ON a.vehicleid = v.id
        LEFT JOIN coll_brands b ON b.id = v.brandid
        LEFT JOIN coll_models m ON m.id = v.modelid
        LEFT JOIN account buyer ON buyer.accountid = a.buyerid
        LEFT JOIN account seller ON seller.accountid = a.accountid
        WHERE a.status = 2 AND (buyer.companyname LIKE \'%\' || $1 || \'%\' OR seller.companyname LIKE \'%\' || $1 || \'%\') `;

    let params = [search];

    if(startDate && endDate){
        query += ` AND a.expiration_date >= $2 AND a.expiration_date <= $3`;
        params = [...params, parseInt(startDate), parseInt(endDate)];
    }

    query += '  ORDER BY a.expiration_date DESC';
    // status=1 means active
    let { rows:auctions } = await pool.query(query,params);

    return auctions;
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


router.route('/sendEmailWithPayrexLink').post(expressJwt({ secret: config.serverSecretKey }), async (req, res) => {
	let retVal = { msg : ''};

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined ) {
            res.sendStatus(401); return;
        }

        const { payment_id, price, accountid, email } = req.query;

        const paylink = `https://aleksatest.payrexx.com/en/vpos?referenceId=${payment_id}&amount=${price}`;
        //const msg = await sendSmsWithTwilio("Payrex link:  " + paylink, "",phone );
        const emailInfo = await sendEmail({
            subject: 'Payrexx link',
            text: 'Payrexx link: '+paylink,
            to: email,
        });
        
        if(emailInfo?.messageId){
            await pool.query(
                `UPDATE payment SET state=1 WHERE id=$1`,
                [payment_id]
            );
            // status=1 means bill is sent

            retVal.msg = "OK";
        }else {
            retVal.msg = 'TRY AGAIN '+email;
        }

        /*const paylink1 = `https://aleksatest.payrexx.com/en/vpos?referenceId=${payment_id}&amount=${price}`;
        await sendSmsWithTwilio("Payrex link:  " + paylink, "","+38267611334" );*/
        
        res.status(200).json(retVal);
	}
	catch(err) {
        console.log({sendEmailWithPayrexLink: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
	}
});

router.route('/sendPayrexxWebhook').post( async function (req, res) {
    let retVal = {  msg: '', paymentId: 0};
    try {
        const { transaction } = req.body;

        if(transaction && transaction.invoice){
            const { amount  } = transaction; // payed amount
            const { referenceId, originalAmount  } = transaction.invoice; // paymentid

            if(amount === originalAmount){
                const query2 = `UPDATE payment SET state=2 WHERE id=$1`;
                await pool.query(query2,[parseInt(referenceId)]);
                // status=2 means it's payed
                retVal.msg = "OK";
                retVal.paymentId = referenceId;
            }else {
                retVal.msg = "amount not OK amount="+amount + " originalAmount="+originalAmount;
            }
        }else {
            retVal.msg = "transaction not OK";
        }
        return res.status(200).json(retVal);
    } catch (error) {
        console.log({ sendPayrexxWebhook: error.message });
        retVal.msg = error.message;
        return res.status(200).json(retVal);
    }
});

router.route('/exportCompletedAuctions').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}
        
        const { search, startDate, endDate } = req.query;
        let auctions = await getCompletedAuctions({ 
            startDate, 
            endDate, 
            search, 
        });

        // start pdf document
        let doc = new PDFDocument({ margin: 5, size: 'A3' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));
        // -----------------------------------------------------------------------------------------------------
        const tableArray = {
            title: "Completed Auctions",
            subtitle: "Total: " + auctions.length,
            headers: ["seller", "buyer","car", "date","start price", "Price", "profit", "buyer_fee", "seller_fee"],
            rows: auctions.map((item) => {
                const profit = getProfit(item.start_price,item.current_price);
                const seller_fee = (item.current_price < 10000 ? item.current_price * 0.01 : item.current_price * 0.05);
                const buyer_fee = getBuyerFee(profit, item.current_price);

                return [
                    item.seller_company,
                    item.buyer_company,
                    item.brand_name + " " +  item.model_name,
                    moment(parseInt(item.expiration_date) * 1000).format('DD/MM/YYYY HH:mm'),
                    item.start_price,
                    item.current_price,
                    profit + '%',
                    seller_fee + ' CHF',
                    buyer_fee + ' CHF',
                ]
            })
        };
        doc.table( tableArray, { width: 800 }); // A4 595.28 x 841.89 (portrait) (about width sizes)

        
        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportAllBilledSmsForUser: err.message});
        res.status(401);
    }
});


router.route('/exportAllCompletedPaymentsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.id == null || req.user.id === undefined) {res.sendStatus(401); return;}
        
        const { accountId } = req.query;
        let query2 = `SELECT
                a.companyname, a.username, a.datebirth, a.street, a.email, a.phone,
                p.id as payment_id, 
                p.creation_date as date, p.last_date, p.state, p.type, p.price, p.accountid
            FROM payment p
                LEFT JOIN account a ON a.accountid = p.accountid
            WHERE  p.state = 2 AND p.accountid=$1 ORDER BY p.creation_date DESC`;
        
        let params = [accountId];
        // status=1 means active
        let { rows:payments } = await pool.query(query2,params);

        payments = payments.map((item) => ({
            companyName: item.companyname,
            lastDate: item.last_date || item.date,
            firstDate: item.date,
            username: item.username,
            accountid: item.accountid,
            datebirth: item.street,
            state: item.state,
            type: item.type,
            payment_id: item.payment_id,
            phone: item.phone,
            email: item.email,
            price: item.price,
            total: item.price + ' CHF',
        }));
        const { rows } = await pool.query(`SELECT * FROM account WHERE accountid=$1`,[ 
            accountId,
        ]);     
        // start pdf document
        let doc = new PDFDocument({ margin: 30, size: 'A4' });
        // to save on server
        doc.pipe(fs.createWriteStream("./document.pdf"));

        // -----------------------------------------------------------------------------------------------------
        // Simple Table with Array
        // -----------------------------------------------------------------------------------------------------
        let total = 0;
        payments.forEach(element => {
            total+= element.price;
        });

        const tableArray = {
            title: rows[0].companyname + ":  Completed Payments",
            subtitle: "Total: " + total + ' CHF',
            headers: ["Charging Date", "Total"],
            rows: payments.map((item) => {
                return [moment(item.lastDate * 1000).format('LLLL'), item.total]
            })
        };
        doc.table( tableArray, { width: 595 }); // A4 595.28 x 841.89 (portrait) (about width sizes)

        
        // HTTP response only to show pdf
        doc.pipe(res);
        // done
        doc.end();
    }catch(err){
        console.log({exportAllCompletedPaymentsForAccount: err.message});
        res.status(401);
    }
});

module.exports = router;
