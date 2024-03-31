import axios from 'axios';
import store from 'store';
import queryString from 'query-string';
import { apiRoot } from 'config';
import { toastError } from './Toaster';
import { queryClient } from '../hooks/ApiQueryHooks';

const AuthTokenKey = 'AuthToken';
const ProjectIdKey = 'CurrentProjectId';

let AuthToken, CurrentProjectId;

const qParams = 1, qData = 2;

export const api = axios.create({
	baseURL: apiRoot
});

//Request Interceptor (Occurs on every request)
api.interceptors.request.use((config) => {
	if (AuthToken) {
		config.headers['Authorization'] = 'Bearer ' + AuthToken;
	}
	return config;
});

export async function getAuthToken() {
	let token;
	if (!AuthToken) {
		token = await store.get(AuthTokenKey);
	}
	else {
		token = AuthToken;
	}
	return token;
}

export async function setAuthToken(token) {
	AuthToken = token;
	if (token) {
		await store.set(AuthTokenKey, token);
	}
	else {
		store.remove(AuthTokenKey);
	}
}

export function isAuthenticated() {
	return Boolean(AuthToken);
}

export function getCurrentProjectId() {
	return CurrentProjectId;
}

export async function setCurrentProjectId(projectId) {
	if (projectId !== CurrentProjectId) {
		await store.set(ProjectIdKey, projectId);
		CurrentProjectId = projectId;
	}
}

export async function isResponseOK(responseCode) {
	if (typeof responseCode === 'object') {
		responseCode = responseCode.status;
	}
	return responseCode >= 200 && responseCode <= 208;
}

export async function selectFirstProject(projects) {
	if (projects.length === 0) {
		setCurrentProjectId(null);
	}
	else {
		setCurrentProjectId(projects[0].id);
	}
}

export async function initUser(token) {
	await setAuthToken(token);
}

export async function getUser() {
	return await api.get('users/me');
}

export async function getImpersonation(userId) {
	return await api.post(`users/${userId}/impersonate`);
}

export async function impersonate(userId, navigate, path = '/') {
	let impRes = await getImpersonation(userId);
	if (isResponseOK(impRes.status)) {
		queryClient.clear();
		await setAuthToken(impRes.data.token);
		navigate(path, { replace: true });
	}
	else {
		toastError('Impersonation Failed. ERROR:' + impRes.statusText);
	}
}

export async function stopImpersonating(navigate) {
	let res = await api.post('users/stop_impersonating');
	queryClient.clear();
	await setAuthToken(res.data.token);
	navigate('../overview');//Decide what project to go to after right token is set. Get all projects?
}

export async function superViewProject(projectId, userId, navigate) {
	let projectRes = await api.get('organizations/' + projectId);
	let project = projectRes.data;

	let owner = null;
	let myMembership = null;

	project.members.map((member) => {
		if (member.role === 'owner') {
			owner = member;
		}

		if (member.user.id === userId) {
			myMembership = member;
		}
	});

	if (myMembership || owner) {
		//if we don't have membership in project, impersonate
		if (owner && !myMembership) {
			await impersonate(owner.user.id, navigate, '../overview?' + queryString.stringify({ project: projectId }));
		}
		else {
			navigate('../overview?' + queryString.stringify({ project: projectId }));
		}
		return;
	}

	console.log("ERROR: Could not view Project");
}

export async function getSubscription() {
	return await api.get('subscriptions/mine');
}

export async function getProject({ queryKey }) {
	return await api.get(`organizations/${queryKey[qParams]}`);
}

export async function getProjects() {
	return await api.get('organizations/mine');
}

export async function getInvites({ queryKey }) {
	return await api.get('users/' + queryKey[qParams] + '/invites');
}

export async function getNotices({ queryKey }) {
	return await api.get('/users/' + queryKey[qParams] + '/notices', { params: queryKey[qData] });
}

export async function getDevices({ queryKey }) {
	return await api.get(`organizations/${queryKey[qParams]}/devices`);
}

export async function getDeviceLocations({ queryKey }) {
	return await api.get(`organizations/${queryKey[qParams]}/devices/location`);
}

export async function getDeviceAlarms({ queryKey }) {
	return await api.get(`devices/${queryKey[qParams]}/alarms`);
}

export async function getGateways({ queryKey }) {
	return await api.get(`organizations/${queryKey[qParams]}/gateways`);
}

export async function getGateway({ queryKey }) {
	return await api.get(`gateways/check/${queryKey[qParams]}`);
}

export async function getGatewayCheck({ queryKey }) {
	return await api.get(`gateways/${queryKey[qParams]}`);
}

export async function getDeviceKeys({ queryKey }) {
	return await api.get(`devices/${queryKey[qParams]}/keys`);
}

export async function getChartSettings({ queryKey }) {
	return await api.get(`chart-settings/type/${queryKey[qParams]}`);
}

export async function getDeviceTypes() {
	return await api.get('general-settings/devices');
}

export async function getAlarm({ queryKey }) {
	return await api.get(`alarms/${queryKey[qParams]}`);
}

export async function getAlarms({ queryKey }) {
	return await api.get(`organizations/${queryKey[qParams]}/alarms`);
}

setAuthToken(store.get(AuthTokenKey));
setCurrentProjectId(store.get(ProjectIdKey));