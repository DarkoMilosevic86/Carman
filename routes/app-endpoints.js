const express = require('express');
const router = express.Router();
const pool = require("../database");
const config = require('../config/config');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const moment = require('moment');
const path = require('path');
const vehicle_colors = require('../data/colors');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, moment().unix() + '_' + file.originalname);
    }
});

var upload = multer({ storage: storage });


var storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/files'))
    },
    filename: function (req, file, cb) {
        cb(null, moment().unix() + '_' + file.originalname);
    }
});

var upload2 = multer({ storage: storage2 });

router.route('/getColorsForVehicle').get( async function (req, res) {
    let retVal = { msg: '', colors: []};
	try
	{
        retVal.colors = vehicle_colors;
        res.status(200).json(retVal);
    }catch(err){
        console.log({err});
        res.status(401);
    }
});

router.route('/uploadImage').post(expressJwt({ secret: config.serverSecretKey }),upload.array("files"), async function (req, res) {
    let retVal = { msg: '', logoUrl: '', imageUrl: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        let files = req.files;
        if(files && files.length > 0 ){
            retVal.imageUrl = 'http://93.115.253.93:5000/uploads/' + files[0].filename;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);

    }catch(err){
        console.log({err});
        res.status(401);
    }
});

router.route('/uploadMultipleImages').post(expressJwt({ secret: config.serverSecretKey }),upload.array("files"), async function (req, res) {
    let retVal = { msg: '', imagesUrl: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        let files = req.files;

        let imagesArray = [];
        if(files && files.length > 0 ){
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                imagesArray.push('http://93.115.253.83:5000/uploads/' + file.filename);
            }
            retVal.imagesUrl = imagesArray;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);
    }catch(err){
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/uploadFile').post(expressJwt({ secret: config.serverSecretKey }),upload2.array("files"), async function (req, res) {
    let retVal = { msg: '', fileUrl: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        let files = req.files;
        if(files && files.length > 0 ){
            retVal.fileUrl = 'http://93.115.253.83:5000/uploads/files/' + files[0].filename;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);

    }catch(err){
        console.log({err});
        res.status(401);
    }
});

router.route('/uploadMultipleFiles').post(expressJwt({ secret: config.serverSecretKey }),upload2.array("files"), async function (req, res) {
    let retVal = { msg: '', files: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        let files = req.files;
        let filesArray = [];
        if(files && files.length > 0 ){
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                filesArray.push('http://93.115.253.83:5000/uploads/files/' + file.filename);
            }
            retVal.files = filesArray;
        }else {
            retVal.msg = 'Error';
        }

        res.status(200).json(retVal);
    }catch(err){
        console.log({err});
        res.status(401);
    }
});
/* APP START */

/* AUTH */
router.route('/loginAccount').post(async function (req, res) {
	try
	{
		var retVal = { idToken : null, msg : '', userData : null};
        const { email, password, deviceId, deviceName, username } = req.body;

        const query = 'SELECT * FROM account a WHERE username = $1';
        const accountResponse = await pool.query(query,[username]);

        let accountRows = accountResponse.rows;
        let correct_pass = false;
        let isSignedDevice = false;
        let account = null;
  
        if(accountRows.length > 0){
            account = accountRows[0];
            
            //check password
            if(password === account.password){
                correct_pass = true;

                const queryDelete = 'DELETE FROM device WHERE deviceid = $1';
                await pool.query(queryDelete,[ deviceId ]);

                const queryDevices = 'SELECT * FROM device WHERE accountid = $1';
                const devicesResponse = await pool.query(queryDevices,[ account.accountid ]);
                const devices = devicesResponse.rows;

                if(devices?.length < parseInt(account.maxdevices)){
                    const query = 'INSERT INTO device(deviceid, name, accountid) VALUES($1,$2,$3)';
                    await pool.query(query,[ deviceId, deviceName, account.accountid ]);
                    isSignedDevice = true;
                }

                /*isSignedDevice = devices.find((device) => device.deviceid === deviceId);
                if(!isSignedDevice && devices.length < account.maxdevices){
                    //Add new device
                    const query = 'INSERT INTO device(deviceid, name, accountid) VALUES($1,$2,$3)';
                    await pool.query(query,[ deviceId, deviceName, account.accountid ]);
                    
                    isSignedDevice = true;
                }else {
                    const query = 'INSERT INTO device(deviceid, name, accountid) VALUES($1,$2,$3)';
                    await pool.query(query,[ deviceId, deviceName, account.accountid ]);
                }
                */
                retVal.userData = account;

            }
        }else {
            const queryEmployee = 'SELECT * FROM employee WHERE username = $1';
            const { rows: employees} = await pool.query(queryEmployee,[username]);

            let accounts = [];
            if(employees.length > 0){
                const queryAcc = 'SELECT * FROM account WHERE accountid = $1';
                const { rows: accountRows} = await pool.query(queryAcc,[employees[0].accountid]);
                accounts = accountRows;
            }

            if(accounts.length > 0){
                account = accounts[0];
                //check password
                if(password === employees[0].password){
                    correct_pass = true;

                    const queryDelete = 'DELETE FROM device WHERE deviceid = $1';
                    await pool.query(queryDelete,[ deviceId ]);

                    const queryDevices = 'SELECT * FROM device WHERE accountid = $1';
                    const devicesResponse = await pool.query(queryDevices,[ account.accountid ]);
                    const devices = devicesResponse.rows;

                    if(devices?.length < parseInt(account.maxdevices)){
                        const query = 'INSERT INTO device(deviceid, name, accountid) VALUES($1,$2,$3)';
                        await pool.query(query,[ deviceId, deviceName, account.accountid ]);
                        isSignedDevice = true;
                    }

                    
                    retVal.userData = account;
                }
            }else {
                retVal.msg = 'Account not found';
                return res.status(200).json(retVal);
            }
        }
        
        if (correct_pass && isSignedDevice) {
            token = jwt.sign({ accountid: account.accountid, username : req.body.username, deviceId: deviceId, app : true}, config.serverSecretKey, { expiresIn: '50d' });
            retVal.idToken = token;
        } 
        else {
            retVal.msg = !correct_pass ? 'Password is not valid' : 'Cannot sign in this device';
            retVal.userData = null;
        }

		res.status(200).json(retVal);
	}
	catch(err) {
        console.log(err);
		res.status(200).json({ idToken : null, msg : err.message});
	}
});

router.route('/logoutAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { deviceId , accountid } = req.user;
        //Database queryž
        const query = `DELETE FROM device WHERE deviceid=$1 AND accountid=$2`;
        await pool.query(query,[deviceId , accountid]);
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({logoutAccountError: err.message});
        retVal.msg = err.message;
		res.status(401).json(retVal);
    }
});

router.route('/getUserData').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', userData : null};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { userAccountId } = req.body;
        //Database queryž
        const query = `SELECT * FROM account WHERE accountid=$1`;
        const { rows } = await pool.query(query,[userAccountId]);
        retVal.userData = rows;

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getUserDataError: err.message});
        retVal.msg = err.message;
		res.status(401).json(retVal);
    }
});


router.route('/deleteReplacementVehicle').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { vehicleId } = req.body;

        const query = `DELETE FROM vehicle WHERE id = $1`;
        await pool.query(query,[vehicleId]);
        //Database queryž
        retVal.msg = "OK";
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({deleteReplacementVehicle: err.message});
        retVal.msg = err.message;
		res.status(401).json(retVal);
    }
});



/* AUTH */

router.route('/checkLogin').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', user_data: null};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        //Database query
        const query = `SELECT * FROM account WHERE accountid=$1`;
        const response = await pool.query(query,[req.user.accountid]);
        let rows = response.rows;
        if (rows.length > 0) {
            retVal.msg = 'OK';
            retVal.user_data = rows;
        }
        else {
            retVal.msg = 'User is not logged in.';
        }
        res.status(200).json(retVal);
        return;
    }catch(err){
        console.log({CheckAccountLoginError: err.message});
        retVal.msg = err.message;
		res.status(400).json(retVal);
        return;
    }
});

router.route('/isDeviceActive').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', isRegister: false};
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { deviceId , accountid } = req.user;
        retVal.isRegister = await checkDeviceExistForAccount(accountid, deviceId);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({deviceFindError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const checkDeviceExistForAccount = async (accountId, deviceId) => {
    const query = `SELECT * FROM device WHERE accountid=$1 AND deviceid=$2`;
    const { rows } = await pool.query(query,[accountId, deviceId]);

    return rows?.length > 0;
}

router.route('/createNewCustomer').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { imageUrl, firstName, lastName, dateBirth, driverLicenceNumber, phoneNumber, receivesSms, images, receivesemail, email } = req.body;

        const { rows: licenses } = await pool.query("SELECT * FROM customer WHERE licensenumber=$1 AND accountid=$2",[ driverLicenceNumber,req.user.accountid]);
        if(licenses?.length > 0){
            retVal.msg = "The Licence number belongs to another customer";
            res.status(200).json(retVal);
            return;
        }

        const creation_date = moment().unix();

        //Database insert
        const queryContact = `INSERT INTO customer( accountid, firstname, lastname, birthdate, imgurl, licensenumber, phone, receivesms, creationdate, receivesemail, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`;
        const {rows} = await pool.query(queryContact,[ 
            req.user.accountid,
            firstName,
            lastName,
            dateBirth,
            imageUrl,
            driverLicenceNumber,
            phoneNumber,
            receivesSms,
            creation_date,
            !!receivesemail, 
            email || ''
        ]);

        if(rows?.length > 0 && images?.length > 0){
            const customerId = rows[0].id;
            const values = getValuesForInsertingCustomerImages(customerId, images);
            const queryImages = `INSERT INTO customer_images( customerid, url ) ` + values;

            await pool.query(queryImages,[]);
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createNewCustomerError: err.message});
        retVal.msg =  err.message;
		res.status(200).json(retVal);
    }
});


router.route('/getAllCustomersByAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', customers: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const searchInput = req.body.searchInput || '';
        //Database query
        const query = `SELECT * FROM customer 
            WHERE accountid=$1 AND 
            (   
                LOWER(firstname || ' ' || lastname) LIKE \'%\' || $2 || \'%\'
                OR LOWER(lastname || ' ' || firstname) LIKE \'%\' || $2 || \'%\'
            )  
            ORDER BY id ASC`;        

        const { rows } = await pool.query(query,[req.user.accountid, searchInput.toLowerCase()]);
        
        let customers = rows.map((row) => ({ ...row, images: []}));
        for (let i = 0; i < customers.length; i++) {
            const customerId = customers[i].id;

            const query = `SELECT id, url FROM customer_images WHERE customerid=$1`;
            const { rows: images } = await pool.query(query,[customerId]);
            
            customers[i].images = images;
        }

        retVal.customers = customers;
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getAllCustomersByAccountError: err.message});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
    }
});


router.route('/editCustomerData').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { customerId, imageUrl, firstName, lastName, dateBirth, driverLicenceNumber, phoneNumber, receivesSms, addImages, deleteImages, receivesemail, email } = req.body;

        //Database update
        const queryContact = `UPDATE customer
            SET 
            firstname=$2, 
            lastname=$3, 
            birthdate=$4, 
            imgurl=$5, 
            licensenumber=$6, 
            phone=$7, 
            receivesms=$8, 
            receivesemail=$9, 
            email=$10
            WHERE id=$1;`;

        await pool.query(queryContact,[
            customerId,
            firstName,
            lastName,
            dateBirth,
            imageUrl,
            driverLicenceNumber,
            phoneNumber,
            receivesSms,
            !!receivesemail, 
            email || ''
        ]);

        if(deleteImages?.length > 0){
            const values = getIdsForDeletingCustomerImages(deleteImages);
            const queryImages = `DELETE FROM customer_images WHERE customerid=$1 AND id IN `+ values;
            console.log({queryImages});

            await pool.query(queryImages,[customerId]);
        }

        if(addImages?.length > 0){
            const values = getValuesForInsertingCustomerImages(customerId, addImages);
            const queryImages = `INSERT INTO customer_images( customerid, url ) ` + values;

            await pool.query(queryImages,[]);
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({editCustomerDataError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/deleteCustomer').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { customerId } = req.body;

        const querySms = `DELETE FROM sms WHERE customerid = $1`;
        await pool.query(querySms,[customerId]);

        const queryImages = `DELETE FROM customer_images WHERE customerid = $1`;
        await pool.query(queryImages,[customerId]);

        const query = `DELETE FROM customer WHERE id = $1`;
        await pool.query(query,[customerId]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({deleteDriveError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const getValuesForInsertingCustomerImages = (customerId, images) => {
    let values = `VALUES `;
    for (let i = 0; i < images.length; i++) {
        values+= `(${customerId}, '${images[i]}')` + (i < images.length - 1 ? `, ` : `;`);
    }

    return values;
}

const getIdsForDeletingCustomerImages = (images) => {
    let values = `(`;
    for (let i = 0; i < images.length; i++) {
        values+= `${images[i]}` + (i < images.length - 1 ? `, ` : `);`);
    }

    return values;
}


router.route('/createNewDrive').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { 
            customerid,
            licenseplateid,
            vehicleid,
            handoverkm,
            handoverfuel,
            reteurnkm,
            returnfuel,
            rightsid,
            signatureurl,
            status,
            handoverdate,
            returndate,
            note,
            documenturl,
            type,
            
        } = req.body;

        let price = req.body.price || 0;
        let duration = req.body.duration || 0;

        //Database insert
        const query = `INSERT INTO public.drive(
            accountid, customerid, licenseplateid, vehicleid, handoverkm, handoverfuel, reteurnkm, returnfuel, rightsid, signatureurl, status, handoverdate, returndate, note, documenturl, type, price, duration)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);`;

        await pool.query(query,[
            req.user.accountid,
            customerid, 
            licenseplateid, 
            vehicleid, 
            handoverkm, 
            handoverfuel, 
            reteurnkm,
            returnfuel, 
            rightsid,
            signatureurl, 
            status, 
            handoverdate, 
            returndate,
            note,
            documenturl,
            type,
            price,
            duration
        ]);
        //Update selected vehicle

        await setVehicleOccupied(vehicleid);
        /*
        const queryVehicleOccupied = `UPDATE vehicle SET occupied=true WHERE id=$1`;
        await pool.query(queryVehicleOccupied,[
            vehicleid
        ]);
        */

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createNewDriveError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const setVehicleOccupied = async (vehicleid) => {
    try {
        const queryVehicleOccupied = `UPDATE vehicle SET occupied=true WHERE id=$1`;
        await pool.query(queryVehicleOccupied,[
            vehicleid
        ]);
    } catch (error) {
        console.log({
            setVehicleOccupiedErr: error
        });
        throw error;
    }
}

router.route('/editDrive').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}
        
        const { 
            driveId,
            customerid,
            licenseplateid,
            vehicleid,
            handoverkm,
            handoverfuel,
            reteurnkm,
            returnfuel,
            rightsid,
            signatureurl,
            status,
            handoverdate,
            returndate,
            note,
            documenturl,
            type
        } = req.body;

        const price = req.body.price || 0;
        const duration = req.body.duration || 0;

        const queryUpdate = `UPDATE drive
            SET customerid=$1, licenseplateid=$2, vehicleid=$3, handoverkm=$4, 
            handoverfuel=$5, reteurnkm=$6, returnfuel=$7, rightsid=$8, signatureurl=$9, 
            status=$10, handoverdate=$11, returndate=$12, note=$13, documenturl=$14, type=$16, price=$17, duration=$18
            WHERE id=$15;
        `;
        await pool.query(queryUpdate,[
            customerid, 
            licenseplateid, 
            vehicleid, 
            handoverkm, 
            handoverfuel, 
            reteurnkm,
            returnfuel, 
            rightsid,
            signatureurl, 
            status, 
            handoverdate, 
            returndate,
            note,
            documenturl,
            driveId,
            type,
            price,
            duration
        ]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({editDriveError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/getAllDrivesForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', drives: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { handoverDate, returnDate, vehicleId, plateId, customerId, status } = req.body;
        const searchInput = req.body?.searchInput || '';

        let query = `SELECT d.id as driveid, d.*, v.name as vehiclename, c.firstname as customername, l.name as licenseplatename FROM drive d 
            LEFT JOIN vehicle v ON v.id = d.vehicleid 
            LEFT JOIN customer c ON c.id = d.customerid
            LEFT JOIN licenseplate l ON l.id = d.licenseplateid
            LEFT JOIN rights r ON r.id = d.rightsid
            WHERE d.accountid = $1 AND ( 
                (LOWER(l.name) LIKE \'%\' || $2 || \'%\') 
                OR (LOWER(v.name) LIKE \'%\' || $2 || \'%\') 
                OR (LOWER(c.firstname) LIKE \'%\' || $2 || \'%\') 
                OR (LOWER(c.lastname) LIKE \'%\' || $2 || \'%\')
            )`;
        let params = [req.user.accountid, searchInput.toLowerCase()];
        if(handoverDate && returnDate){
            query += ' AND d.handoverdate >= $3 AND d.returndate <= $4';
            params = [...params, handoverDate, returnDate];
        }
        if(vehicleId){
            query += ' AND d.vehicleid = $'+(params.length + 1);
            params.push(vehicleId);
        }
        if(plateId){
            query += ' AND d.licenseplateid = $'+(params.length + 1);
            params.push(plateId);
        }
        if(customerId){
            query += ' AND d.customerid = $'+(params.length + 1);
            params.push(customerId);
        }
        if(status && status != ""){
            query += ' AND d.status = $'+(params.length + 1);
            params.push(status);
        }
        query += ' ORDER BY id ASC';
        const { rows } = await pool.query(query,params);
        retVal.drives = rows;

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getAllDrivesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getDriveById').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', drive: {}};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { driveId } = req.body;


        let query = `SELECT d.id as driveid, d.*, v.name as vehiclename, c.firstname as customername, l.name as licenseplatename FROM drive d 
            LEFT JOIN vehicle v ON v.id = d.vehicleid 
            LEFT JOIN customer c ON c.id = d.customerid
            LEFT JOIN licenseplate l ON l.id = d.licenseplateid
            LEFT JOIN rights r ON r.id = d.rightsid
            WHERE d.accountid = $1 AND d.id = $2`;
        let params = [req.user.accountid, driveId];
        const { rows } = await pool.query(query,params);
        if(rows.length > 0){
            retVal.drive = rows[0];
        }else {
            retVal.msg = 'Cannot find drive with requested driveId';
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getAllDrivesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getDrivesInfoByDate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', data: { arrangedDrives: 0, occupiedVehicles: 0, newClients: 0, arrayOcupiedVehicles: []}};
	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { fromDate, toDate } = req.body;


        const query = `SELECT v.*, l.name as licence_name,d.licenseplateid, d.id as driveId, d.handoverdate, d.returndate, d.id, CONCAT(c.lastname, ' ', c.firstname) AS customer_fullname, v.name as vehicle_name, v.code as vehicle_code, v.occupied, v.id as vehicle_id FROM drive d 
            LEFT JOIN vehicle v ON v.id = d.vehicleid 
            LEFT JOIN customer c ON c.id = d.customerid
            LEFT JOIN licenseplate l ON d.licenseplateid = l.id
            WHERE d.accountid = $1 AND d.handoverdate >= $2 AND d.returndate <= $3 ORDER BY handoverdate DESC`;
        const params = [ req.user.accountid, fromDate, toDate];
        const { rows } = await pool.query(query,params);
        const customersQuery = `SELECT COUNT(*) FROM customer WHERE creationdate >= $1 AND creationdate <= $2 AND accountid=$3`;
        const { rows: crows } = await pool.query(customersQuery,[fromDate, toDate, req.user.accountid]);

        if(rows.length > 0){
            let data = {
                arrangedDrives: rows.length, 
                occupiedVehicles: rows.filter((drive) => drive.occupied).length, 
                newClients: crows.length > 0 ? crows[0].count : 0, 
                arrayOcupiedVehicles: rows.filter((drive) => drive.occupied) /*rows.map((drive) => ({
                    id: drive.vehicle_id,
                    name: drive.vehicle_name,
                    code: drive.vehicle_code,
                    startDate: moment(parseInt(drive.handoverdate * 1000)).format('YYYY-MM-DD'),
                    customerName: drive.customer_fullname
                }))*/
            }
            retVal.data = data;
        }else {
            retVal.msg = '';
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getDriveInfoByDateError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/deleteDrive').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { driveId } = req.body;

        const query = `DELETE FROM drive WHERE id = $1`;
        await pool.query(query,[driveId]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({deleteDriveError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/createNewVehicle').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { name, miles, color, code  } = req.body;
        const query = `INSERT INTO vehicle(
            accountid, name, miles, color, code )
            VALUES ($1, $2, $3, $4, $5);
        `;

        await pool.query(query,[ 
            req.user.accountid,
            name, 
            miles, 
            color, 
            code 
        ]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ createNewVehicleError: err.message });
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const createVehicle = async ({ accountid, name, miles, color, code  }) => {
    const query = `INSERT INTO vehicle(
        accountid, name, miles, color, code )
        VALUES ($1, $2, $3, $4, $5);
    `;

    await pool.query(query,[ 
        accountid,
        name, 
        miles,
        color, 
        code 
    ]);
}

router.route('/editVehicle').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { vehicleId, name, miles, color, code, occupied  } = req.body;
        const query = `UPDATE vehicle
            SET name=$1, miles=$2, color=$3, code=$4
            WHERE id=$5;
        `;

        await pool.query(query,[ 
            name, 
            miles, 
            color, 
            code,
            vehicleId
        ]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ editVehicleError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/setVehicleOccupied').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { vehicleId } = req.body;
        await setVehicleOccupied(vehicleId);
        /*const query = `UPDATE vehicle
            SET occupied=$1
            WHERE id=$2;
        `;

        await pool.query(query,[ 
            1,
            vehicleId
        ]);*/

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ setVehicleOccupiedError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/setVehicleAvailable').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { vehicleId } = req.body;
        const query = `UPDATE vehicle
            SET occupied=$1
            WHERE id=$2;
        `;

        await pool.query(query,[ 
            0,
            vehicleId
        ]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ setVehicleAvailableError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/getAllVehiclesForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicles: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const searchInput = req.body?.searchInput || '';
        const color = req.body?.color || '';

        let params = [req.user.accountid, searchInput.toLowerCase()];
        //Database select
        let query = `SELECT * FROM vehicle WHERE accountid=$1 AND (LOWER(name) LIKE \'%\' || $2 || \'%\') `;//  ORDER BY id ASC`;

        if(color && color != '' ){
            query += `AND color=$3`;
            params.push(color);
        }

        query += ` ORDER BY id ASC`
        const { rows } = await pool.query(query,params);
        retVal.vehicles = rows;

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ getAllVehiclesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getAllOccupiedVehiclesForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicles: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const searchInput = req.body?.searchInput || '';
        const color = req.body?.color || '';

        let params = [req.user.accountid, searchInput.toLowerCase()];
        //Database select
        let query = `SELECT v.*, l.name as licence_name, d.licenseplateid, d.id as driveId, d.customerid, d.handoverdate, d.returndate, CONCAT(c.lastname, ' ', c.firstname) AS customer_fullname FROM vehicle v
                    LEFT JOIN drive d ON d.vehicleid = v.id
                    LEFT JOIN customer c ON d.customerid = c.id
                    LEFT JOIN licenseplate l ON d.licenseplateid = l.id
                    WHERE d.status = 'active' AND v.accountid=$1 AND v.occupied AND (LOWER(v.name) LIKE \'%\' || $2 || \'%\')`;

        if(color && color != '' ){
            query += `AND color=$3`;
            params.push(color);
        }

        query += ` ORDER BY v.id ASC`
        const { rows } = await pool.query(query,params);
        retVal.vehicles = rows;

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ getAllOccupiedVehiclesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/getVehicleById').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', vehicle: null};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { vehicleId } = req.body;
        //Database select
        let query = `SELECT v.*, l.name as licence_name, d.licenseplateid, d.id as driveId, d.customerid, d.handoverdate, d.returndate, CONCAT(c.lastname, ' ', c.firstname) AS customer_fullname FROM vehicle v
                    LEFT JOIN drive d ON d.vehicleid = v.id
                    LEFT JOIN customer c ON d.customerid = c.id
                    LEFT JOIN licenseplate l ON d.licenseplateid = l.id
                    WHERE v.accountid=$1 AND v.id = $2`;
       
        const { rows } = await pool.query(query,[req.user.accountid,vehicleId]);

        if(rows?.length > 0){
            retVal.vehicle = rows[0];
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ getAllOccupiedVehiclesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/deleteVehicle').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { vehicleId } = req.body;

        const query = `DELETE FROM vehicle WHERE id = $1`;
        await pool.query(query,[vehicleId]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({deleteVehicleError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/sendSmsByAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { message, customers, documents } = req.body;

        const phoneFrom = '+41798079097';
        for (let i = 0; i < customers.length; i++) {
            var customer = customers[i];
            var msg = await sendSmsWithTwilio(message, phoneFrom, customer.phone, documents);
            console.log({msg});
            //let msg = { sid : 'TEST-ID'}
            if(msg?.sid){
                var sendingDate = moment().unix();
                var query = `INSERT INTO sms( twilioid, message, customerid, accountid, date, charged) VALUES ($1, $2, $3, $4, $5, false) RETURNING id`;
                const params = [msg.sid, message, customer.id, req.user.accountid, sendingDate];
                const {rows } = await pool.query(query,params);

                if(rows && rows.length > 0){
                    if(documents){
                        for (let i = 0; i < documents.length; i++) {
                            const queryDocs = `INSERT INTO sms_documents( smsid, docurl) VALUES ($1, $2)`;
                            await pool.query(queryDocs,[rows[0].id, documents[i]]);
                        }
                    }
                    
                }else {
                    retVal.msg = 'Sms is sent but there is a error inserting sms data into database.';
                    return res.status(200).json(retVal);
                }
                
            }
            else {
                retVal.msg = 'Twilio error';
                return res.status(200).json(retVal);
            }
        }

        res.status(200).json(retVal);
    }catch(err){
        console.log({sendSmsByAccountError: err});
        retVal.msg = 'ERROR';
		res.status(200).json(retVal);
    }
});

const sendSmsWithTwilio = async (message, from, to, documents) => {
    try {
        const accountSid1 = 'ACc5fcfc49ac406eb951c50634cbe0b29d';
        const authToken1 = '22dd1f6ba6f2383a5138e44d40ac6955';

        const accountSid2 = 'AC106329d91771a8dcd963765429af2d95';
        const authToken2 = 'a569eaeeb25707c641af62b40880805e';
        
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

        return msg;
    } catch (error) {
        console.log({ sendSmsWithTwilioError : error});
        return null;
    }
}

router.route('/createSmsTemplate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { name, message, customers, documents } = req.body;
        const queryTemplate = `INSERT INTO smstemplate( name, message, accountid) VALUES ($1, $2, $3) RETURNING id`;
        const { rows } = await pool.query(queryTemplate,[name, message, req.user.accountid]);

        if(rows && rows.length > 0){
            
            const templateID = rows[0].id;

            for (let i = 0; i < documents.length; i++) {
                const queryDocs = `INSERT INTO smstemplate_documents( smstemplateid, docurl) VALUES ($1, $2)`;
                await pool.query(queryDocs,[templateID, documents[i]]);
            }

            customers.forEach(async (customer) => {
                var queryTemplate = `INSERT INTO customer2smstemplate(customerid, smstemplateid) VALUES ($1, $2)`;
                await pool.query(queryTemplate,[customer.id, templateID]);
            });
        }else {
            retVal.msg = 'Error at inserting sms template';
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getSmsTemplatesForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', templates: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const searchName = req.body?.searchName || '';
        
        const queryTemplates = `SELECT * FROM smstemplate st WHERE st.accountid =$1 AND (LOWER(st.name) LIKE \'%\' || $2 || \'%\')`;
        const templatesResponse = await pool.query(queryTemplates,[req.user.accountid, searchName.toLowerCase()]);
        let templates = templatesResponse.rows;

        if(templates){
            for (let i = 0; i < templates.length; i++) {
                var queryCustomers = `SELECT c.* FROM customer2smstemplate ct LEFT JOIN customer c ON c.id=ct.customerid WHERE ct.smstemplateid=$1`;
                var { rows } = await pool.query(queryCustomers,[templates[i].id]);

                var queryDocuments = `SELECT id, docurl FROM smstemplate_documents WHERE smstemplateid=$1`;
                var { rows : documents } = await pool.query(queryDocuments,[templates[i].id]);


                templates[i].customers = rows;
                templates[i].documents = documents;
            }

            retVal.templates = templates;
        }
        
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({getSmsTemplatesForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/editSmsTemplate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', templates: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { templateId, name, message, customers, deleteDocuments, addDocuments } = req.body;
        const queryTemplate = `UPDATE public.smstemplate
            SET name=$1, message=$2
            WHERE id=$3;
        `;
        await pool.query(queryTemplate,[name, message, templateId]);

        //add or remove customers
        var queryCustomers = `SELECT c.phone, c.id, c.firstname, c.lastname FROM customer2smstemplate ct LEFT JOIN customer c ON c.id=ct.customerid WHERE ct.smstemplateid=$1`;
        var { rows: oldCustomers } = await pool.query(queryCustomers,[templateId]);

        //add or remove customers
        var queryDocuments = `SELECT id, docurl FROM smstemplate_documents WHERE smstemplateid=$1`;
        var { rows : oldDocuments } = await pool.query(queryDocuments,[templateId]);

        let deleteCustomers = [];
        let addCustomers = [];

        customers.forEach((customer) => {
            if(!oldCustomers.find((c) => c.id == customer.id)){
                addCustomers.push(customer);
            }
        });

        oldCustomers.forEach((customer) => {
            if(!customers.find((c) => c.id == customer.id)){
                deleteCustomers.push(customer);
            }
        });

        deleteCustomersForTemplate(deleteCustomers);
        insertCustomersForTemplate(addCustomers, templateId);
        deleteDocumentsForTemplate(deleteDocuments || []);
        insertDocumentsForTemplate(addDocuments || [], templateId);
        
        /*for (let i = 0; i < deleteCustomers.length; i++) {
            var queryDelete = `DELETE FROM customer2smstemplate WHERE customerid=$1`;
            await pool.query(queryDelete,[deleteCustomers[i].id]);
        }

        for (let i = 0; i < addCustomers.length; i++) {
            var queryAdd = `INSERT INTO customer2smstemplate(customerid, smstemplateid) VALUES ($1, $2)`;
            await pool.query(queryAdd,[addCustomers[i].id, templateId]);
        }*/

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({editSmsTemplateError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const deleteCustomersForTemplate = async (customers) => {
    for (let i = 0; i < customers.length; i++) {
        var queryDelete = `DELETE FROM customer2smstemplate WHERE customerid=$1`;
        await pool.query(queryDelete,[customers[i].id]);
    }
}

const insertCustomersForTemplate = async (customers, templateId) => {
    for (let i = 0; i < customers.length; i++) {
        var queryAdd = `INSERT INTO customer2smstemplate(customerid, smstemplateid) VALUES ($1, $2)`;
        await pool.query(queryAdd,[customers[i].id, templateId]);
    }
}
const deleteDocumentsForTemplate = async (customers) => {
    for (let i = 0; i < customers.length; i++) {
        var queryDelete = `DELETE FROM smstemplate_documents WHERE id=$1`;
        await pool.query(queryDelete,[customers[i].id]);
    }
}

const insertDocumentsForTemplate = async (customers, templateId) => {
    for (let i = 0; i < customers.length; i++) {
        var queryAdd = `INSERT INTO smstemplate_documents( smstemplateid, docurl) VALUES ($1, $2)`;
        await pool.query(queryAdd,[templateId, customers[i]]);
    }
}


router.route('/createSmsGroup').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { name, customers, imgurl } = req.body;
        const queryGroup = `INSERT INTO smsgroup( name, accountid, imgurl) VALUES ($1, $2, $3) RETURNING id`;
        const { rows } = await pool.query(queryGroup,[name, req.user.accountid, imgurl]);

        if(rows && rows.length > 0){
            const groupID = rows[0].id;

            customers.forEach(async (customer) => {
                var queryTemplate = `INSERT INTO customer2smsgroup(customerid, smsgroupid) VALUES ($1, $2)`;
                await pool.query(queryTemplate,[customer.id, groupID]);
            });
        }else {
            retVal.msg = 'Error at inserting sms group';
        }

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsgroupError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getSmsGroupsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', groups: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const searchName = req.body?.searchName || '';
        
        const queryGroups = `SELECT * FROM smsgroup sg WHERE sg.accountid =$1 AND (LOWER(sg.name) LIKE \'%\' || $2 || \'%\')`;
        const groupsResponse = await pool.query(queryGroups,[req.user.accountid, searchName.toLowerCase()]);
        let groups = groupsResponse.rows;

        if(groups){
            for (let i = 0; i < groups.length; i++) {
                var queryCustomers = `SELECT c.* FROM customer2smsgroup ct LEFT JOIN customer c ON c.id=ct.customerid WHERE ct.smsgroupid=$1`;
                var { rows } = await pool.query(queryCustomers,[groups[i].id]);

                groups[i].customers = rows;
            }

            retVal.groups = groups;
        }
        res.status(200).json(retVal);
    }catch(err){
        console.log({getSmsgroupsForAccountError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/editSmsGroup').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', templates: [] };

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { groupId, name, customers, imgurl } = req.body;
        const queryGroup = `UPDATE public.smsgroup
            SET name=$1, imgurl=$2
            WHERE id=$3;
        `;
        await pool.query(queryGroup,[name, imgurl, groupId]);

        //add or remove customers
        var queryCustomers = `SELECT c.phone, c.id, c.firstname, c.lastname FROM customer2smsgroup ct LEFT JOIN customer c ON c.id=ct.customerid WHERE ct.smsgroupid=$1`;
        var { rows: oldCustomers } = await pool.query(queryCustomers,[groupId]);

        let deleteCustomers = [];
        let addCustomers = [];

        customers.forEach((customer) => {
            if(!oldCustomers.find((c) => c.id == customer.id)){
                addCustomers.push(customer);
            }
        });

        oldCustomers.forEach((customer) => {
            if(!customers.find((c) => c.id == customer.id)){
                deleteCustomers.push(customer);
            }
        });

        await deleteCustomersForGroup(deleteCustomers);
        await insertCustomersForGroup(addCustomers, groupId);
        
        res.status(200).json(retVal);
    }catch(err){
        console.log({editSmsTemplateError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

const deleteCustomersForGroup= async (customers) => {
    for (let i = 0; i < customers.length; i++) {
        var queryDelete = `DELETE FROM customer2smsgroup WHERE customerid=$1`;
        await pool.query(queryDelete,[customers[i].id]);
    }
}

const insertCustomersForGroup = async (customers, groupId) => {
    for (let i = 0; i < customers.length; i++) {
        var queryAdd = `INSERT INTO customer2smsgroup(customerid, smsgroupid) VALUES ($1, $2)`;
        await pool.query(queryAdd,[customers[i].id, groupId]);
    }
}

router.route('/deleteSmsGroup').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: ''};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { groupId } = req.body;
        const queryDeleteCustomers = `DELETE FROM public.customer2smsgroup
            WHERE smsgroupid=$1;
        `;
        await pool.query(queryDeleteCustomers,[groupId]);

        const queryDeleteGroup = `DELETE FROM public.smsgroup
            WHERE id=$1;
        `;
        await pool.query(queryDeleteGroup,[groupId]);

        res.status(200).json(retVal);
    }catch(err){
        console.log({deleteSmsGroupError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/createLicensePlate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', licenseId: undefined };

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { name } = req.body;
        const queryLicense = `INSERT INTO licenseplate( name, accountid) VALUES ($1, $2) RETURNING id`;
        const { rows } = await pool.query(queryLicense,[name, req.user.accountid]);
        if(rows && rows.length > 0 ){
            retVal.licenseId = rows[0].id
        }else {
            retVal.msg = 'Cannot add!';
        }
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/editLicensePlate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { plateId, name } = req.body;
        const query = `UPDATE public.licenseplate
            SET name=$1
            WHERE id=$2 AND accountid=$3;
        `;        
        await pool.query(query,[name, plateId, req.user.accountid]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});


router.route('/deleteLicensePlate').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { plateId} = req.body;
        const query = `DELETE FROM licenseplate where id=$1`;        
        await pool.query(query,[plateId]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/getLicensePlatesForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', plates: [] };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const searchInput = req.body?.searchInput || '';

        const queryLicense = `SELECT id, name FROM licenseplate WHERE accountid=$1 AND (LOWER(name) LIKE \'%\' || $2 || \'%\')  ORDER BY id ASC`;
        const { rows } = await pool.query(queryLicense,[req.user.accountid, searchInput.toLowerCase()]);

        retVal.plates = rows;
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/createRights').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', rightId: undefined };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { name, text } = req.body;
        const queryRights = `INSERT INTO rights( name, accountid, text) VALUES ($1, $2, $3) RETURNING id`;
        const { rows } = await pool.query(queryRights,[name, req.user.accountid, text]);
        if(rows && rows.length > 0 ){
            retVal.rightId = rows[0].id
        }else {
            retVal.msg = 'Cannot add!';
        }
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/editRight').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { rightId, name, text } = req.body;
        const query = `UPDATE public.rights
            SET name=$1, text=$4
            WHERE id=$2 AND accountid=$3;
        `;        
        await pool.query(query,[name, rightId, req.user.accountid, text]);
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/deleteRight').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '' };
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        
        const { rightId} = req.body;
        const query = `DELETE FROM rights where id=$1`;        
        await pool.query(query,[rightId]);

        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/getRightsForAccount').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', rights: [] };

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const searchInput = req.body?.searchInput || '';
        
        const queryLicense = `SELECT id, name, text FROM rights WHERE accountid=$1 AND (LOWER(name) LIKE \'%\' || $2 || \'%\')  ORDER BY id ASC`;
        const { rows } = await pool.query(queryLicense,[req.user.accountid, searchInput.toLowerCase()]);

        retVal.rights = rows;
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({createSmsTemplateError: err.message});
        retVal.msg = err.message;
        res.status(200).json(retVal);
    }
});

router.route('/getCustomerByLicenseNumber').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', hasCustomer: false, customers: []};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { licenseNumber } = req.body;
        if(!licenseNumber){
            retVal.msg = "You need to provide valid licenseNumber";
            res.status(200).json(retVal);
            return;
        }

        const query = `SELECT * FROM customer WHERE licensenumber = $1`;
        const { rows } = await pool.query(query,[ 
            licenseNumber
        ]);

        if(rows?.length > 0){
            let customers = rows.map((row) => ({ ...row, images: []}));
            for (let i = 0; i < customers.length; i++) {
                const customerId = customers[i].id;
    
                const query = `SELECT id, url FROM customer_images WHERE customerid=$1`;
                const { rows: images } = await pool.query(query,[customerId]);
                
                customers[i].images = images;
            }

            retVal.customers = customers;
            retVal.hasCustomer = true;
        }
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ getCustomerByLicenseNumberError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

router.route('/getCustomerById').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', customer: null};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { customerId } = req.body;
        if(!customerId){
            retVal.msg = "You need to provide valid customerId";
            res.status(200).json(retVal);
            return;
        }

        const query = `SELECT * FROM customer WHERE id = $1`;
        const { rows } = await pool.query(query,[ 
            customerId
        ]);

        if(rows?.length > 0){
            let customers = rows.map((row) => ({ ...row, images: []}));
            for (let i = 0; i < customers.length; i++) {
                const customerId = customers[i].id;
    
                const query = `SELECT id, url FROM customer_images WHERE customerid=$1`;
                const { rows: images } = await pool.query(query,[customerId]);
                
                customers[i].images = images;
            }

            retVal.customer = customers[0];
        }
        // done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ getCustomerByIdError: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});


router.route('/sendEmailFromDrive').post(expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
    let retVal = { msg: '', driveId: null};

	try
	{
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) {res.sendStatus(401); return;}

        const { driveId } = req.body;
        retVal.driveId = driveId;

        retVal.msg = "OK";
        //done
        res.status(200).json(retVal);
    }catch(err){
        console.log({ sendEmailFromDrive: err.message});
        retVal.msg = err.message;
		res.status(200).json(retVal);
    }
});

/* APP END */
module.exports = router;
