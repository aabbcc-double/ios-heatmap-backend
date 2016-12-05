const Promise = require('bluebird');

const STATUS_TYPE = "___status_type";
const STATUS_TYPE_KEY = "___type___" + Math.floor(Math.random() * 1000).toString(32);

module.exports = {
        STATUS_OK: {
                code: 0,
                message: "OK",
        },

        STATUS_UNDEFINED: {
                code: -1,
                message: "Undefined error",
        },

        STATUS_INVALID_JSON: {
                code: 1,
                message: "Invalid JSON"
        },

        STATUS_NOT_AUTHORIZED: {
                code: 2,
                message: "Not authorized"
        },

        create: function (data, status, error) {
                if (!!error && !status) status = this.STATUS_UNDEFINED;
                if (!status) status = this.STATUS_OK;

                status[STATUS_TYPE_KEY] = STATUS_TYPE;

                return [data, status, error];
        },

        status: function(code, message) {
                const st = {
                        code: code,
                        message: message
                }

                st[STATUS_TYPE_KEY] = STATUS_TYPE;
                return st;
        },

        checkIfResponse: function (obj) {
                return Array.isArray(obj) && obj.length == 3
                        && obj[1].hasOwnProperty(STATUS_TYPE_KEY)
                        && obj[1][STATUS_TYPE_KEY] == STATUS_TYPE;
        },

        errorToJson: function (error) {
                if (error instanceof Error) {
                        const str = JSON.stringify(error, Object.getOwnPropertyNames(error));
                        return JSON.parse(str);
                } else {
                        return error;
                }
        },

        catch: function (req, res, next, fn) {
                return Promise.resolve().then(() => {
                        return fn;
                }).then(null, error => {
                        throw error;
                }).catch(error => {
                        if (this.checkIfResponse(error)) return error;

                        return this.create(null, null, error);
                }).then(response => {
                        if (this.checkIfResponse(response)) return response;

                        return this.create(response, null, null);
                }).then(response => {
                        delete response[1][STATUS_TYPE_KEY];

                        res.send({
                                data: response[0],
                                meta: response[1],
                                error: this.errorToJson(response[2])
                        })
                })
        }
}