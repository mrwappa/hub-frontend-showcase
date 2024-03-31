import { useQuery } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	setAuthToken,
	getCurrentProjectId,
	getInvites,
	getUser,
	getProject,
	getProjects,
	setCurrentProjectId,
	getNotices,
	getSubscription,
	getDevices,
	getGateways,
	getDeviceAlarms,
	getDeviceLocations,
	getGateway,
	getGatewayCheck,
	getDeviceKeys,
	getChartSettings,
	getDeviceTypes,
	getAlarm,
	getAlarms
} from '../services/ApiService';

import { toastError } from '../services/Toaster';

const defaultStaleTime = 10 * 1000;//10 seconds

import {
	QueryClient
} from 'react-query';
import isEmpty from 'lodash.isempty';
import { useEffect } from 'react';
import { getProjectIdFromURL } from '../services/ProjectService';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: defaultStaleTime,
			retry: 1
		}
	}
});

export async function errorHandler(error, navigate, location, onError) {

	const resCode = error.response.status;

	if (typeof onError === 'function') onError(error.response.data);
	toastError(error.response.data.details);

	if (resCode === 412 && location.pathname !== '/activate') {
		navigate('/notactivated');
	}

	//TODO: Should update subscription, and rerouting to error page exist? Probably not...
	if (resCode === 402) {
		//updateSubscription();
	}

	/*const userQuery = queryClient.getQueryData(['user'], { exact: false, active: true });
	const user = userQuery.data;
	console.log(user);

	if (resCode === 403 || resCode === 404 && user && !user.role.match(/master|superUser/)) {
		let project = await getProject();
		console.log(project);
		if (project && project.status === 403) {
			//await instance.selectFirstProject();
		}
		navigate('/error');
	}*/

	if (resCode === 401) {
		setAuthToken(null);
		navigate('/');
	}
}

function baseQueryHook({
	qKey,
	apiReq,
	apiParams,
	apiData,
	defaultValue = {},
	enabled = true,
	onSuccess,
	onError,
	refetchOnMount = true,
	staleTime = defaultStaleTime
}) {
	const navigate = useNavigate();
	const location = useLocation();

	const query = useQuery(
		[qKey, apiParams, apiData],
		apiReq,
		{
			/*onSuccess: (data) => {
				if (typeof onSuccess === 'function') onSuccess(data ? data.data : data);
			},*/
			onError: (err) => errorHandler(err, navigate, location, onError),
			enabled,
			refetchOnMount,
			staleTime
			//notifyOnChangeProps: ['data', 'error', 'status', 'refetch']//TODO WARNING: see if this is a working structure
		}
	);

	useEffect(() => {
		if (query.isSuccess) {
			if (typeof onSuccess === 'function') onSuccess(query.data);
		}
	}, [query.dataUpdatedAt]);

	function setData(data) {
		queryClient.setQueryData([qKey, apiParams, apiData], data);
	}

	let hook = query;
	hook.data = query.data ? (query.data.data || query.data) : defaultValue;
	hook.setData = setData;
	return hook;
}

export const userHook = (props) => baseQueryHook({
	qKey: 'user',
	apiReq: getUser,
	...props
});

export const subscriptionHook = (props) => baseQueryHook({
	qKey: 'subscription',
	apiReq: getSubscription,
	...props
});

export const noticesHook = (userData, fromInventory, onSuccess) => baseQueryHook({
	qKey: 'notices',
	apiReq: getNotices,
	apiParams: userData.id,
	apiData: fromInventory ? { inventoryNotices: fromInventory } : undefined,
	defaultValue: [],
	onSuccess,
	enabled: !isEmpty(userData.role) && (fromInventory ? userData.role !== 'user' : true)
});

export const projectsHook = (props) => baseQueryHook({
	qKey: 'projects',
	apiReq: getProjects,
	defaultValue: [],
	...props
});

export function currentProjectHook(props = {}) {

	const projects = projectsHook();

	let currentProjectId = getCurrentProjectId();

	if (!currentProjectId) {
		if (projects.data.length > 0) {
			currentProjectId = projects.data[0].id;
			setCurrentProjectId(currentProjectId);
		}
	}

	const hook = baseQueryHook({
		qKey: 'project',
		apiReq: getProject,
		apiParams: currentProjectId,
		enabled: !isEmpty(currentProjectId) && !props.disabled,
		...props
	});

	async function changeProject(projectId) {
		await setCurrentProjectId(projectId);
		//TODO: The real question here is why we need to refetch in the first place. If we're going back and forth between -
		//projects then THAT is cached data, why refetch non stale cached data?
		//THOUGH - on a staletime of 10 seconds, does it even matter? People aren't going to navigate like they're having a seizure :D
		await hook.refetch();//TODO: fix this turning into 2 api requests (one of the former and of the current project)
		//await queryClient.refetchQueries(['devices', projectId, null], { exact: true});
	}

	hook.changeProject = changeProject;

	return hook;
}

export function devicesHook(props) {

	const location = useLocation();
	const projectId = getProjectIdFromURL(location.search);//TODO: What solution can this be replaced with? Should this be used everywhere?

	const hook = baseQueryHook({
		qKey: 'devices',
		apiReq: getDevices,
		apiParams: projectId,
		enabled: !isEmpty(projectId),
		defaultValue: {},
		...props
	});

	return hook;
}

export function alarmHook(id, props = {}) {
	return baseQueryHook({
		qKey: 'alarm',
		apiReq: getAlarm,
		apiParams: id,
		defaultValue: {},
		enabled: !isEmpty(id) && !props.disabled,
		...props
	});
}

export function alarmsHook(props) {
	const projectId = getProjectIdFromURL(location.search);
	return baseQueryHook({
		qKey: 'alarm',
		apiReq: getAlarms,
		apiParams: projectId,
		defaultValue: {},
		enabled: !isEmpty(projectId),
		...props
	});
}

export function deviceAlarmsHook(id) {
	return baseQueryHook({
		qKey: 'deviceAlarms',
		apiReq: getDeviceAlarms,
		apiParams: id,
		defaultValue: [],
		enabled: !isEmpty(id)
	});
}

export function deviceLocationsHook(projectId, props) {
	return baseQueryHook({
		qKey: 'deviceLocations',
		apiReq: getDeviceLocations,
		apiParams: projectId,
		defaultValue: [],
		enabled: !isEmpty(projectId),
		...props
	});
}

export function deviceKeysHook(id, props) {
	return baseQueryHook({
		qKey: 'deviceKeys',
		apiReq: getDeviceKeys,
		apiParams: id,
		defaultValue: [],
		enabled: !isEmpty(id),
		...props
	});
}

export const deviceTypesHook = (props) => baseQueryHook({
	qKey: 'deviceTypes',
	apiReq: getDeviceTypes,
	...props
});

export function gatewaysHook(props) {

	const location = useLocation();
	const projectId = getProjectIdFromURL(location.search);//TODO: What solution can this be replaced with? Should this be used everywhere?

	return baseQueryHook({
		qKey: 'gateways',
		apiReq: getGateways,
		defaultValue: {},
		apiParams: projectId,
		enabled: !isEmpty(projectId),
		...props
	});
}

export function gatewayHook(id, props) {
	return baseQueryHook({
		qKey: 'gateway',
		apiReq: getGateway,
		apiParams: id,
		defaultValue: {},
		enabled: !isEmpty(id),
		...props
	});
}

export function gatewayCheckHook(id, props) {
	return baseQueryHook({
		qKey: 'gatewayCheck',
		apiReq: getGatewayCheck,
		apiParams: id,
		defaultValue: {},
		enabled: !isEmpty(id),
		...props
	});
}

export function chartSettingsHook(type, props) {
	return baseQueryHook({
		qKey: 'chartSettings',
		apiReq: getChartSettings,
		apiParams: type,
		defaultValue: {},
		enabled: !isEmpty(type),
		...props
	});
}

export function invitesHook() {

	const user = userHook();

	const userData = user.data || {};

	const hook = baseQueryHook({
		qKey: 'invites',
		apiReq: getInvites,
		apiParams: userData.id,
		defaultValue: [],
		enabled: userData.id !== undefined
	});
	return (hook);
}