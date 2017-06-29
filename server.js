'use strict';

var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var styleLintPlugin = require('stylelint-webpack-plugin');

var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');

var express = require('express');
var proxy = require('proxy-middleware');
var url = require('url');

require('es6-promise').polyfill();

var WebpackDevServer = require('webpack-dev-server');
var port = 8080;
var host = 'localhost';
// pass true for production
var config = getConfig(false);
// ## --------your proxy----------------------
var app = express();
var router = express.Router();
app.use(router);
router.get('/', function(req, res) {
    res.sendFile(__dirname + '\\index.html');
});

var compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    filename: 'js/app.js',
    stats: {colors: true}
}));
app.use(webpackHotMiddleware(compiler, {
    log: console.log,
}))
app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

// ## run the two servers
app.listen(port, function() {
  require("openurl").open(`http://${host}:${port}`)
});


function getConfig(production) {

    return {
        entry: [
            'webpack/hot/dev-server',
            'webpack-hot-middleware/client',
            `${__dirname}/src/main.js`,
        ],
        sassLoader: {
            sourceComments : false,
            outputStyle : 'expanded',
            // tells sass imports if they fail to resolve normally, it will try to resolve
            // from this url too
            includePaths: [path.resolve(__dirname, "./src/styles")]
        },
        devServer : {
          hot : true,
          inline: true,
          open : true,
          historyApiFallback : false
        },
        output: {
            path : '/',
            publicPath : `http://${host}:${port}/`,
            filename: 'js/app.js'
        },
        plugins: [
            // Specify the resulting CSS filename
            new ExtractTextPlugin('css/app.css'),
            new webpack.DefinePlugin({
                PRODUCTION: production,
                DEVELOPMENT: !production,
            }),
            new webpack.HotModuleReplacementPlugin(),
        ],

        module: {
            loaders: [{
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }, {
                test: /\.html$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'html-loader',
            }, {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(
                    'style-loader',
                    'css-loader!postcss!sass-loader?outputStyle=expanded'
                )
            }]
        },

        postcss: [
            autoprefixer({
                browsers: ['last 2 versions']
            })
        ],

        stats: {
            // Colored output
            colors: true
        },

        // Create Sourcemaps for the bundle
        devtool: 'source-map'
    };
}