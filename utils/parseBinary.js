const Promise = require('bluebird');

module.exports = (request) => {
    return new Promise((resolve, reject) => {
        let data = new Buffer(0);

        request.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
        });
        request.on('end', () => {
           resolve(data);
        });
    })
}