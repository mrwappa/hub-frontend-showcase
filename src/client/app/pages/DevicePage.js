import React, { useEffect, useState } from 'react';
import { Grid, Segment, Table, Button, Popup, Header, Dimmer, Icon } from 'semantic-ui-react';
import LocationSegment from '../components/LocationSegment';
import ParameterSegment from '../components/ParameterSegment';
import { api } from '../services/ApiService';
import { isUserOwnerOrAdmin } from '../services/ProjectService';
import { subscriptionExpired } from '../services/SubscriptionService';
import moment from 'moment';
import {
	prettifyIdentifier, getAlarmDescription,
	excludedData, isDataRelevant
} from 'services/UtilityService';
//import socket from 'services/Socket.io';
import { userHook, currentProjectHook, devicesHook, deviceAlarmsHook } from '../hooks/ApiQueryHooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { getURLParams } from '../services/UtilityService';
import PageBase from '../components/PageBase';
import SensorList from '../components/SensorList';
import isEmpty from 'lodash.isempty';
import { toastError } from '../services/Toaster';
import DeviceInformation from '../components/DeviceInformation';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { isApiHookLoading } from '../services/ReactUtilities';
import { getChartOptions } from '../services/ChartHelper';
import Chart from '../components/Chart';
import DeviceChartSelector from '../components/DeviceChartSelector';
import { socketHook } from '../hooks/UtilityHooks';

export default function DevicePage() {

	const location = useLocation();
	const navigate = useNavigate();
	const { ref: chartsInViewRef, inView: chartsInView } = useInView({
		delay: 100
	});
	
	const currentDeviceId = getURLParams(location.search, 'device');
	const projectId = getURLParams(location.search, 'project');

	const [currentDevice, setCurrentDevice] = useState({});
	const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
	const [deviceAmount, setDeviceAmount] = useState(0);
	const [isSuperUser, setIsSuperUser] = useState(false);
	const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
	const [projectDisabled, setProjectDisabled] = useState(false);
	const [selectedSpan, setSelectedSpan] = useState('week');
	const [charts, setCharts] = useState(null);
	const [prevNextCounter, setPrevNextCounter] = useState(0);

	const user = userHook({
		onSuccess: (data) => {
			setIsSuperUser(data.role !== 'user');
		}
	});
	const currentProject = currentProjectHook();

	socketHook('project/devices', projectId, () => {
		devices.refetch();
	});

	useEffect(() => {
		if (currentProject.isSuccess && user.isSuccess) {
			let ownerOrAdmin = isUserOwnerOrAdmin(currentProject.data, user.data);
			setIsOwnerOrAdmin(ownerOrAdmin);
			setProjectDisabled(subscriptionExpired(user.data, currentProject.data));
		}
	}, [currentProject.isSuccess, user.isSuccess]);

	function updateDevice(allDevices) {
		let newDevice = allDevices.find((dev, index) => {
			if (dev.id === currentDeviceId) {
				setCurrentDeviceIndex(index);
				return dev.id === currentDeviceId;
			}
		});
		if (newDevice) {
			setDeviceAmount(allDevices.length);
			setCurrentDevice(newDevice);
		}
		else {
			toastError("Couldn't find device");
		}
	}

	const devices = devicesHook({
		onSuccess: (data) => {
			updateDevice(data.results);
		}
	});
	const deviceAlarms = deviceAlarmsHook(currentDeviceId);

	const loading = isApiHookLoading(user, currentDevice, devices, deviceAlarms);

	const removeAlarm = baseMutationHook({
		apiReq: async ({ alarm, sensor }) => {
			//Remove sensor from alarm
			let sourceIndex = alarm.sources.findIndex(s => s.sensor === sensor.id);
			alarm.sources.splice(sourceIndex, 1);

			if (alarm.sources.length === 0) {
				// If no more sources delete whole alarm.
				return await api.delete(`alarms/` + alarm.id);
			}
			else {
				// Else update alarm with source removed.
				return await api.put(`alarms/` + alarm.id, alarm);
			}
		},
		onSuccess: () => {
			deviceAlarms.refetch();
		}
	});

	useEffect(() => {
		if (!isEmpty(devices.data))
			updateDevice(devices.data.results);
	}, [location]);

	function navigateToDevice(direction) {
		let deviceIndex = currentDeviceIndex;
		if (direction === 'next') {
			if (deviceIndex >= deviceAmount - 1) {
				deviceIndex = 0;
			}
			else {
				deviceIndex++;
			}
		}
		else {
			if (deviceIndex === 0) {
				deviceIndex = deviceAmount - 1;
			}
			else {
				deviceIndex--;
			}
		}

		const newDevice = devices.data.results[deviceIndex];
		navigate('../devices/device' + '?project=' + currentProject.data.id + '&device=' + newDevice.id);
		setCharts(null);
	}

	const addDeviceToCharts = baseMutationHook({
		apiReq: async ({ from, to }) => await api.post('devices/' + currentDeviceId + '/sensorTypes/logs?from=' + from.unix() + '&to=' + to.unix(), { sensorTypes: excludedData }),
		onSuccess: (data, reqFields) => {

			let newCharts = [];

			for (let field of currentDevice.data) {
				// Check if type is in excluded data fields
				if (isDataRelevant(field.type)) {
					continue;
				}
				// Create chart for type if not exists.
				if (!newCharts[field.type]) {
					newCharts[field.type] = { type: field.type, options: getChartOptions(field.type, reqFields.from, reqFields.to), datasets: [] };
				}
				let dataSet = data[field.identifier];

				newCharts[field.type].datasets.push({
					label: field.name,
					data: dataSet,
					type: field.type
				});
			}

			setCharts(newCharts);
		}
	});

	function changePrevNextCounter(change) {
		if ((change === 0 && prevNextCounter === 0)) return;//no change

		setCharts(null);
		if (change === 0)
			setPrevNextCounter(0);
		else
			setPrevNextCounter(prevNextCounter + change);
	}

	function onSelectSpan(span) {
		setCharts(null);
		setPrevNextCounter(0);
		setSelectedSpan(span);
	}

	useEffect(() => {
		if (currentDevice.data && chartsInView && charts === null) getChartData();
	}, [prevNextCounter, selectedSpan, currentDevice.id, chartsInView]);

	async function getChartData() {
		let from, to;
		if (selectedSpan === 'day') {
			from = moment().subtract(23 - (prevNextCounter * 24), 'hours').startOf('hour').utc();
			to = moment().add(1 + (prevNextCounter * 24), 'hour').startOf('hour').utc();
		}
		else if (selectedSpan === 'week') {
			from = moment().subtract(6 - (prevNextCounter * 7), 'days').startOf('day').utc();
			to = moment().add(1 + (prevNextCounter * 7), 'day').startOf('day').utc();
		}
		else if (selectedSpan === 'month') {
			from = moment().subtract(30 - (prevNextCounter * 30), 'days').startOf('day').utc();
			to = moment().add(1 + (prevNextCounter * 30), 'day').startOf('day').utc();
		}

		await addDeviceToCharts.mutateAsync({ from, to });
	}

	function renderChartArea() {
		if (charts) {
			let aCharts = [];
			for (let chart in charts) {
				let currentChart = charts[chart];
				aCharts.push(
					<Segment key={chart}>
						<Header>{prettifyIdentifier(chart)}</Header>
						<Chart
							projectId={currentProject.data.id}
							projectColors={currentProject.data.sensorColors}
							chart={currentChart}
							disableChartSettings={!isOwnerOrAdmin}
						/>
					</Segment>
				);
			}
			return aCharts;
		}
	}

	function renderAlarmArea() {//TODO: Test this when there are several alarms connected to it
		if (currentDevice.id && deviceAlarms.data && deviceAlarms.data.length > 0) {
			const alarms = [].concat.apply([], deviceAlarms.data.map((alarm) => {
				return alarm.sources.filter(s => s.device === currentDevice.id).map(source => {
					let sensor = currentDevice.data.find(s => s.id === source.sensor);
					return sensor ? <Table.Row key={alarm.id + sensor.id}>
						<Table.Cell>{getAlarmDescription(alarm)}</Table.Cell>
						<Table.Cell>{sensor.name}</Table.Cell>
						<Table.Cell collapsing>
							<Popup
								trigger={<Button loading={removeAlarm.isLoading} color='red' content='Remove' />}
								on='click'
								position='top right'
							>
								Are you sure? <br />
								<Button color='red' content='Yes!' onClick={() => removeAlarm.mutate({ alarm, sensor })} />
							</Popup>
						</Table.Cell>
					</Table.Row> : null;
				});
			}));

			return (
				<Table unstackable>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>Condition</Table.HeaderCell>
							<Table.HeaderCell>Sensor</Table.HeaderCell>
							<Table.HeaderCell>Remove</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{alarms}
					</Table.Body>
				</Table>
			);
		}
		else {
			return (
				<p>No alarms set for this device.</p>
			);
		}
	}

	const page = (
		<Grid centered padded>
			{
				isSuperUser &&
				<Grid.Column width={16}>
					<Segment>
						<h3>Admin area</h3>
						{
							//<DataList data={adminDataList} />
						}
					</Segment>
				</Grid.Column>
			}
			<Grid.Column width={16}>
				{
					<DeviceInformation
						device={currentDevice}
						isOwnerOrAdmin={isOwnerOrAdmin}
						projectDisabled={projectDisabled}
						projectId={currentProject.data.id}
						refetchDevices={devices.refetch}
					/>
				}

			</Grid.Column>
			{
				currentDevice.data && isOwnerOrAdmin &&
				<Grid.Column width={16}>
					<LocationSegment
						device={currentDevice}
						projectId={currentProject.data.id}
						refetchDevices={devices.refetch}
					/>
				</Grid.Column>
			}
			{
				currentDevice.data &&
				<Grid.Column width={16}>
					<SensorList
						device={currentDevice}
						projectId={currentProject.data.id}
						isOwnerOrAdmin={isOwnerOrAdmin}
						refetchDevices={devices.refetch}
					/>
				</Grid.Column>
			}

			{
				currentDevice.data && currentDevice.parameters.length > 0 && isOwnerOrAdmin &&
				<Grid.Column width={16}>
					<Dimmer.Dimmable blurring dimmed={projectDisabled}>
						<div style={projectDisabled ? { 'pointerEvents': 'none' } : null}>
							<ParameterSegment
								projectId={currentProject.data.id}
								device={currentDevice}
								refetchDevices={devices.refetch}
							/>
						</div>
					</Dimmer.Dimmable>
				</Grid.Column>
			}
			{
				<Grid.Column width={16}>
					<Dimmer.Dimmable blurring dimmed={projectDisabled}>
						<div style={projectDisabled ? { 'pointerEvents': 'none' } : null}>
							<Segment>
								<h3>Alarms</h3>
								{renderAlarmArea()}
							</Segment>
						</div>
					</Dimmer.Dimmable>
				</Grid.Column>
			}
			{
				<Grid.Column width={16}>
					<Dimmer.Dimmable blurring dimmed={projectDisabled}>
						<div ref={chartsInViewRef} style={projectDisabled ? { 'pointerEvents': 'none' } : null}>
							<Segment>
								<h3>Battery, RSSI etc. charts</h3>
								<DeviceChartSelector
									loading={addDeviceToCharts.isLoading}
									selectedSpan={selectedSpan}
									changePrevNextCounter={changePrevNextCounter}
									onSelectSpan={onSelectSpan}
									disableLastPeriod={prevNextCounter === 0}
								/>
								{renderChartArea()}
							</Segment>
						</div>
					</Dimmer.Dimmable>
				</Grid.Column>
			}
		</Grid>
	);

	const deviceNavigator = (
		currentDevice.data && deviceAmount > 1 ?
			<>
				<Button loading={loading} onClick={() => navigateToDevice('previous')} content={<Icon name='arrow left' />} />
				<Button loading={loading} onClick={() => navigateToDevice('next')} content={<Icon name='arrow right' />} />
				{currentDevice.name}
			</>
			:
			'Devices'
	);

	return (<PageBase loading={loading} title={deviceNavigator} page={page} />);
}