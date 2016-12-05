const Promise = require('bluebird');
const parseJson = require('../utils/parseJson');
const responseView = require('../views/response');

const TOUCHES = "touches";

module.exports = {
        putTouch: function (req, res, next) {
                const db = req.db;

                responseView.catch(req, res, next,
                        Promise.resolve().then(() => {
                                return parseJson(req);
                        }).catch(error => {
                                throw responseView.create(null, responseView.STATUS_INVALID_JSON, error);
                        }).then(array => {
                                if (!Array.isArray(array)) array = [array];

                                array.forEach(touch => {
                                        const hasX = touch.hasOwnProperty("x") && typeof touch.x === typeof 0;
                                        const hasY = touch.hasOwnProperty("y") && typeof touch.y === typeof 0;
                                        const hasTimestamp = touch.hasOwnProperty("timestamp") && typeof touch.timestamp === typeof 0;
                                        const hasScene = touch.hasOwnProperty("scene") && typeof touch.scene === typeof 'string';

                                        if (!hasX || !hasY || !hasTimestamp || !hasScene) throw {
                                                message: "Invalid data",
                                                stack: "Expected x, y, timestamp, scene values"
                                        };
                                });

                                return array;
                        }).catch(error => {
                                throw responseView.create(null, responseView.STATUS_INVALID_JSON, error);
                        }).then(touches => {
                                if (!touches.length) return {
                                        insertedCount: 0
                                }

                                return Promise.resolve().then(() => {
                                        return db.collection(TOUCHES).insertMany(touches);
                                }).then(r => {
                                        return r;
                                })
                        }).then(insertResult => {
                                return {
                                        insertedCount: insertResult.insertedCount
                                }
                        })
                );
        },

        getTouch: function (req, res, next, scene) {
                const db = req.db;
                const config = require('../config');

                responseView.catch(req, res, next,
                        Promise.resolve().then(() => {
                                const q = config.quantization;

                                return db.collection(TOUCHES).aggregate([
                                        {
                                                $match: {
                                                        scene: scene
                                                }
                                        }, {
                                                $group: {
                                                        _id: {
                                                                x: { $multiply: [{ $floor: { $divide: ["$x", q]} }, q]},
                                                                y: { $multiply: [{ $floor: { $divide: ["$y", q]} }, q]},
                                                        },
                                                        height: {
                                                                $sum: 1
                                                        }
                                                }
                                        }
                                ]).toArray();
                        }).then(array => {
                                return array.map(h => {
                                        h.x = h._id.x;
                                        h.y = h._id.y;

                                        delete h._id;
                                        return h;
                                });
                        })
                );
        }
}