import React, { useEffect, useState } from 'react';
import { Segment, Header, Loader, Dimmer, Button, Popup } from 'semantic-ui-react';
import queryString from 'query-string';
import { api } from 'services/ApiService';
import moment from 'moment';
import { subscriptionExpired } from '../services/SubscriptionService';
import { getURLParams, isDataRelevant, prettifyIdentifier } from '../services/UtilityService';
import { getChartOptions } from '../services/ChartHelper';
import Chart from '../components/Chart';
import Selector from '../components/Selector';

import { isUserOwnerOrAdmin } from '../services/ProjectService';
import { currentProjectHook, devicesHook, userHook } from '../hooks/ApiQueryHooks';
import PageBase from '../components/PageBase';
import { useLocation, useNavigate } from 'react-router-dom';
import { baseMutationHook } from '../hooks/ApiPostHooks';

let selectedDevice;

export default function ChartPage() {

	const location = useLocation();
	const navigate = useNavigate();

	const urlParams = getURLParams(location.search);
	selectedDevice = urlParams.device !== 'all' && urlParams.device || selectedDevice;

	const currentProject = currentProjectHook();
	const user = userHook();
	const devices = devicesHook({
		onSuccess: async (data) => {
			let aActiveDevices = data.results.filter((device) => {
				return device.active;
			});

			if (aActiveDevices.length > 0) {
				selectedDevice = aActiveDevices[0].id;

				const stopForNavigation = async () => {
					return new Promise((resolve) => {
						navigate('/charts?' + queryString.stringify({
							project: urlParams.project, device: urlParams.device !== 'all' ? selectedDevice : 'all', from: defaultFromTime, to: defaultToTime
						}),
							{ replace: true }
						);
						resolve();
					});
				};

				await stopForNavigation();
				await updateCharts(aActiveDevices);
			}

			let deviceList = aActiveDevices.map((device) => ({
				key: device.id,
				value: device.id,
				text: device.name + " "/*added blank space because of duplicate key bug*/,
				description: device.uid
			}));

			setActiveDevices(aActiveDevices);
			setDeviceList(deviceList);
		}
	});

	const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
	const [pageDisabled, setPageDisabled] = useState(false);

	const [charts, setCharts] = useState([]);
	const [activeDevices, setActiveDevices] = useState([]);
	const [deviceList, setDeviceList] = useState([]);
	//const [selectedDevice, setSelectedDevice] = useState(null);
	//const selectedView = getURLParams(location.search, 'device') || 'single';
	//const [selectedView, setSelectedView] = useState(getURLParams(location.search, 'device') || 'single');
	const [defaultFromTime] = useState(moment().subtract(23, 'hours').startOf('hour').unix());
	const [defaultToTime] = useState(moment().add(1, 'hour').startOf('hour').unix());

	useEffect(() => {
		if (currentProject.isSuccess && user.isSuccess) {
			const ownerOrAdmin = isUserOwnerOrAdmin(currentProject.data, user.data);
			setIsOwnerOrAdmin(ownerOrAdmin);
			setPageDisabled(subscriptionExpired(user.data, currentProject.data));
		}
	}, [currentProject.isSuccess, user.isSuccess]);


	useEffect(() => {
		if (!getChartData.isLoading && activeDevices.length > 0) {
			updateCharts();
		}
	}, [location]);

	async function updateCharts(aDevices) {
		if (!aDevices) aDevices = activeDevices;

		if (aDevices.length > 0)
			getChartData.mutate({ aDevices });
	}


	const getChartData = baseMutationHook({
		apiReq: async ({ aDevices }) => {
			const from = urlParams.from || defaultFromTime;
			const to = urlParams.to || defaultToTime;

			if (urlParams.device === 'all') {
				let deviceIds = aDevices.map((device) => {
					return device.id;
				});
				return await api.post('devices/batch/logs?from=' + from + '&to=' + to, { devices: deviceIds });
			}
			else {
				let device = aDevices.find((dev) => dev.id === urlParams.device);
				if (device) {
					let sensorTypes = [];
					device.data.some((sensor) => {
						if (isDataRelevant(sensor.type)) {
							let typeMatch = sensorTypes.find((type) => type === sensor.type);
							if (!typeMatch) {
								sensorTypes.push(sensor.type);
							}
						}
					});
					return await api.post('devices/' + device.id + '/sensorTypes/logs?from=' + from + '&to=' + to, { sensorTypes: sensorTypes });
				}
			}
		},
		onSuccess: (data, { aDevices }) => {
			if (!aDevices) aDevices = activeDevices;

			const from = urlParams.from || defaultFromTime;
			const to = urlParams.to || defaultToTime;

			let aCharts = [];
			if (urlParams.device === 'all') {
				for (let device of aDevices) {
					let logId = Object.keys(data).find((log) => {
						return log === device.id;
					});
					let log = data[logId];
					addDeviceToCharts(aCharts, device, log, from, to, true);
				}
			}
			else {
				let device = aDevices.find((dev) => dev.id === urlParams.device);
				addDeviceToCharts(aCharts, device, data, from, to, false);
			}
			setCharts(aCharts);
		}
	});

	function addDeviceToCharts(aCharts, device, log, from, to, includeDeviceName) {
		for (let field of device.data) {

			// Check if type is in excluded data fields
			if (!isDataRelevant(field.type)) {
				continue;
			}

			// Create chart for type if not exists.
			if (!aCharts[field.type]) {
				aCharts[field.type] = { type: field.type, options: getChartOptions(field.type, from, to), datasets: [] };
			}

			let dataSet = log[field.identifier];
			let visible = true;
			/*if (currentProject.data && currentProject.data.hiddenSensors) {
				let index = -1;
				let deviceMatch = currentProject.data.hiddenSensors.find((aDevice, currentIndex) => {
					index = currentIndex;
					return aDevice.deviceId == device.id;
				});

				if (deviceMatch) {
					let sensorMatch = currentProject.data.hiddenSensors[index].sensors.find((hiddenSensor) => {
						return hiddenSensor == field.id;
					});

					visible = sensorMatch === undefined;
				}
			}*/
			aCharts[field.type].datasets.push({
				label: includeDeviceName ? device.name + ' - ' + field.name : field.name,
				data: dataSet,
				type: field.type,
				sensorId: field.id,
				deviceId: device.id,
				visible
			});
			aCharts[field.type].datasets.sort((a, b) => (a.label > b.label) ? 1 : -1);
		}
	}

	/*const changeLegendVisibility = baseMutationHook({
		apiReq: async (data) => {
			if (isOwnerOrAdmin) {
				return await api.post('organizations/' + currentProject.data.id + '/hidden-sensor/',
					{ sensorId: data.target.options.sensorId, deviceId: data.target.options.deviceId });
			}
		},
		autoApplyRes: true
	});*/
	/*async function onLegendItemClick(data) {
		if (!isOwnerOrAdmin) return;

		await api.post('organizations/' + currentProject.data.id + '/hidden-sensor/',
			{ sensorId: data.target.options.sensorId, deviceId: data.target.options.deviceId });
	}*/

	function updateSensorVisibility() {
		if (!currentProject.data.hiddenSensors) {
			return;
		}

		for (let chartType in charts) {
			let aCharts = charts[chartType].datasets.map((set) => {
				let deviceMatch = currentProject.data.hiddenSensors.find((obj) => {
					return obj.deviceId === set.deviceId;
				});
				if (deviceMatch) {
					let sensorMatch = deviceMatch.sensors.find((sensor) => {
						return sensor === set.sensorId;
					});

					set.visible = sensorMatch === undefined;
				}
				return set;
			});

			setCharts(aCharts);
		}
	}

	async function changeChartVisibility(chartType) {
		let res = await api.put('organizations/' + currentProject.data.id, { hiddenSensorTypeEntry: chartType });
		if (res.status === 200) {
			let match = res.data.hiddenSensorTypes && res.data.hiddenSensorTypes.find((type) => {
				return chartType === type;
			});
			if (!match) {
				updateSensorVisibility();
			}
		}
	}

	let chartList = [];
	if (!getChartData.isLoading) {
		for (let chartType in charts) {
			let hiddenChart = (
				currentProject.data.hiddenSensorTypes ?
					currentProject.data.hiddenSensorTypes.find((type) => {
						return type === chartType;
					})
					:
					null
			);

			let currentChart = charts[chartType];
			let chart;

			if (hiddenChart && isOwnerOrAdmin) {
				chart = (
					<Segment key={chartType}>
						<Header>
							{prettifyIdentifier(chartType)}
							<Popup
								position='top right'
								trigger={
									<Button
										floated='right'
										onClick={() => changeChartVisibility(chartType)}
										content='Show Chart Type'
									/>
								}
								content={"Reveal this Chart Type for viewers of this project"}
							/>
						</Header>
						<div />
					</Segment>
				);
				chartList.push(chart);
			}
			else if (!hiddenChart) {
				chart = (
					<Segment key={chartType}>
						<Header>
							{prettifyIdentifier(chartType)}
							{/*
								isOwnerOrAdmin &&
								<Popup
									position='top right'
									trigger={
										<Button
											floated='right'
											onClick={() => changeChartVisibility(chartType)}
											content='Hide Chart Type'
										/>
									}
									content={"Hide this Chart Type from viewers of this project"}
								/>
								*/}

						</Header>
						<Chart
							projectColors={currentProject.data.sensorColors}
							chart={currentChart}
							//onLegendItemClick={changeLegendVisibility.mutate}
							disableChartSettings={!isOwnerOrAdmin}
						/>
					</Segment>
				);
				chartList.push(chart);
			}
		}
	}
	else {
		chartList.push(
			<Segment key={'loading-data-segment'}>
				<Loader active inline='centered' style={{ zIndex: 0 }}>{'Fetching your data - this might take a couple of seconds'}</Loader>
			</Segment>
		);
	}

	if (chartList.length === 0 && deviceList.length !== 0) {
		chartList.push(
			<Segment key={'no-data-segment'} textAlign='center'>
				<p>No Charts are visible for this Device</p>
			</Segment>
		);
	}

	const page = (
		<Dimmer.Dimmable blurring dimmed={pageDisabled}>
			<div style={pageDisabled ? { 'pointerEvents': 'none' } : null}>
				<Selector
					selectedView={urlParams.device}
					selectedDevice={selectedDevice}
					update={updateCharts}
					devices={deviceList}
					projectId={urlParams.project}
					from={urlParams.from || defaultFromTime}
					to={urlParams.to || defaultToTime}
					loading={getChartData.isLoading}
				/>
				{chartList.length > 0 ? chartList : <Segment textAlign='center'><p>You do not have any devices yet</p></Segment>}
			</div>
		</Dimmer.Dimmable>
	);

	return (<PageBase title={'Charts'} page={page} />);
}