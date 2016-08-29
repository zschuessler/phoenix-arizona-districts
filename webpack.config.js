var webpack = require('webpack');

module.exports = {
    devtool: 'source-map',
    entry: './assets/js/app.js',
    output: {
        library: 'App',
        path: './',
        filename: 'app.min.js',
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
    ]
}