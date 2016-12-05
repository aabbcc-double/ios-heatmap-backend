const exec = require('child_process').exec;
const Promise = require('bluebird');
const request = require('request');
const should = require('chai').should();
const MongoClient = require('mongodb').MongoClient;

const testTouchesCount = 1000;
const testScenesCount = 100;

let serverProcess;
before(function (done) {
        this.timeout(Number.POSITIVE_INFINITY);

        const config = require('../config');
        new Promise(resolve => {
                console.info("[CONFIG]", `db is ${config.mongodb_url}`);
                const warningMessage = (n) => {
                        console.warn("[!!!WARNING!!!]", `Dropping db for test in ${n}...`);
                }

                const repeatTime = 10;
                for (let i = 0; i < repeatTime; i++) {
                        setTimeout(warningMessage, i * 1000, repeatTime - i);
                }
                setTimeout(resolve, repeatTime * 1000);
        }).then(() => {
                return MongoClient.connect(config.mongodb_url);
        }).then(db => {
                console.warn("[!!!WARNING!!!]", "Dropping database")

                return db.dropDatabase();
        }).then(() => {
                serverProcess = exec("NODE_ENV=test npm start", function (error, stdout, stderr) {
                });
                setTimeout(done, 3000);
        }, error => {
                done(error);
        });
});


const data = {
        scenes: [],
        touches: []
};

describe("input", function () {
        describe("touches", function () {
                do {
                        data.scenes.push((Math.random() * 100).toString(32));
                } while (data.scenes.length < testScenesCount || Math.random() < 0.5);

                const randomScene = () => {
                        const i = Math.floor(Math.random() * data.scenes.length);
                        return data.scenes[i];
                }

                const randomTimestamp = () => {
                        /* 2010/01/01 00:00:00 */
                        const minDate = 1262304000.000
                        const maxDate = Date.now();
                        const delta = maxDate - minDate;

                        return minDate + Math.random() * delta;
                }

                const randomTouch = () => {
                        return {
                                x: Math.random() * 1000,
                                y: Math.random() * 1000,
                                timestamp: randomTimestamp(),
                                scene: randomScene()
                        }
                }

                const randomTouches = () => {
                        const touches = [];
                        while (Math.random() < 0.8) {
                                touches.push(randomTouch());
                        }

                        return touches;
                }

                for (let i = 0; i < testTouchesCount; i++) {
                        it(`should put touches as array #${i}`, function (done) {
                                this.slow(30);

                                const touches = randomTouches();
                                data.touches = data.touches.concat(touches);

                                request({
                                        method: "PUT",
                                        uri: "http://localhost:8080/touches",
                                        json: true,
                                        body: touches
                                }, function (error, response, body) {
                                        if (!!error) return done(error);

                                        body.meta.code.should.equal(0);
                                        body.data.insertedCount.should.equal(touches.length);
                                        done();
                                });

                        });
                }

                for (let i = 0; i < testTouchesCount; i++) {
                        it(`should put touch as single object #${i}`, function (done) {
                                this.slow(30);

                                const touch = randomTouch();
                                data.touches.push(touch);

                                request({
                                        method: "PUT",
                                        uri: "http://localhost:8080/touches",
                                        json: true,
                                        body: touch
                                }, function (error, response, body) {
                                        if (!!error) return done(error);

                                        body.meta.code.should.equal(0);
                                        body.data.insertedCount.should.equal(1);
                                        done();
                                });
                        });
                }

                it('should raise "Invalid JSON"', function (done) {
                        const touches = randomTouches();
                        data.touches = data.touches.concat(touches);

                        request({
                                method: "PUT",
                                uri: "http://localhost:8080/touches",
                                json: true,
                                body: [{
                                        x: "1",
                                        y: "1",
                                        timestamp: "1",
                                        scene: 1
                                }]
                        }, function (error, response, body) {
                                if (!!error) return done(error);

                                body.meta.code.should.equal(1);
                                done();
                        });
                })

                it('', function () {
                        console.log(`Touches prepared: ${data.touches.length}`);
                        console.log(`Scenes prepared: ${data.scenes.length}`);
                })
        });
})

describe("output", function () {


        const config = require('../config');
        const concat = require('object-concat');

        data.scenes.forEach(scene => {
                it(`should return touch heatmap only for scene: ${scene} for all time`, function (done) {
                        this.slow(100);
                        this.timeout(1000);

                        const touches = data.touches.filter(t => t.scene == scene);
                        const q = config.quantization;
                        const heatmap = [];
                        touches.map(t => concat(t)).forEach(t => {
                                t.x = Math.floor(t.x / q) * q;
                                t.y = Math.floor(t.y / q) * q;
                                let index = 0;
                                const hasHeatmapForTouch = heatmap.some((h, i) => {
                                        index = i;
                                        return h.x == t.x && h.y == t.y;
                                });
                                if (hasHeatmapForTouch) {
                                        heatmap[index].height++;
                                } else {
                                        heatmap.push({
                                                x: t.x,
                                                y: t.y,
                                                height: 1
                                        })
                                }
                        });

                        request({
                                method: "GET",
                                uri: `http://localhost:8080/touches/scene/${scene}`,
                                json: true
                        }, function (error, response, body) {
                                if (!!error) return done(error);

                                body.meta.code.should.equal(0);
                                heatmap.forEach(h1 => {
                                        let currentH;
                                        body.data.some(h2 => {
                                                currentH = h2;
                                                return h1.x == h2.x && h1.y == h2.y && h1.height == h2.height;
                                        });

                                        h1.should.to.eql|(currentH);
                                });

                                done();
                        });
                });
        });
});

after(function (done) {
        serverProcess.kill();
        setTimeout(done, 1000);
})