const config = require('../../../config');

const hostname = process.env.NODE_ENV == "production"
                ? "http://localhost"
                : "http://localhost";

const host = hostname + ":" + config.app_listen_port;

module.exports = host;