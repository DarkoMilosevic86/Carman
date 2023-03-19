
if(process.env.NODE_ENV){
    require("dotenv").config({
        path: `${__dirname}/.env.${process.env.NODE_ENV}`
    });
}else {
    require("dotenv").config();
}
const bunyan = require("bunyan");

const loggers = {
	development: () =>
		bunyan.createLogger({ name: "development", level: "debug" }),
	production: () =>
		bunyan.createLogger({ name: "production", level: "info" }),
	test: () => 
        bunyan.createLogger({ name: "test", level: "fatal" })
};

const configs = {
	development: {
		log: loggers.development,
    port: process.env.PORT,
    serverSecretKey: process.env.SERVER_SECRET_KEY,
    resetPasswordKey: process.env.RESET_PASSWORD_KEY,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    verificationServiceId: process.env.VERIFICATION_SERVICE_ID,
		database: {
			name: process.env.DATABASE_NAME,
			username: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
      port: process.env.DATABASE_PORT,
			host: process.env.DATABASE_HOST
		},
	},
	production: {
		log: loggers.production,
    port: process.env.PORT,
    serverSecretKey: process.env.SERVER_SECRET_KEY,
    resetPasswordKey: process.env.RESET_PASSWORD_KEY,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    verificationServiceId: process.env.VERIFICATION_SERVICE_ID,
		database: {
			name: process.env.DATABASE_NAME,
			username: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
            port: process.env.DATABASE_PORT,
			host: process.env.DATABASE_HOST
		},
	},
	test: {
		log: loggers.test,
    port: process.env.PORT,
    serverSecretKey: process.env.SERVER_SECRET_KEY,
    resetPasswordKey: process.env.RESET_PASSWORD_KEY,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    verificationServiceId: process.env.VERIFICATION_SERVICE_ID,
		database: {
			name: process.env.DATABASE_NAME,
			username: process.env.DATABASE_USERNAME,
			password: process.env.DATABASE_PASSWORD,
      port: process.env.DATABASE_PORT,
			host: process.env.DATABASE_HOST
		},
	},
};

module.exports = {
    log: loggers.production,
    port: '8181',
    serverSecretKey: 'AAAAB3NzaC1yc2EAAAABJQBBAQYYhq4rGOpVYmfUYZ8FATEKnULhoBV6G7jXoib9',
    resetPasswordKey: 'V6G7jXoib9aC1yc2YmfUYZAAAAB3NzpVoB8FATEKnULhEAAAABJQBBAQYYhq4rGO',
    twilioAccountSid: 'Your ID',
    twilioAuthToken: 'Your token',
    verificationServiceId: 'VA1dc99f8000f68b1ccfb5d1e8741ece1d',
    database: {
      name: 'your_ddatabase',
      username: 'user',
      password: 'passsword',
      port: '5432',
      host: 'localhost'
    }
}

//process.env.NODE_ENV ? configs[process.env.NODE_ENV] : configs["development"];

