const appMode = process.env.NODE_ENV;

const stripePubKey = 'pk_live_51INfmNHysI0pOYXfF9PaVe32igMWavTO5v87lVLM29yYGJ5VHmEOP4aacMXs3fAf3UU6Skp2aISxR4jNAyAcn39V00IdCEgGg5';
const stripePubTestKey = 'pk_test_51INfmNHysI0pOYXfgtKwjhAiswV38iuFh6L8ZT11WzSxNNMCD4BzjQ5h7tRI7TNwuRSzplDAlhRE6rgyA8PUtRrt00eX6BqSmi';

const stripeKey = process.env.NODE_ENV === 'production' ? stripePubKey : stripePubTestKey;

module.exports = {
	apiRoot: (BACKEND_URL ? BACKEND_URL : '/') + 'api/v2',
	socketRoot: (BACKEND_URL ? BACKEND_URL : 'localhost:3000'),
	googleApiKey: GOOGLE_API_KEY,
	appMode,
	stripePubKey: stripeKey
};