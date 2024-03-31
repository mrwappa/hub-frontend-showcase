import React, { useEffect, useState } from 'react';
import { Segment, Button, Form, Table, Message, Label, Header, Dimmer } from 'semantic-ui-react';
import PageBase from 'components/PageBase';
import { api } from 'services/ApiService';
import { subscriptionExpired } from 'services/SubscriptionService';
import { validateUrl, payloadHexWarning, capitalizeFirst, getParameterInput, getURLParams } from '../services/UtilityService';
import { deepCopy } from 'services/UtilityService';
import { alarmHook, currentProjectHook, devicesHook, userHook } from '../hooks/ApiQueryHooks';
import { isUserOwner } from '../services/ProjectService';
import { useLocation, useNavigate } from 'react-router-dom';
import { toastError, toastSuccess } from '../services/Toaster';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import queryString from 'query-string';
import clone from 'lodash.clone';

const alarmTypeOptions = [
	{ key: 'gt', text: 'Greater than', value: 'greaterThan' },
	{ key: 'lt', text: 'Lower than', value: 'lowerThan' },
	{ key: 'oor', text: 'Outside of range', value: 'outOfRange' },
	{ key: 'upInt', text: 'Update Interval', value: 'updateInterval' },
	{ key: 'all', text: 'Always', value: 'always' }
];

const alarmHints = {
	greaterThan: 'The action will trigger when a sensors value is higher than this value.',
	lowerThan: 'The action will trigger when a sensors value is lower than this value.',
	outOfRange: 'The action will trigger when a sensors value is outside of the interval set by lowest and greatest value.',
	always: 'The action will always trigger on incoming data.',
	updateInterval: 'The action will trigger when a sensor has not reported within the specified time interval'
};

const updateIntervalOptions = [
	{ key: '30minutes', value: '30minutes', text: '30 Minutes' },
	{ key: '1hours', value: '1hours', text: '1 Hour' },
	{ key: '2hours', value: '2hours', text: '2 Hours' },
	{ key: '4hours', value: '4hours', text: '4 Hours' },
	{ key: '8hours', value: '8hours', text: '8 Hours' },
	{ key: '12hours', value: '12hours', text: '12 Hours' },
	{ key: '24hours', value: '24hours', text: '24 Hours' },
];

const actionTypeOptions = [
	{ key: 'warning', text: 'Warning on Hub', value: 'warning' },
	{ key: 'email', text: 'Email', value: 'email' },
	//{ key: 'push', text: 'Push Notification', value: 'push' },
	{ key: 'sms', text: 'SMS', value: 'sms' },
	{ key: 'scheduled-sms', text: 'Scheduled SMS', value: 'scheduled-sms' },
	{ key: 'call', text: 'Call', value: 'call' },
	{ key: 'webhook', text: 'Webhook', value: 'webhook' },
	{ key: 'deviceParameters', text: 'Send Device Parameters', value: 'deviceParameters' },
	{ key: 'deviceMessage', text: 'Send Device Message', value: 'deviceMessage' }
];

export default function EditActionPage() {

	const location = useLocation();
	const navigate = useNavigate();

	const URLParams = getURLParams(location.search);

	const user = userHook();

	const devices = devicesHook();
	const alarm = alarmHook(URLParams.action, {
		onSuccess: (data) => {
			setCurrentAction(data);
		},
		disabled: !devices.isSuccess
	});
	const currentProject = currentProjectHook({
		onSuccess: (data) => {
			if (data.availableSensorTypes) {
				let sensorTypes = data.availableSensorTypes.map((sensorType) => {
					return { key: sensorType, text: capitalizeFirst(sensorType), value: sensorType };
				});
				setSensorTypeOptions(sensorTypes);

				let aAction = clone(action);
				aAction.sensorType = data.availableSensorTypes[0];
				setAction(aAction);
			}
		}
	});

	const [action, setAction] = useState({
		sensorType: '',
		alarmType: 'lowerThan',
		criteria: {
			lowerThan: 0,
			greaterThan: 0,
			updateInterval: '1hours'
		}
	});
	const [actionType, setActionType] = useState('');
	const [availableSensors, setAvailableSensors] = useState([]);
	const [selectedSensors, setSelectedSensors] = useState([]);
	const [selectedActions, setSelectedActions] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState({
		name: '',
		id: ''
	});
	const [sensorTypeOptions, setSensorTypeOptions] = useState([]);
	const [devicesWithoutCompatibleSensors, setDevicesWithoutCompatibleSensors] = useState([]);

	const [scheduledAt, setScheduledAt] = useState({
		minute: "00",
		hour: "8",
		alertOnWeekends: false,
		timeZone: ""
	});
	const [deviceParameters, setDeviceParameters] = useState([]);


	const [actionFields, setActionFields] = useState({
		targetUser: '',
		webhookUrl: '',
		deviceMessage: ''
	});
	//const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [owner, setOwner] = useState({});
	const [pageDisabled, setPageDisabled] = useState(false);

	useEffect(() => {
		if (currentProject.isSuccess && user.isSuccess) {
			//setIsOwnerOrAdmin(isUserOwnerOrAdmin(currentProject.data, user.data));
			const aIsOwner = isUserOwner(currentProject.data, user.data);
			setIsOwner(aIsOwner);

			if (!aIsOwner) {
				setOwner(
					currentProject.data.members.find((member) => {
						return member.role === 'owner';
					}).user
				);
			}

			onActionFieldChange('targetUser', { value: user.data.id });
			setPageDisabled(subscriptionExpired(user.data, currentProject.data));
		}
	}, [currentProject.isSuccess, user.isSuccess]);

	useEffect(() => {
		if (devices.isSuccess)
			updateAvailableSensors(devices.data.results, action.sensorType);
	}, [devices.isSuccess, action.sensorType]);

	const saveAction = baseMutationHook({
		apiReq: async () => {
			let aAction = Object.assign({ sources: [], criteria: {}, actions: [] }, action);

			aAction.sources = selectedSensors.map(i => ({ device: i.device.id, sensor: i.sensor.id }));
			aAction.actions = selectedActions;

			if (aAction.alarmType !== 'updateInterval') {
				aAction.criteria.lowerThan = Number(aAction.criteria.lowerThan);
				aAction.criteria.greaterThan = Number(aAction.criteria.greaterThan);
			}

			for (let anAction of aAction.actions) {
				if (anAction.actionType === 'scheduled-sms') {
					anAction.scheduledAt.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
					break;
				}
			}

			if (aAction.id) {
				return await api.put('alarms/' + aAction.id, aAction);
			}
			else {
				return await api.post('organizations/' + currentProject.data.id + '/alarms', aAction);
			}
		},
		onSuccess: (data) => {
			setCurrentAction(data);
			navigate('../actions/action?' + queryString.stringify({ project: currentProject.data.id, action: data.id }), { replace: true });
			toastSuccess('Action Saved!');
		}
	});

	function onCancelClick() {
		navigate('../actions?' + queryString.stringify({ project: currentProject.data.id }), { replace: true });
	}

	function getUserName(id) {
		if (currentProject.data) {
			let member = currentProject.data.members.find(m => m.user.id === id);
			return member.user.firstname + ' ' + member.user.lastname;
		}
		else return currentProject.data.firstname + ' ' + currentProject.data.lastname;
	}

	function getScheduledTimeText(scheduledAt) {
		return scheduledAt.hour + ':' + scheduledAt.minute;
	}

	function getAlertOnWeekendsText(scheduledAt) {
		return scheduledAt.alertOnWeekends ? ' (including weekends)' : '';
	}

	function sensorSelected(sensor) {
		return selectedSensors.some((item) => {
			return item.sensor.id === sensor.id;
		});
	}

	function onToggleSensorClick(sensor, device) {
		let aSelectedSensors = [];
		if (sensorSelected(sensor)) {
			aSelectedSensors = selectedSensors.filter((item) => {
				return item.sensor.id !== sensor.id;
			});
		}
		else {
			aSelectedSensors = selectedSensors.slice();
			aSelectedSensors.push({ sensor, device });
		}

		setSelectedSensors(aSelectedSensors);
	}

	function onToggleAllSensorsClick() {
		if (selectedSensors.length === availableSensors.length) {
			selectedSensors([]);
		}
		else {
			selectedSensors(availableSensors.slice());
		}
	}

	function onAlarmTypeChange(e, data) {
		let criteria = {
			lowerThan: action.criteria.lowerThan || 0,
			greaterThan: action.criteria.greaterThan || 0,
			updateInterval: '1hours'
		};

		onActionFieldChange('targetUser', { value: currentProject.data.members[0].user });
		let aAction = clone(action);
		aAction.criteria = criteria;
		aAction.alarmType = data.value;
		setAction(aAction);
	}

	function onActionTypeChange(e, data) {
		setActionType(data.value);
		setSelectedDevice({ name: '', id: '' });
	}

	function setCurrentAction(currentAction) {
		let aAction = Object.assign({}, action, {
			id: currentAction.id,
			sensorType: currentAction.sensorType,
			alarmType: currentAction.alarmType,
			criteria: currentAction.criteria || { lowerThan: 0, greaterThan: 0 }
		});
		let aAvailableSensors = updateAvailableSensors(devices.data.results, currentAction.sensorType);
		let aSelectedSensors = aAvailableSensors.filter((i) =>
			currentAction.sources.some((s) => s.device === i.device.id && s.sensor === i.sensor.id)
		);
		let aSelectedActions = currentAction.actions ? currentAction.actions : [];
		setAction(aAction);
		setSelectedSensors(aSelectedSensors);
		setSelectedActions(aSelectedActions);
	}

	function onDeviceDropDownClick(event, data) {
		let currentDevice = devices.data.results.find((device) => {
			return device.id === data.value;
		});

		let aSelectedDevice = { name: currentDevice.name, id: data.value };
		let aDeviceParameters = [];
		if (actionType === 'deviceParameters') {
			aDeviceParameters = currentDevice.parameters;
		}

		setSelectedDevice(aSelectedDevice);
		setDeviceParameters(aDeviceParameters);
	}

	function scheduleChanged(target, obj) {
		let aScheduledAt = scheduledAt;
		if (target === 'alertOnWeekends') {
			aScheduledAt[target] = obj.checked;
		}
		else {
			if (obj.value.length <= 2 && !isNaN(obj.value)) {
				aScheduledAt[target] = obj.value;
			}
		}
		setScheduledAt(scheduledAt);
	}

	function onActionFieldChange(field, data) {
		let aActionFields = clone(actionFields);
		aActionFields[field] = data.value;
		setActionFields(aActionFields);
	}

	function onAddActionClick() {
		let aSelectedActions = selectedActions.slice();
		if (actionType == 'webhook') {
			if (!validateUrl(actionFields.webhookUrl)) {
				toastError('Invalid Webhook URL');
				return;
			}
			aSelectedActions.push({ actionType: 'webhook', url: actionFields.webhookUrl });
			// Filter duplicates
			aSelectedActions = aSelectedActions.filter((a, idx) => {
				return aSelectedActions.findIndex(b => a.actionType === b.actionType && a.user === b.user && a.url === b.url) === idx;
			});
		}
		else if (actionType == 'scheduled-sms') {
			let scheduledAt = deepCopy(scheduledAt);

			//Do format correction
			scheduledAt.hour = scheduledAt.hour.length === 0 ? '00' : (Number(scheduledAt.hour) > 23 ? '23' : scheduledAt.hour);
			scheduledAt.minute = scheduledAt.minute.length === 0 ? '00' : (Number(scheduledAt.minute) > 59 ? '59' : scheduledAt.minute);
			scheduledAt.hour = scheduledAt.hour.length === 1 ? '0' + scheduledAt.hour : scheduledAt.hour;
			scheduledAt.minute = scheduledAt.minute.length === 1 ? '0' + scheduledAt.minute : scheduledAt.minute;

			aSelectedActions.push({
				actionType: actionType,
				user: actionFields.targetUser,
				scheduledAt: scheduledAt
			});

		}
		else if (/push|email|sms|call/.test(actionType)) {
			aSelectedActions.push({ actionType: actionType, user: actionFields.targetUser });
		}
		else if (actionType == 'deviceMessage') {
			aSelectedActions.push({ actionType: 'deviceMessage', deviceMessage: actionFields.deviceMessage, device: selectedDevice.id });
		}
		else if (actionType == 'deviceParameters') {
			aSelectedActions.push({ actionType: 'deviceParameters', parameters: deviceParameters, device: selectedDevice.id });
		}
		else {
			aSelectedActions.push({ actionType: actionType });

			//Limit warning to one per Alarm
			let actionsWithWarningOnHub = 0;
			aSelectedActions = aSelectedActions.filter((a) => {
				actionsWithWarningOnHub = a.actionType === 'warning' ? actionsWithWarningOnHub + 1 : actionsWithWarningOnHub;
				if (a.actionType === 'warning' && actionsWithWarningOnHub > 1) {
					return false;
				}
				return true;
			});
		}
		setSelectedActions(aSelectedActions);
		setActionType('');
	}

	function removeActionClick(index) {
		let aSelectedActions = selectedActions.slice();
		aSelectedActions.splice(index, 1);
		setSelectedActions(aSelectedActions);
	}

	function updateAvailableSensors(deviceList, sensorType) {
		let aAvailableSensor = [];
		let devicesWoCompSensors = [];

		for (let device of deviceList) {
			let sensors = device.data.filter((field) => field.type === sensorType);
			if (sensors.length === 0) {
				devicesWoCompSensors.push(device);
			}
			else {
				for (let sensor of sensors) {
					aAvailableSensor.push({ device, sensor });
				}
			}
		}

		setAvailableSensors(aAvailableSensor);
		setDevicesWithoutCompatibleSensors(devicesWoCompSensors);
		return aAvailableSensor;
	}

	function onSensorTypeChange(e, data) {
		setAction(Object.assign({}, action, { sensorType: data.value }));
		setSelectedSensors([]);
	}

	function updateIntervalChanged(e, { value }) {
		let aAction = clone(action);
		aAction.criteria.updateInterval = value;
		setAction(aAction);
	}

	function onCriteriaFieldChange(field, event) {
		let aAction = clone(action);
		if (event.target.value.length === 0) {
			aAction.criteria[field] = '';
			setAction(aAction);
		}
		else {
			let temp = event.target.value;
			if (!isNaN(temp)) {
				aAction.criteria[field] = temp;
				setAction(aAction);
			}
		}
	}

	function isAddActionButtonDisabled() {
		if (actionType === '') {
			return true;
		}
		else if (actionType === 'deviceMessage' && (actionFields.deviceMessage === '' || selectedDevice.id === '')) {
			return true;
		}
		else if (actionType === 'deviceParameters' && (deviceParameters.length === 0 || selectedDevice.id === '')) {
			return true;
		}
		return false;
	}


	function isSaveButtonDisabled() {
		if (selectedSensors.length > 0 && selectedActions.length > 0 && action.criteria.lowerThan !== '' && action.criteria.greaterThan !== '') {
			return false;
		}
		return true;
	}

	function renderActionInputs() {

		if (actionType === 'webhook') {
			return <Form.Input label="URL" placeholder="http://www.example.com" value={actionFields.webhookUrl} onChange={(e, d) => onActionFieldChange('webhookUrl', d)} />;
		}
		else if (actionType === 'scheduled-sms') {
			let userOptions = currentProject.data.members.map(m => ({ key: m.user.id, value: m.user.id, text: m.user.firstname + ' ' + m.user.lastname }));
			let inputStyle = { style: { maxWidth: 100 } };
			return (
				<div>
					<Message
						header='What is a scheduled SMS?'
						content={'If there are any missed notifications that were created from this Action, an SMS alert will be sent out every day at the time of your choosing'}
					/>
					<Form.Select label="User" options={userOptions} value={actionFields.targetUser} onChange={(e, d) => onActionFieldChange('targetUser', d)} />
					<Form.Group>
						<Form.Input {...inputStyle} value={scheduledAt.hour} label='Hour' onChange={(e, d) => scheduleChanged('hour', d)} />
						<Form.Input {...inputStyle} value={scheduledAt.minute} label='Minute' onChange={(e, d) => scheduleChanged('minute', d)} />
					</Form.Group>
					<Form.Checkbox label='Alert on weekends' checked={scheduledAt.alertOnWeekends} onChange={(e, d) => scheduleChanged('alertOnWeekends', d)} />
				</div>
			);
		}
		else if (/email|push|sms|call/.test(actionType) && currentProject.data) {
			let options = currentProject.data.members.map(m => ({ key: m.user.id, value: m.user.id, text: m.user.firstname + ' ' + m.user.lastname }));
			return <Form.Select label="User" options={options} value={actionFields.targetUser} onChange={(e, d) => onActionFieldChange('targetUser', d)} />;
		}
		else if (actionType === 'deviceMessage') {
			let deviceList = devices.map((device) => ({ key: device.id, value: device.id, text: <span>{device.name}</span>, description: <span>{device.uid}</span> }));
			return (<div>
				<Form.Select placeholder='Select Device to send Message to' options={deviceList} value={selectedDevice.id} onChange={onDeviceDropDownClick} />
				<Form.Input label="Device Message (Payload Hex)" placeholder="Payload Hex" value={actionFields.deviceMessage} onChange={(e, d) => onActionFieldChange('deviceMessage', d)} />
				<br />
			</div>);
		}
		else if (actionType === 'deviceParameters') {
			let deviceList = devices.map((device) => ({ key: device.id, value: device.id, text: <span>{device.name}</span>, description: <span>{device.uid}</span> }));
			let parameterRows = deviceParameters.map(param => {
				return <Table.Row key={param.identifier}>
					<Table.Cell width={10}>
						{param.name}<br />
						<small>{param.description}</small>
					</Table.Cell>
					<Table.Cell width={6}>
						{getParameterInput(param, param.value)}
					</Table.Cell>
				</Table.Row>;
			});

			return (<div>
				<Form.Select placeholder='Select Device to send Message to' options={deviceList} value={selectedDevice.id} onChange={onDeviceDropDownClick} />
				{parameterRows.length ?
					<Table>
						<Table.Body>
							{parameterRows}
						</Table.Body>
					</Table> :
					<Segment>
						No Parameters found
					</Segment>}
				<br />
			</div>);
		}
	}



	function renderContent() {

		let deviceWoCompSensors = devicesWithoutCompatibleSensors.map((device) =>
			<Label basic key={device.uid}>
				{device.name}
			</Label>
		);

		let deviceSensors = availableSensors.map((item) => (
			<Label
				key={item.device.uid + '_' + item.sensor.identifier}
				onClick={() => onToggleSensorClick(item.sensor, item.device)}
				color={sensorSelected(item.sensor) ? 'green' : undefined}
				style={{ cursor: 'pointer', userSelect: 'none' }}
				data-cy={item.device.uid + item.sensor.identifier}
			>
				{item.device.name}
				<Label.Detail>{item.sensor.name}</Label.Detail>
			</Label>
		));

		function getActionText(action) {
			switch (action.actionType) {
				case 'warning': return `Warning on Hub`;
				case 'email': return `Send Email (${getUserName(action.user)})`;
				//case 'push': return `Push Notification (${getUserName(action.user)})`;
				case 'sms': return `Send SMS (${getUserName(action.user)})`;
				case 'scheduled-sms': return `Send Scheduled SMS at ${getScheduledTimeText(action.scheduledAt)}${getAlertOnWeekendsText(action.scheduledAt)} (${getUserName(action.user)})`;
				case 'call': return `Call (${getUserName(action.user)})`;
				case 'webhook': return `Webhook (${action.url})`;
				case 'deviceMessage': {
					let currentDevice = devices.find((device) => {
						return action.device === device.id;
					});
					return `Device Message (${action.deviceMessage}) to ${currentDevice.name}`;
				}
				case 'deviceParameters': {
					let currentDevice = devices.find((device) => {
						return action.device === device.id;
					});
					let allParameters = action.parameters.map(param => {
						return (
							<Table.Row key={param.identifier}>
								<Table.Cell width={10}>
									{param.name}
								</Table.Cell>
								<Table.Cell width={10}>
									{param.value.toString()}
								</Table.Cell>
							</Table.Row>);
					});
					return (
						<div>
							<Header as='h4' floated='left'>
								<Header.Content>
									Device Parameters for {currentDevice.name}:
								</Header.Content>
							</Header>
							<Table celled>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell>Parameter</Table.HeaderCell>
										<Table.HeaderCell>Value</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{allParameters}
								</Table.Body>
							</Table>
						</div>);
				}
				// case  'device': return  `Device` 
			}
		}

		let selectedActionList = selectedActions.map((action, index) => (
			<Table.Row key={'action-' + index}>
				<Table.Cell>{getActionText(action)}</Table.Cell>
				<Table.Cell><Button color="red" floated='right' content="Remove" onClick={() => removeActionClick(index)} /><div style={{ clear: 'both ' }} /></Table.Cell>
			</Table.Row>
		));

		return (
			<div>

				<Message
					attached='top'
					header='Select Sensors'
					content='Select which sensors should trigger the action'
				/>
				<Form className='attached segment'>

					{deviceSensors.length > 0 ? (
						<div>
							<Form.Field>
								<Form.Select options={sensorTypeOptions} value={action.sensorType} onChange={onSensorTypeChange} />
							</Form.Field>
							<Form.Field>
								Select among your <b>{action.sensorType}</b> sensors below that should be used for this action.
							</Form.Field>
							<Form.Field>
								{deviceSensors}
							</Form.Field>
							<Form.Field>
								<Button color='blue' content={selectedSensors.length === availableSensors.length ? 'Deselect All' : 'Select All'} disabled={deviceSensors.length === 0} onClick={onToggleAllSensorsClick} />
							</Form.Field>
						</div>
					) :
						<Form.Field>
							<b>No sensors available.</b>
						</Form.Field>
					}
				</Form>
				{deviceWoCompSensors.length > 0 ? (
					<Message attached='bottom' warning>
						<Message.Header>The following devices do not have a {action.sensorType} sensor:</Message.Header>
						<br />
						{deviceWoCompSensors}
					</Message>
				) : null}

				<Message
					attached='top'
					header='Criteria'
					content='Select the criteria for sensor values'
				/>
				<Form className='attached segment'>
					<Form.Field>
						<Form.Select label="Criteria" options={alarmTypeOptions} value={action.alarmType} onChange={onAlarmTypeChange} placeholder='Select criteria' />
						{/lowerThan|outOfRange/.test(action.alarmType) ? <Form.Input label="Lower than value" placeholder='0' value={action.criteria.lowerThan} onChange={(e) => onCriteriaFieldChange('lowerThan', e)} data-cy='lowerThan' /> : null}
						{/greaterThan|outOfRange/.test(action.alarmType) ? <Form.Input label="Greater than value" placeholder='0' value={action.criteria.greaterThan} onChange={(e) => onCriteriaFieldChange('greaterThan', e)} /> : null}
						{
							action.alarmType === 'updateInterval' &&
							<Form.Select
								style={{ width: '50%' }}
								value={action.criteria.updateInterval}
								onChange={updateIntervalChanged}
								options={updateIntervalOptions}
							/>
						}
					</Form.Field>
				</Form>
				<Message
					positive
					attached='bottom'
					content={alarmHints[action.alarmType]}
				/>

				<Message
					attached='top'
					header='Actions'
					content={
						<p>
							Select actions to take when triggered
							<p style={{ color: 'red' }}>
								<b>Actions are not a replacement for your ordinary supervision and should not be used to monitor criticial conditions</b>
							</p>
						</p>
					}
				/>
				{
					actionType === 'deviceMessage' ?
						<Message
							attached
							error
							header='WARNING'
							content={payloadHexWarning}
						/>
						:
						null
				}
				{
					actionType.match(/sms/) || actionType === 'call' ?
						<Message
							attached
							content={
								<div>
									A triggered {actionType.match(/sms/) ? 'SMS' : 'Call'} Action will cost {actionType.match(/sms/) ? '10' : '20'} Credits from the project {"owner's"} account.<br />
									Check out your <a onClick={() => navigate('/account')}>Account page</a> for more info on Credits
									{
										isOwner && user.credits < (actionType.match(/sms/) ? 10 : 20) &&
										<p style={{ color: 'red' }}>
											You have insufficient Credits to get {actionType.match(/sms/) ? 'an SMS' : 'a Call'} sent to you.<br />
											For more information on Credits, please visit your <a onClick={() => navigate('/account')}>Account page</a>.
										</p>
									}
									{
										!isOwner && owner.credits < (actionType.match(/sms/) ? 10 : 20) &&
										<p style={{ color: 'red' }}>
											The project owner has insufficient Credits to get {actionType.match(/sms/) ? 'an SMS' : 'a Call'} sent to you.<br />
											Please <a onClick={() => navigate('/members?' + queryString.stringify({ project: currentProject.data.id }))}>inform your project owner</a> if {"you'd"} like to recieve SMS/Calls as an Action.
										</p>
									}
								</div>
							}
						/>
						:
						null
				}
				<Form className='attached segment' data-cy='actionsForm'>
					<Form.Field>
						<Form.Select label="Type" options={actionTypeOptions} value={actionType} onChange={onActionTypeChange} placeholder='Select action' data-cy='typeDropDown' />
						{renderActionInputs()}
						<Button color='green' floated='right' content="Add action" disabled={isAddActionButtonDisabled()} onClick={onAddActionClick} data-cy="addAction" />
						<div style={{ clear: 'both' }} />
					</Form.Field>
					<Form.Field>
						{selectedActionList.length > 0 ? <Table singleLine>
							<Table.Body>
								{selectedActionList}
							</Table.Body>
						</Table> : null}
					</Form.Field>
				</Form>

				<Segment loading={saveAction.isLoading}>
					<Button floated='right' color="green" disabled={isSaveButtonDisabled()} content="Save" onClick={saveAction.mutate} data-cy="save" />
					<Button floated='right' content="Cancel" onClick={onCancelClick} />
					<div style={{ clear: 'both ' }} />
				</Segment>
			</div>
		);
	}

	const page = (
		<Dimmer.Dimmable blurring dimmed={pageDisabled}>
			<div style={pageDisabled ? { 'pointerEvents': 'none' } : null}>
				<Segment loading={alarm.isLoading} >
					{renderContent()}
				</Segment>
			</div>
		</Dimmer.Dimmable>
	);

	return (
		<PageBase page={page} title="Edit Action" />
	);

}
