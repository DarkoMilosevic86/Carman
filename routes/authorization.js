const express = require('express');
const router = express.Router();
const pool = require("../database");
const config = require('../config/config');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit')

//const accountSid = 'AC5ed7abd736e11d5f4d16c3ae7e6682b9';
//const authToken = 'b5aacb014aed0363273ce5e546ebb864';
const verificationServiceId = config.verificationServiceId;
const client = require('twilio')(config.twilioAccountSid, config.twilioAuthToken);

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

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 1 hour
	max: 10, // Limit each IP to 5 create account requests per `window` (here, per hour)
	message:
		'Too many auth requests from this IP, please try again after  15 minutes',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authSuperLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 2, // Limit each IP to 5 create account requests per `window` (here, per hour)
	message:
		'Too many auth requests from this IP, please try again after  1 minute',
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})


/* SUPER USER START  */
router.route('/superLogin').post(authSuperLimiter, async function (req, res) {
	try
	{
		var retVal = { idToken : null, msg : '', isAdmin: false};
		if (!req.body) {res.status(200).json(retVal);  return; }

        let query = 'SELECT * FROM superuser WHERE username = $1';
        const admins = await pool.query(query,[req.body.username]);
        console.log("sdasdasas");
        let adminRows = admins.rows;
        let user_db = null;

        if(adminRows !== undefined && adminRows !== null && adminRows.length > 0){
            user_db = adminRows[0];
            match = true;

            comparePassword(req.body.password,user_db.password, (err, isMatch) => {

                console.log({
                    err, isMatch
                });
                if((!err && isMatch)){
            
                    //const token = jwt.sign({ id: user_db.id, username : req.body.username, isAdmin : true}, config.serverSecretKey, { expiresIn: '2d' });
                    //retVal.idToken = token;
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

router.route('/sendSmsVerificationCodeSuperUser').post(authLimiter, async function (req, res) {
	try {
        if (req.body.username) {
            let query = 'SELECT phone FROM superuser WHERE username = $1';
            const { rows } = await pool.query(query,[req.body.username]);

            if(rows !== undefined && rows !== null && rows.length > 0){
                let superUserPhone = rows[0].phone;

                client
                .verify
                .services(verificationServiceId)
                .verifications
                .create({
                    to: superUserPhone,
                    channel: 'sms' 
                })
                .then(data => {
                    res.status(200).send({
                        isError: false,
                        message: "Verification is sent!!",
                        data
                    })
                })
            }else {
                res.status(200).send({
                    isError: true,
                    message: "Wrong username",
                })
            }
         } else {
            res.status(200).send({
                isError: true,
                message: "Wrong phone number :(",
            })
         }
    } catch (error) {
        console.log({error : error.message});
    }
});

router.route('/verifySmsCodeAndLoginSuperUser').post(authLimiter, async function (req, res) {
    try {
        if (req.body.username && (req.body.code).length === 6) {
            let query = 'SELECT id, phone FROM superuser WHERE username = $1';
            const { rows } = await pool.query(query,[req.body.username]);

            if(rows !== undefined && rows !== null && rows.length > 0){
                let superUserPhone = rows[0].phone;
                let superUserId = rows[0].id;

                client
                .verify
                .services(verificationServiceId)
                .verificationChecks
                .create({
                    to: superUserPhone,
                    code: req.body.code
                })
                .then(data => {
                    if (data.status === "approved") {
                        const token = jwt.sign({ id: superUserId, username : req.body.username, isAdmin : true}, config.serverSecretKey, { expiresIn: '2h' });
                        res.status(200).send({
                            isError: false,
                            message: "User is Verified!!",
                            idToken: token
                        })
                    }else {
                        res.status(200).send({
                            isError: true,
                            message: "Not approved",
                        })
                    }
                }).catch((err) => {
                    res.status(200).send({
                        isError: true,
                        message: "Wrong phone number or code :(",
                    })
                });
            }else {

            }
       } else {
            res.status(200).send({
                isError: true,
                message: "Wrong phone number or code :(",
            })
       }
    } catch (error) {
        res.status(200).send({
            isError: true,
            message: "Something went wrong!"
        })
    }
});

router.route('/verifySmsCodeSuperUserResetPassword').post(authLimiter, async function (req, res) {
    try {
        if (req.body.username && (req.body.code).length === 6) {
            let query = 'SELECT id, phone FROM superuser WHERE username = $1';
            const { rows } = await pool.query(query,[req.body.username]);

            if(rows !== undefined && rows !== null && rows.length > 0){
                let superUserPhone = rows[0].phone;
                let superUserId = rows[0].id;

                client
                .verify
                .services(verificationServiceId)
                .verificationChecks
                .create({
                    to: superUserPhone,
                    code: req.body.code
                })
                .then(data => {
                    if (data.status === "approved") {

                        let token = jwt.sign({ id: superUserId, username : req.body.username}, config.resetPasswordKey, { expiresIn: '1h' });
                        res.status(200).send({
                            isError: false,
                            message: "User is Verified!!",
                            verifyToken: token
                        })
                    }else {
                        res.status(200).send({
                            isError: true,
                            message: "Not approved",
                        })
                    }
                }).catch((err) => {
                    res.status(200).send({
                        isError: true,
                        message: err.message//"Wrong phone number or code :(",
                    })
                });
            }else {

            }
       } else {
            res.status(200).send({
                isError: true,
                message: "Wrong phone number or code :(",
            })
       }
    } catch (error) {
        res.status(200).send({
            isError: true,
            message: err.message + ' - 2' //"Wrong phone number or code :(",
        })
    }
});


router.route('/resetPasswordSuperUser').post(authLimiter, async function (req, res) {
	try
	{
		var retVal = { success: true, message: "" };
		if (!req.body) {res.status(200).json(retVal);  return; }

        const { newPassword, verifyToken } = req.body;

        if(newPassword.length > 5 && verifyToken){
            jwt.verify(verifyToken, config.resetPasswordKey, (error, decodedData) => {

                console.log({
                    decodedData
                });
                if(error){
                    res.status(200).send({
                        isError: true,
                        message: "Wrong token or expired",
                    });
                }else{
                    cryptPassword(newPassword, async (err, hash) => {
                        if(!err){
                            const query = 'UPDATE superuser SET password=$1 WHERE id=$2';
                            await pool.query(query,[hash,decodedData.id]);
                
                            res.status(200).send({
                                isError: false,
                                message: "Success",
                            });
                        }else {
                            res.status(200).send({
                                isError: true,
                                message: "Wrong token or expired",
                            });
                        }
                    });
                }
            })
        }
	}
	catch(err) {
        res.status(200).send({
            isError: true,
            message: "Something went wrong",
        });
	}
});


router.route('/createNewUser').post(authLimiter, expressJwt({ secret: config.serverSecretKey }), async function (req, res) {
	let retVal = { success : false, msg : '', isNameAvailable: true };

	try
	{
        if (req.user == null || req.user === undefined || req.user.id == null || req.user.id === undefined || !req.user.isAdmin ) {
            res.sendStatus(401); return;
        }

        const { username, password, firstName, lastName, roles } = req.query;
        const query = 'SELECT * FROM users WHERE username = $1';
        const { rows } = await pool.query(query,[username]);
        if(rows !== undefined && rows !== null && rows.length > 0){
            retVal.msg = 'Username already exist';
            retVal.isNameAvailable = false;

            return res.status(200).json(retVal);
        }

        console.log({
            password
        });
        cryptPassword(password, async (err, hash) => {
            if(!err){
                const queryInsert = 'INSERT INTO users (username, password, firstname, lastname, role) VALUES ($1,$2,$3,$4,$5)  RETURNING id';
                await pool.query(queryInsert,[username, hash, firstName, lastName, roles]);
    
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
        console.log({err});
		res.status(200).json(retVal);
	}
});

router.route('/userLogin').post(authLimiter, async function (req, res) {
	try
	{
		var retVal = { idToken : null, msg : '', isAdmin: false, validity: 0};
		if (!req.body) {res.status(200).json(retVal);  return; }

        let query = 'SELECT id, role, password FROM users WHERE username = $1';
        const { rows } = await pool.query(query,[req.body.username]);

        let user_db = null;

        if(rows.length <= 0){    
            return res.status(200).json(retVal);
        }
        user_db = rows[0];

        let roles = [];
        if(user_db.role){
            let roles2 = JSON.parse(user_db.role);
            if(roles2.length === 3){
                roles = roles2;
            }
        }
        
        comparePassword(req.body.password, user_db.password, (err, isPasswordMatch) => {
            //from PC
            if (isPasswordMatch) {
                token = jwt.sign(
                    { 
                        id: user_db.id,
                        username : req.body.username, 
                        roles: { 
                            create: roles.length > 0 && roles[0], 
                            update: roles.length > 0 && roles[1], 
                            delete: roles.length > 0 && roles[2]
                        }
                    }, 
                    config.serverSecretKey, 
                    { 
                        expiresIn: 60 * 30 // 30min 
                    }
                );
                retVal.idToken = token;
                retVal.validity = 60 * 30;
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


module.exports = router;
