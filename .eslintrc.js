module.exports = {
	'env': {
		'browser': true,
		'es2021': true,
		'node': true
	},
	'extends': [
		'eslint:recommended',
		'plugin:react/recommended'
	],
	'parser': '@babel/eslint-parser',
	'parserOptions': {
		'ecmaFeatures': {
			'jsx': true
		},
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	'plugins': [
		'react',
		'cypress'
	],
	'rules': {
		'semi': [
			'error',
			'always'
		],
		'no-extra-semi': 'error',
		'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
		'no-multi-spaces': ['error', { 'ignoreEOLComments': true }],
		'no-console': 'off',
		'padded-blocks': 'off',
		'react/no-unescaped-entities': 0,
		'react/prop-types': 'off',
		'keyword-spacing': 'warn'
	},
	'globals': {
		'HttpError': true,
		'Promise': false,
		'VERSION': false,
		'PHONEGAP': false,
		'BACKEND_URL': false,
		'GOOGLE_API_KEY': false,
		'expect': false,
		'test': false,
		'describe': false,
		'ga': false,
		'ActiveXObject': false
	},
	'settings': {
		'react': {
			'version': '17.0.2'
		}
	},
};
