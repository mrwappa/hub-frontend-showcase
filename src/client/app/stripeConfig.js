let stripeItems;
if (process.env.NODE_ENV === 'production') {
	stripeItems = {
		credit500Price: 'price_1ImzcoHysI0pOYXfsNOj9vmi',
		credit1000Price: 'price_1IP6WlHysI0pOYXfEBXO7o4K',
		credit2000Price: 'price_1ImzcQHysI0pOYXf4yFt0jkX',
		subPrice: 'price_1INz1MHysI0pOYXfRJuwrdvw'
	};
}
else {
	stripeItems = {
		credit500Price: 'price_1ImylYHysI0pOYXfwO98L9Li',
		credit1000Price: 'price_1IP6iSHysI0pOYXf7Ecvs1Lf',
		credit2000Price: 'price_1Imyr2HysI0pOYXfK7Cp0x0x',
		subPrice: 'price_1INzrkHysI0pOYXfBozdBMzS'
	};
}
module.exports = stripeItems;