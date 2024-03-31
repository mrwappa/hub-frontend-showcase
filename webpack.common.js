const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const htmlPlugin = new HtmlWebpackPlugin({
	template: './index.html',
	filename: 'index.html',
	favicon: 'favicon.ico',
	inject: 'body',
	minify: {
		collapseWhitespace: true
	}
});

module.exports.htmlPlugin = htmlPlugin;

module.exports.config = {
	context: __dirname + '/src/client',
	entry: ['@babel/polyfill', './index.js'],
	output: {
		path: __dirname + '/dist/client',
		filename: 'bundle.js',
		publicPath: '/'
	},
	module: {
		rules: [
			{
				test: /\.js$|jsx/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', { targets: "defaults" }],
						]
					}
				},
				exclude: /node_modules/
			},
			{
				test: /\.css$/i,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /favicon.ico/,
				use: {
					loader: 'file-loader'
				},
				exclude: /node_modules/
			},
			/*{
				test: /manifest.json$/,
				use: [
					{
						loader: 'file-loader?name=manifest.json!web-app-manifest-loader'
					}
				],
				exclude: /node_modules/
			},*/
			{
				test: /\.md/,
				use: [
					{ loader: 'file-loader', options: { name: '[path][name].html' } },
					{ loader: 'markdown-loader' }
				],
				exclude: /node_modules/
			},
			{
				test: /\.(png|svg)$/,
				use: {
					loader: 'file-loader?name=images/[hash].[ext]'
				}
			},
			{
				test: /\.(eot|ttf|woff|woff2)$/,
				use: {
					loader: 'file-loader?name=fonts/[name].[ext]'
				}
			}
		]
	},
	resolve: {
		alias: {
			actions: path.resolve(__dirname, 'src/client/app/actions/'),
			components: path.resolve(__dirname, 'src/client/app/components/'),
			pages: path.resolve(__dirname, 'src/client/app/pages/'),
			services: path.resolve(__dirname, 'src/client/app/services/'),
			hooks: path.resolve(__dirname, 'src/client/app/hooks/'),
			stores: path.resolve(__dirname, 'src/client/app/stores/'),
			images: path.resolve(__dirname, 'src/client/images/'),
			config$: path.resolve(__dirname, 'src/client/app/config.js'),
			stripeConfig$: path.resolve(__dirname, 'src/client/app/stripeConfig.js'),
			dispatcher$: path.resolve(__dirname, 'src/client/app/dispatcher.js')
		}
	},
	plugins: [
		htmlPlugin
	]
};
