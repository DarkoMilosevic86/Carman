const pg = require("pg");
const config = require("./config/config");

pg.types.setTypeParser(1700, function(val) {
    return parseFloat(val);
});

const Pool = pg.Pool;

const pool = new Pool({
    user: config.database.username,
    password: config.database.password,
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
});

/*
const pool = new Pool({
    user: "youruser",
    password: "yourpass",
    host: "localhost",
    port: 8181,
    database: "your_db",
});
*/
module.exports = pool;