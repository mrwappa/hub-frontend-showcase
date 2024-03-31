const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const fs = require('fs');
const LiveReloadPlugin = require('webpack-livereload-plugin');

const VERSION = JSON.stringify(JSON.parse(fs.readFileSync('./package.json')).version + '-dev');


module.exports = merge(common.config, {
	mode: 'development',
	devtool: 'source-map',
	devServer: {
		hot: true,
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('development')
			},
			BACKEND_URL: JSON.stringify('/'),
			GOOGLE_API_KEY: JSON.stringify('AIzaSyDpH4UoBlDDjbWyZaB_xxPm8niU957nI1c'),
			PHONEGAP: false,
			VERSION
		}),
		new LiveReloadPlugin({ appendScriptTag: true })
	]
});
