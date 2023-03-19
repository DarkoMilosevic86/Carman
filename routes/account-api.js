// Account API.
// This API provides endpoints for registerring, updating, and deleting the user accounts for the app.


// Express constant
const express = require('express');
// router constant, whitch requires the express.Router object
const router = express.Router();
// Constant which requires database file with the DB info:username, password, port, and DB name.
const pool = require("../database");
// Constant for the configuration file
const config = require('../config/config');
// Constant expressJwt which contains JSON web token object.
const expressJwt = require('express-jwt');
// Constant for the moment
const moment = require('moment');
// Multer constant
const multer = require('multer');
// Path constant for requiring file path.
const path = require('path');

const bcrypt = require('bcrypt');

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


// Function for uploading company logo
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, moment().unix() + '_' + file.originalname);
    }
});

var upload = multer({ storage: storage });


// End point for uploading company logo
router.route('/uploadCompanyLogo').post(upload.array("files"), async function (req, res) {
    let retVal = { msg: '', logoUrl: ''};

	try
	{

        let files = req.files;
        if(files && files.length > 0 ){
            retVal.imageUrl = 'http://93.115.253.83:5000/uploads/' + files[0].filename;
            retVal.msg = 'OK';
        }else {
            retVal.msg = 'Error while uploading company logo.';
        }

        res.status(200).json(retVal);

    }catch(err){
        console.log({err});
        res.status(400);
    }
});

// End point for registerring new account
router.route('/registerAccount').post(async function (req, res) {
    // Try/Catch block for catching an exception
    try
    {
        // Request return value
        var retVal = {msg: '', hasRegistered: false};
        // Constant for creation date returns moment() in unix.
        const creationDate = moment().unix();
        // Constant for note.
        const note = '7 Days demonstration account';
        // Constants for demo days, maximum number of devices, is active, and is SMS.
        const demodays = 7;
        const issms = true;
        const isactive = false;
        const maxdev = '3';
        let userid = undefined; // This need to be changed
        //const username = 'usr '+ moment().unix();
        const companylogo = '';
        // Body requirements for the post request.
        const {email, password, firstName, lastName, companyName, street, number, city, place, phoneNumber, username, code} = req.body;
        const usernameVal = username || companyName.replace(' ', '-').toLowerCase();

        // Checking if account with given email address already exists.
        const emailQuery = 'SELECT * FROM account WHERE email=$1 OR username=$2';
        const emailResponse = await pool.query(emailQuery, [email, usernameVal]);

        let role = 5;//DEMO
        if(code?.length > 0){
            const verify = await verifyInvitationCode(code);
            if(verify?.userid){
                role = 4;//DEALER
                userid = verify.userid;//USER THAT SEND INVITATION CODE
            }else {
                retVal.msg = 'Wrong or expired invitation code';
                return res.status(200).json(retVal);
            }
        }else {
            userid = await getUseridForRegisters();//DEFAULT USER FOR REGISTRATION
        }

        let emailRows = emailResponse.rows;
        if (emailRows.length > 0) {
            retVal.msg = 'The account with same email address or username already exists.';
        }
        else {
            // Query constant for INSERT INTO table SQL query.
            const queryRegister = 'INSERT INTO account (userid, email, password, firstname, lastname, companyname, street, number, city, place, phone, isactive, issms, maxdevices, demodays, creationdate, note, companylogo, username, role, datebirth) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING accountid';
            // Rows constant for pool.query method for insert in to database query.
            const responseRegister = await pool.query(queryRegister, [
                userid,
                email,
                password,
                firstName,
                lastName,
                companyName,
                street,
                number,
                city,
                place,
                phoneNumber,
                isactive,
                issms,
                maxdev,
                demodays,
                creationDate,
                note,
                companylogo,
                usernameVal,
                role,
                street
            ]);
            // Controlling an if statement if row constant is undefined, null, or there's length is less than 1
            let registerRows = responseRegister.rows;
            if (registerRows?.length > 0) {
                if(code?.length > 0){
                    await deleteInvitationCode(code);
                }
                // Defining return values for message and hasRegistered.
                retVal.msg = 'OK';
                retVal.hasRegistered = true;
            }
            else {
                // if row constant has undefined, null or there's length = 0
                retVal.msg = 'Account registration error';
            }
        }
        // Returning json status code, message, and hasRegistered.
        return res.status(200).json(retVal);
    }
    // Catching the exception
    catch(err) {
        console.log({registerAccount: err});
        retVal.msg = err.message;
        retVal.hasRegistered = false;
        return res.status(400).json(retVal);
    }
});


const verifyInvitationCode = async (code) => {
    const current_time = moment().add(-1, 'days').unix();

    const query = `SELECT userid FROM invite_code WHERE code=$1 AND creation_date > $2`;  
    const { rows } = await pool.query(query, [code, current_time]);  

    if(rows.length > 0) 
        return { userid: rows[0].userid };

    return false;
};

const deleteInvitationCode = async (code) => {
    const query = `DELETE FROM invite_code WHERE code=$1`;  
    await pool.query(query, [code]);  
    return true;
};


const getUseridForRegisters = async () => {
    const query = `SELECT id FROM users LIMIT 1`;  
    const { rows } = await pool.query(query, []);  

    if(rows.length > 0) 
        return rows[0].id;

    return null;
};


router.route('/getAccountData').post(expressJwt({secret: config.serverSecretKey}),async function (req, res) {
    let retVal = { msg: '', account: null };

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const query = 'SELECT * FROM account WHERE accountid=$1';
        const { rows } = await pool.query(query, [req.user.accountid]);

        retVal.employees = rows.length > 0 ? rows[0] : null;

        return res.status(200).json(retVal);
    }
    catch(err) {
        console.log({getAccountData: err});
        retVal.msg = err.message;
        return res.status(500).json(retVal);
    }
});


router.route('/createEmployee').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    let retVal = {msg: '', employeeId: undefined};

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const { username, firstname, lastname, password, role } = req.body;
        const query = 'INSERT INTO employee (username, firstname, lastname, password, role, accountid) VALUES ($1, $2, $3,$4, $5, $6) RETURNING id';
        const { rows } = await pool.query(query, [username, firstname, lastname, password, role, req.user.accountid]);

        if(rows.length > 0){
            retVal.employeeId = rows[0].id;
        }else {
            retVal.employeeId = `Failed`;
        }
        return res.status(200).json(retVal);
    }
    // Catching the exception
    catch(err) {
        console.log({ createEmployeeErr: err });
        retVal.msg = err.message;
        return res.status(500).json(retVal);
    }
});

router.route('/getAccountEmployees').post(expressJwt({secret: config.serverSecretKey}),async function (req, res) {
    let retVal = { msg: '', employees: [] };

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const query = 'SELECT id, username, firstname, lastname, password, role FROM employee WHERE accountid=$1';
        const { rows } = await pool.query(query, [ req.user.accountid]);

        retVal.employees = rows;

        return res.status(200).json(retVal);
    }
    catch(err) {
        console.log({getAccountEmployeesErr: err});
        retVal.msg = err.message;
        retVal.hasRegistered = false;
        return res.status(500).json(retVal);
    }
});

router.route('/getEmployeeData').post(expressJwt({secret: config.serverSecretKey}),async function (req, res) {
    let retVal = {msg: '', employee: null};
    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const { employeeId } = req.body;

        const query = 'SELECT id, username, firstname, lastname, password, role FROM employee WHERE id=$1';
        const { rows } = await pool.query(query, [employeeId]);

        if(rows.length > 0){
            retVal.employee = rows[0];
        }

        return res.status(200).json(retVal);
    }
    catch(err) {
        console.log({getEmployeeDataErr: err});
        retVal.msg = err.message;
        retVal.hasRegistered = false;
        return res.status(500).json(retVal);
    }
});

router.route('/deleteEmployee').post(expressJwt({secret: config.serverSecretKey}),async function (req, res) {
    var retVal = {msg: ''};

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }
        const { employeeId } = req.body;
        
        const query = 'DELETE FROM employee WHERE id=$1';
        await pool.query(query, [employeeId]);

        return res.status(200).json(retVal);
    }
    // Catching the exception
    catch(err) {
        console.log({deleteEmployeeErr: err});
        retVal.msg = err.message;
        retVal.hasRegistered = false;
        return res.status(500).json(retVal);
    }
});

router.route('/updateEmployee').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    var retVal = {msg: '', };

    try
    {
        const { firstname, lastname, newPassword, role, employeeId } = req.body;
        
        if(!firstname && !lastname && !role && !newPassword)
            return res.status(200).json(retVal);

        let query = `UPDATE employee SET`;
        let params = [employeeId];

        if(firstname){
            query += ` firstname=$${params.length + 1}`;
            params.push(firstname);
        }

        if(lastname){
            if(params.length > 1) query += `,`;

            query += ` lastname=$${params.length + 1}`;
            params.push(lastname);
        }

        if(role){
            if(params.length > 1) query += `,`;

            query += ` role=$${params.length + 1}`;
            params.push(role);
        }

        if(newPassword){
            /*
            const query = 'SELECT password FROM employee WHERE id=$1';
            const { rows } = await await pool.query(query, [employeeId]);

            cryptPassword(newPassword, async (err, hash) => {
                if(!err){
                    if(params.length > 1) query += `,`;

                    query += ` password=$${params.length + 1}`;
                    params.push(hash);
                }else {
                    res.status(200).send({
                        isError: true,
                        message: "Wrong token or expired",
                    });
                }
            });*/

            if(params.length > 1) 
                query += `,`;

            query += ` password=$${params.length + 1}`;
            params.push(newPassword);
        }

        query += ` WHERE id=$1`;
        await pool.query(query, params);

        retVal.msg = "OK";
        return res.status(200).json(retVal);
    }
    catch(err) {
        console.log({updateEmployeeErr: err});
        retVal.msg = err.message;
        return res.status(500).json(retVal);
    }
});

router.route('/getAllEmployeeRoles').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    let retVal = {msg: '', roles: [], test: 'a'};

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        retVal.roles = [
            { label: "Owner / Admin Garage", value: 1 },
            { label: "Sale", value: 2 },
            { label: "Workshop/ Reconditioning", value: 3 },
        ];

        return res.status(200).json(retVal);
    }
    // Catching the exception
    catch(err) {
        console.log({ getAllEmployeeRolesError: err });
        retVal.msg = err.message;
        return res.status(500).json(retVal);
    }
});

router.route('/resetAccountPassword').post(expressJwt({secret: config.serverSecretKey}), async function (req, res) {
    let retVal = {msg: ''};

    try
    {
        if (req.user == null || req.user === undefined) {res.sendStatus(401); return;}
        if (req.user.accountid == null || req.user.accountid === undefined || !req.user.app) { res.sendStatus(401); return; }

        const { currentPassword, newPassword } = req.body;

        const query = 'SELECT password FROM account WHERE accountid=$1';
        const { rows } = await pool.query(query, [req.user.accountid]);

        if(!(rows?.length > 0)){
            return res.status(200).json(retVal);
        }

        const { password } = rows[0];
        
        if(password === currentPassword){
            const query = 'UPDATE account SET password=$1 WHERE accountid=$2';
            await pool.query(query,[newPassword,req.user.accountid]);

            return res.status(200).json({ msg: "OK"});
        }else {
            return res.status(200).json({ msg: "Wrong password"});
        }
        /*comparePassword(currentPassword,password, (err, isMatch) => {
            if((!err && isMatch)){

                cryptPassword(newPassword, async (err, hash) => {
                    if(!err){
                        const query = 'UPDATE account SET password=$1 WHERE id=$2';
                        await pool.query(query,[hash,req.user.accountid]);
            
                        res.status(200).json({ msg: "OK"});
                    }else {
                        res.status(200).json({ msg: "Something went wrong!"});
                    }
                });
            }else {
                retVal.msg = 'Password is not valid';
            }
            
            return res.status(200).json(retVal);
        });*/

        return res.status(200).json(retVal);
    }
    // Catching the exception
    catch(err) {
        console.log({ resetAccountPasswordError: err });
        retVal.msg = err.message;
        return res.status(500).json(retVal);
    }
});


module.exports = router;