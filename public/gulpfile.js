const gulp = require('gulp');

gulp.task('default', ['compile', 'copy-static'], function () {

});

gulp.task('compile', function () {
        const isProduction = process.env.NODE_ENV == "production";

        const webpack = require('webpack');
        const webpack_stream = require('webpack-stream');
        const webpack_config = {
                output: {
                        filename: 'bundle.js'
                },
                module: {
                        loaders: [
                                {
                                        loader: 'babel-loader',
                                        test: /.jsx$/i,
                                        query: {
                                                presets: ['react', 'es2015'],
                                        }
                                }
                        ]
                },
                devtool: "source-map",
                watch: true
        };

        if (isProduction) {
                webpack_config.plugins = [
                        new webpack.DefinePlugin({
                                'process.env': {
                                        'NODE_ENV': JSON.stringify('production')
                                }
                        }),
                        new webpack.optimize.UglifyJsPlugin({
                                compress: {
                                        warnings: true
                                }
                        })
                ];
                delete webpack_config.devtool;
                webpack_config.watch = false;

                console.log("PRODUCTION enabled")
        } else {
                console.log("PRODUCTION disabled")
        }


        return gulp.src('src/js/index.jsx')
                .pipe(webpack_stream(webpack_config, webpack))
                .pipe(gulp.dest('build/'))
});

gulp.task('copy-static', function () {
        return gulp.src('src/html/*')
                .pipe(gulp.dest('build/'));
});