import io from 'socket.io-client';
import { getAuthToken } from 'services/ApiService';
import { socketRoot } from 'config';

let socket = io(socketRoot);

let activeStreams = [];
let dataStreamListener = null;

function unique(value, index, self) {
	return self.indexOf(value) === index;
}

socket.on('connect', async () => {
	let token = await getAuthToken();
	for (let stream of activeStreams.filter(unique)) {
		socket.emit('join', {
			token: token,
			type: stream.type,
			id: stream.id
		});
	}
});


socket.on('update', (data) => {
	let streams = activeStreams.filter((item) => {
		return item.type === data.type && item.id === data.id;
	});

	for (let stream of streams) {
		stream.cb(data);
	}
});

socket.on('data-chunk', (data) => {
	if (dataStreamListener) {
		dataStreamListener.cb(data);
	}
	else {
		console.log("ERROR: Attempted callback on null dataStreamListener");
	}
});

export async function socketSubcribe(type, id, cb) {
	// Subscribe if no streams already did
	if (!activeStreams.some(item => item.type === type && item.id === id)) {
		socket.emit('join', {
			token: await getAuthToken(),
			type: type,
			id: id
		});
	}

	activeStreams.push({
		type: type,
		id: id,
		cb: cb
	});
}
export async function socketUnsubcribe(type, id, cb) {
	activeStreams = activeStreams.filter((item) => {
		return !(item.type === type && item.id === id && item.cb === cb);
	});

	// Unsubscribe if no streams left for that subscription
	if (!activeStreams.some(item => item.type === type && item.id === id)) {
		socket.emit('leave',
			{
				token: await getAuthToken(),
				type: type,
				id: id
			}
		);
	}
}

/*socket.subscribeToDataStream = async (secretId, cb) => {
  
	socket.emit('join', {
		token: await getAuthToken(),
		secretId: secretId,
	});

	dataStreamListener = { secretId, cb };
};

socket.requestNextDataChunk = async () => {
	if (dataStreamListener) {
		socket.emit('next-chunk', {
			token: await getAuthToken(),
			secretId: dataStreamListener.secretId
		});
	}
};

socket.unsubscribeDataStream = async (abort) => {
	if (dataStreamListener) {
		socket.emit('leave',
			{
				token: await getAuthToken(),
				secretId: dataStreamListener.secretId,
				abort
			}
		);
	}

	dataStreamListener = null;
};*/