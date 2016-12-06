const Promise = require('bluebird');
const responseView = require('../views/response');
const Binary = require('mongodb').Binary;
const config = require('../config');
const parseBinary = require('../utils/parseBinary');

const IMAGES = "images";

module.exports = {
        imageNeeded: function (req, res, next, scene) {
                const db = req.db;
                const time = Date.now() - config.image_updated_in * 1000;

                responseView.catch(req, res, next,
                        Promise.resolve().then(() => {
                                return db.collection(IMAGES).find({
                                        timestamp: { $gte: time },
                                        scene: scene
                                }).count();
                        }).then(count => {
                                return count == 0;
                        })
                )
        },

        getImage: function(req, res, next, scene) {
                const db = req.db;

                Promise.resolve().then(() => {
                        return db.collection(IMAGES).find({
                                scene: scene
                        }).sort({
                                timestamp: -1
                        }).next();
                }).then(doc => {
                        if (!doc) {
                                res.status(404).send("not found");
                        } else {
                                res.append("Content-Type", "image/jpeg");
                                res.send(doc.image.buffer);
                        }
                })
                
        },

        addImage: function (req, res, next, scene) {
                const db = req.db;
                const time = Date.now();

                responseView.catch(req, res, next,
                        Promise.resolve().then(() => {
                                return parseBinary(req);
                        }).then(imageBuffer => {
                                return db.collection(IMAGES).insertOne({
                                        timestamp: time,
                                        scene: scene,
                                        image: new Binary(imageBuffer, Binary.SUBTYPE_BYTE_ARRAY)
                                })
                        }).then(() => {
                                return "ok";
                        })
                )
        }
}