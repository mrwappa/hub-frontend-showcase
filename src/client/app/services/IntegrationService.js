import { api } from 'services/ApiService';

const allActions = {
	flushDownlinks: { key: 'flushDownlinks', text: 'Flush Downlinks', value: 'flushDownlinks' },
	getDownlinkQueue: { key: 'getDownlinkQueue', text: 'View Downlink Queue', value: 'getDownlinkQueue' }
};

const integrations = {
	'sensefarm': {
		actions: [allActions.flushDownlinks]
	},
	'sensefarm-lora': {
		actions: [allActions.flushDownlinks]
	},
	'sensefarm-modbus': {
		actions: []
	},
	'a2a': {
		actions: []
	},
	'actility': {
		actions: []
	},
	'blink': {
		actions: []
	},
	'loriot': {
		actions: []
	},
	'skywalker-gateway': {
		actions: []
	},
	'talkpool': {
		actions: []
	},
	'ttn': {
		actions: []
	},
	'yggio': {
		actions: []
	}
};

export function getActionsOfIntegration(integration) {
	let result = integrations[integration];

	if (!result) {
		console.log("WARNING: INTEGRATION UNDEFINED");
		return [];
	}

	return result.actions;
}

export async function executeAction(action, id) {
	return await api.post('devices/' + id + '/send-action/', { action });
}