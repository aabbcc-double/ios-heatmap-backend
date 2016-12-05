const Promise = require('bluebird');

module.exports = (request) => {
    return new Promise((resolve, reject) => {
        let data = "";

        request.on('data', (chunk) => {
            data += chunk;
        });
        request.on('end', () => {
            try {
                const json = JSON.parse(data);
                resolve(json);
            } catch (e) {
                reject(e);
            }
        });
    })
}