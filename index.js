const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const config = require('./config');
const cluster = require('cluster');
const numCPU = require('os').cpus().length;

if (cluster.isMaster && config.cluster_enabled) {
        for (let i = 0; i < numCPU; i++) {
                const worker = cluster.fork();
                const pid = worker.process.pid;

                console.log("[Cluster]", `worker ${pid} born`);
        }

        cluster.on('exit', function (deadWorker, code, signal) {
                const worker = cluster.fork();

                const newPID = worker.process.pid;
                const oldPID = deadWorker.process.pid;

                console.log("[Cluster]", `worker ${oldPID} died with code ${code} and signal ${signal}.`);
                console.log("[Cluster]", `worker ${newPID} born.`);
        });
} else {
        const app = express();

        let localDB;
        MongoClient.connect(config.mongodb_url).then(db => {
                console.log("[MongoDB]", "Connected to MongoDB");

                localDB = db;
        }, err => {
                console.error("[MongoDB]", "Connection to MongoDB failed")
        });

        app.use(function (req, res, next) {
                req.db = localDB;
                next();
        });

        /*
         * Touches
         */
        const touchController = require('./controllers/touchController');
        app.put("/touches", touchController.putTouch);
        app.get("/touches/scenes", touchController.getScenes);
        app.get("/touches/scene/:scene", (req, res, next) => touchController.getTouch(req, res, next, req.params["scene"]));

        /*
         * Images
         */
        const imageController = require('./controllers/imageController');
        app.get("/images/check/:scene", (req, res, next) => imageController.imageNeeded(req, res, next, req.params["scene"]));
        app.post("/images/:scene", (req, res, next) => imageController.addImage(req, res, next, req.params["scene"]));
        app.get("/images/:scene", (req, res, next) => imageController.getImage(req, res, next, req.params["scene"]));

        /*
         * Public
         */
        app.use(express.static("./public/build/"));
        app.use(function (req, res, next) {
                const responseView = require('./views/response');

                responseView.catch(req, res, next,
                        Promise.resolve().then(() => {
                                res.status(404);

                                throw responseView.create(null, null, "404 - Not found");
                        })
                );
        });

        app.listen(config.app_listen_port, () => {
                console.log("[App]", `App listening in ${config.app_listen_port}`);
        });
}