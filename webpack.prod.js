const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');
const Uglify = require("uglifyjs-webpack-plugin");

module.exports = merge(common.config, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      },
      BACKEND_URL: JSON.stringify('/'),
      GOOGLE_API_KEY : JSON.stringify('AIzaSyCkj0yifTWJRnrVrYcwD7B1bts7OXvIoAI'),
      PHONEGAP: false,
      VERSION: JSON.stringify(JSON.parse(fs.readFileSync('./package.json')).version),
    }),
    new Uglify({
      sourceMap: true
    })
  ]
});
