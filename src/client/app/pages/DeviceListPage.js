import React, { useEffect, useState } from 'react';
import { Table, Checkbox, Button, Tab, Menu, Label, Popup, Icon, List, Segment, Header, Divider } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import PageBase from '../components/PageBase';
import AddDeviceModal from '../components/AddDeviceModal';
import SimpleParameterSegment from '../components/SimpleParameterSegment';
import SafeButton from '../components/SafeButton';
import SimpleFieldList from '../components/SimpleFieldList';
import { api } from '../services/ApiService';
import moment from 'moment';
import { isUserOwnerOrAdmin } from '../services/ProjectService';
import { getAlarmWarningDescription, getURLParams } from '../services/UtilityService';
import { subscriptionExpired } from '../services/SubscriptionService';
import { userHook, currentProjectHook, devicesHook, gatewaysHook } from '../hooks/ApiQueryHooks';
//import MoveDeviceModal from 'components/MoveDeviceModal';
//import socket from '../services/Socket.io';
import { isApiHookLoading } from '../services/ReactUtilities';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { toastSuccess } from '../services/Toaster';
import { useLocation } from "react-router-dom";
import { socketHook } from '../hooks/UtilityHooks';


export default function DeviceListPage() {

	const currentProject = currentProjectHook();
	const user = userHook();

	const devices = devicesHook({
		onSuccess: (data) => {
			if (activeTab === 0)
				setMyDevices(applySort(data.results));
		}
	});

	const gateways = gatewaysHook({
		onSuccess: (data) => {
			if (activeTab === 1)
				setMyDevices(applySort(data.results));
		}
	});

	const location = useLocation();
	const projectId = getURLParams(location.search, 'project');

	socketHook('project/devices', projectId, () => {
		devices.refetch();
	});

	const [addDeviceUID, setAddDeviceUID] = useState(getURLParams(location.search, 'device'));
	const [addGatewayUID, setAddGatewayUID] = useState(getURLParams(location.search, 'gateway'));

	const [sortSettings, setSortSettings] = useState({
		column: 'name', direction: 'asc'
	});
	const [activeTab, setActiveTab] = useState(0);

	const [myDevices, setMyDevices] = useState([]);
	const [selectedDevices, setSelectedDevices] = useState([]);
	const [selectedDeviceView, setSelectedDeviceView] = useState(null);

	const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
	const [showMoveDeviceModal, setShowMoveDeviceModal] = useState(false);
	const [showExportModal, setShowExportModal] = useState(false);

	const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
	const [disableButtons, setDisableButtons] = useState(false);

	//TODO: The problem here is that this updating can't be set inside user nor projecthook, because then it will be updated on every instance
	//How is that fixed?
	//Just make a seperate hook that returns isOwnerOrAdmin and subscriptionExpired?
	useEffect(() => {
		if (currentProject.isSuccess && user.isSuccess) {
			let ownerOrAdmin = isUserOwnerOrAdmin(currentProject.data, user.data);
			setIsOwnerOrAdmin(ownerOrAdmin);
			setDisableButtons(!ownerOrAdmin || subscriptionExpired(user.data, currentProject.data));
		}
	}, [currentProject.isSuccess, user.isSuccess]);

	const toggleActive = baseMutationHook({
		apiReq: async (device) => {
			return await api.put('organizations/' + currentProject.data.id + '/devices/' + device.id, { active: !device.active });
		},
		onSuccess: () => {
			devices.refetch();
		}
	});

	const syncKeysToLoraServer = baseMutationHook({
		apiReq: async () => {
			return await api.put('/devices/sync-keys-to-lora', { devices: selectedDevices });
		},
		onSuccess: () => {
			toastSuccess('Successfully Synced Keys');
		}
	});

	const removeDevice = baseMutationHook({
		apiReq: async (id) => {
			if (activeTab === 0) {
				return await api.delete('organizations/' + currentProject.data.id + '/devices/' + id);
			}
			else {
				return await api.delete('organizations/' + currentProject.data.id + '/gateways/' + id);
			}
		}
	});

	const loading = isApiHookLoading(currentProject, user, devices, gateways);

	//Sorts the tab that you've selected on the device section by either ascending or descending order
	function applySort(items) {

		const order = sortSettings.direction === 'asc' ? 1 : -1;

		if (sortSettings.column == 'alarms') {
			// Sorting for the alarms column is special, sort by checking if the item has alarmnotices
			items.sort((itemA) => {
				return itemA.alarms ? order * (-1) : order;
			});
		}
		else {
			items.sort((itemA, itemB) => {
				if (itemA[sortSettings.column] > itemB[sortSettings.column]) {
					// If A is greater than B, return our predefined order
					return order;
				}
				if (itemA[sortSettings.column] < itemB[sortSettings.column]) {
					// If A is lesser than B, return the inverse of our order
					return order * (-1);
				}
				// If they are equal, return 0 so that they don't change places in the array
				return 0;
			});
		}

		return items;
	}

	function onDeviceAddSuccess() {
		setShowAddDeviceModal(false);
		setAddDeviceUID(null);
		setAddGatewayUID(null);
		devices.refetch();
	}

	function onDeviceAddCancel() {
		/*setAddDeviceUID(null);
		setAddGatewayUID(null);*/
		setShowAddDeviceModal(false);
	}

	function onTabChange(event, data) {
		if (data.activeIndex === 0) {
			setMyDevices(applySort(devices.data.results));
		}
		else {
			setMyDevices(applySort(gateways.data.results));
		}

		setSelectedDevices([]);
		setSortSettings({ column: 'name', direction: 'asc' });
		setActiveTab(data.activeIndex);
	}

	async function onRemoveClick() {

		for (let id of selectedDevices) {
			await removeDevice.mutateAsync(id);
		}

		setSelectedDevices([]);
		setSelectedDeviceView(null);
		if (activeTab === 0)
			devices.refetch();
		else
			gateways.refetch();
	}

	function onSelectAllClick() {
		let modified = [];
		if (selectedDevices.length != myDevices.length) {
			modified = myDevices.map((device) => device.id);
		}
		setSelectedDevices(modified);
	}

	function getSortState(column) {
		if (sortSettings.column === column) {
			return sortSettings.direction == 'asc' ? 'ascending' : 'descending';
		}
	}

	function onSortClick(column) {
		let sorting = { column, direction: 'asc' };

		// If same column, flip direction
		if (sortSettings.column == column) {
			sorting.direction = sortSettings.direction == 'asc' ? 'desc' : 'asc';
		}

		//Apply necessary properties and refresh the table
		setSortSettings(sorting);
		setMyDevices(applySort(myDevices));
	}

	function setDeviceView(deviceId) {
		if (deviceId === selectedDeviceView) {
			deviceId = null;
		}
		setSelectedDeviceView(deviceId);
	}

	function onToggleSelected(deviceId) {
		let current = selectedDevices.indexOf(deviceId);
		let modified = selectedDevices.slice();
		if (current != -1) {
			modified.splice(current, 1);
		}
		else {
			modified.push(deviceId);
		}
		setSelectedDevices(modified);
	}

	function renderAlarmPopup(device) {
		if (device.alarms && device.alarms.length > 0) {
			const alarms = device.alarms.map((alarm) => {
				const triggeredAlarms = alarm.triggeredSensorAlarms.map((triggeredAlarm) => {
					return (
						<p key={triggeredAlarm.id}>
							{getAlarmWarningDescription(triggeredAlarm, alarm.sensor)}
						</p>
					);
				});
				return (
					<List.Item key={alarm.sensor.id}>
						{triggeredAlarms}
					</List.Item>
				);
			});
			return <Popup position='top center' trigger={<b>{<Icon color='red' name='exclamation triangle' size='big' data-cy={'alarm' + device.name} />}</b>}>
				{
					<List>
						{alarms}
					</List>
				}
			</Popup>;
		}
	}

	function renderDevicesPane() {

		let deviceList = [];
		myDevices.map((device) => {
			const tableCellProps = {
				style: { cursor: 'pointer' },
				onClick: () => setDeviceView(device.id)
			};
			const isSelectedForView = device.id === selectedDeviceView;
			deviceList.push(
				<Table.Row key={device.id}>
					<Table.Cell collapsing>
						<Checkbox
							checked={selectedDevices.includes(device.id)}
							onClick={() => onToggleSelected(device.id)}
							data-cy={'deviceCheck' + device.uid}
						/>
					</Table.Cell>

					<Table.Cell {...tableCellProps}><b>{device.name}</b></Table.Cell>
					<Table.Cell {...tableCellProps}>{renderAlarmPopup(device)}</Table.Cell>
					<Table.Cell {...tableCellProps}>{device.uid}</Table.Cell>
					<Table.Cell {...tableCellProps}>
						<Popup
							trigger={device.updated ? <p>{moment(device.updated).toNow(true)} ago</p> : <p>Never</p>}
							content={device.updated ? moment(device.updated).format('MMMM Do YYYY, HH:mm:ss') : "No data"}
						/>
					</Table.Cell>
					{
						isOwnerOrAdmin &&
						<Table.Cell>
							<Popup
								position='top center'
								trigger={
									<Checkbox disabled={disableButtons} toggle checked={device.active} onChange={() => toggleActive.mutate(device)} />
								}
								content='Disabling a Device will filter it from Overview and Charts. It will also be disabled from triggering any Actions/Alarms.'
							/>
						</Table.Cell>
					}
					{
						isOwnerOrAdmin &&
						<Table.Cell collapsing>
							<Link to={'/devices/device' + '?project=' + currentProject.data.id + '&device=' + device.id}>
								<Button color='blue' size='small' content='Edit' />
							</Link>
						</Table.Cell>
					}
					<Table.Cell {...tableCellProps}><Icon style={{ width: '100%' }} size='large' name={isSelectedForView ? 'angle up' : 'angle down'} /></Table.Cell>
				</Table.Row>
			);
			if (isSelectedForView) {
				deviceList.push(
					<Table.Row key={device.id + 'view'} style={{ display: 'table-row' }}>
						<Table.Cell></Table.Cell>
						<Table.Cell colSpan={isOwnerOrAdmin ? 6 : 4}>
							<Segment>
								<Header as='h3' floated='left' content='Sensor Data' />
								{
									!isOwnerOrAdmin &&
									<Header
										as='h3'
										floated='right'
										content={
											<Link to={'/devices/device' + '?project=' + currentProject.data.id + '&device=' + device.id}>
												<Button content='More Info' color='blue' />
											</Link>
										}
									/>
								}
								<br />
								<br />
								<Divider />
								<SimpleFieldList
									device={device}
								/>
							</Segment>
							{
								device.parameters && device.parameters.length > 0 &&
								<SimpleParameterSegment
									device={device}
									refetchDevices={devices.refetch}
								/>
							}
						</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
				);
			}
		});


		if (deviceList.length === 0) {
			deviceList = <Table.Row>
				<Table.Cell colSpan={6}>{'You don\'t have any devices yet.'}</Table.Cell>
			</Table.Row>;
		}

		return (
			<Tab.Pane loading={loading}>
				<AddDeviceModal
					open={showAddDeviceModal}
					defaultUID={addDeviceUID}
					onCancel={onDeviceAddCancel}
					onSuccess={onDeviceAddSuccess}
					isGateway={activeTab === 1}
					projectId={projectId}
				/>
				{/*
			<MultipleExportModal
				open={showExportModal}
				onCancel={onCloseExportModal}
				devices={selected}
	/>*/}
				<Button
					disabled={disableButtons}
					color='green'
					icon='plus'
					content='Add'
					labelPosition='left'
					onClick={() => setShowAddDeviceModal(true)}
					data-cy='addDevice'
				/>
				<Button
					color='twitter'
					content='Move'
					disabled={selectedDevices.length == 0 || disableButtons}
					onClick={() => setShowMoveDeviceModal(true)}
					data-cy='moveDevice'
				/>
				<Button
					color='blue'
					content='Export'
					disabled={selectedDevices.length == 0}
					onClick={() => setShowExportModal(true)}
				/>
				{
					isOwnerOrAdmin &&
					<SafeButton
						color='teal'
						content='Sync'
						warningContent='Sync Keys to Lora Server'
						disabled={selectedDevices.length == 0}
						onClick={syncKeysToLoraServer.mutate}
						loading={syncKeysToLoraServer.isLoading}
					/>
				}
				{/*<MoveDeviceModal
				open={showMoveDeviceModal}
				onMove={onMoveDevice}
				onClose={onCloseMoveDeviceModal}
		/>*/}
				<SafeButton
					onClick={onRemoveClick}
					content='Remove'
					disabled={selectedDevices.length === 0 || disableButtons}
					floated='right'
					loading={removeDevice.isLoading}
				/>
				<Table striped sortable>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								<Checkbox disabled={myDevices.length == 0}
									checked={selectedDevices.length > 0 && myDevices.length == selectedDevices.length}
									onClick={onSelectAllClick} />
							</Table.HeaderCell>
							<Table.HeaderCell
								onClick={() => onSortClick('name')}
								sorted={getSortState('name')}
								content='Name'
							/>
							<Table.HeaderCell
								onClick={() => onSortClick('alarms')}
								sorted={getSortState('alarms')}
								content='Alarms'
							/>
							<Table.HeaderCell
								onClick={() => onSortClick('uid')}
								sorted={getSortState('uid')}
								content='UID'
							/>
							<Table.HeaderCell
								onClick={() => onSortClick('updated')}
								sorted={getSortState('updated')}
								content='Last Seen'
							/>
							{
								isOwnerOrAdmin &&
								<Popup
									position='top center'
									trigger={
										<Table.HeaderCell>
											Enabled
										</Table.HeaderCell>
									}
									content='Disabling a Device will filter it from Overview and Charts. It will also be disabled from triggering any Actions/Alarms.'
								/>
							}
							{
								isOwnerOrAdmin &&
								<Table.HeaderCell>Settings</Table.HeaderCell>
							}
							<Table.HeaderCell>View</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{deviceList}
					</Table.Body>
				</Table>
			</Tab.Pane>
		);

	}

	function renderGatewaysPane() {

		let gateways = myDevices.map((gateway) => {
			return (
				<Table.Row key={gateway.id}>
					<Table.Cell collapsing>
						<Checkbox
							checked={selectedDevices.includes(gateway.id)}
							onClick={() => onToggleSelected(gateway.id)}
						/>
					</Table.Cell>
					<Table.Cell>
						<b>{gateway.name}</b>
					</Table.Cell>
					<Table.Cell>
						{gateway.uid}
					</Table.Cell>
					<Table.Cell>
						{<Popup trigger={<p>{moment(gateway.updated).toNow(true)} ago</p>} content={moment(gateway.updated).format('MMMM Do YYYY, HH:mm:ss')} />}
					</Table.Cell>
					{gateway.devices &&
						<Table.Cell>{gateway.devices.length}</Table.Cell>
					}
					<Table.Cell collapsing>
						<Link to={'/devices/gateway' + '?project=' + currentProject.data.id + '&device=' + gateway.id}>
							<Button color='blue' size='small' content='Edit' />
						</Link>
					</Table.Cell>
				</Table.Row>
			);
		});

		if (gateways.length === 0) {
			gateways = <Table.Row>
				<Table.Cell colSpan={6}>{'You don\'t have any gateways yet.'}</Table.Cell>
			</Table.Row>;
		}

		return (
			<Tab.Pane loading={loading}>
				<AddDeviceModal
					open={showAddDeviceModal}
					defaultUID={addGatewayUID}
					onCancel={onDeviceAddCancel}
					onSuccess={onDeviceAddSuccess}
					isGateway={activeTab === 1}
					projectId={projectId}
				/>
				<Button
					disabled={disableButtons}
					color='green'
					icon='plus'
					content='Add'
					labelPosition='left'
					onClick={() => setShowAddDeviceModal(true)}
				/>
				<SafeButton
					onClick={onRemoveClick}
					content='Remove'
					disabled={selectedDevices.length === 0 || disableButtons}
					floated='right'
				/>
				<Table sortable>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								<Checkbox
									disabled={myDevices.length == 0}
									checked={selectedDevices.length > 0 && myDevices.length == selectedDevices.length}
									onClick={onSelectAllClick}
								/>
							</Table.HeaderCell>
							<Table.HeaderCell
								content='Name'
								onClick={() => onSortClick('name')}
								sorted={getSortState('name')}
							/>
							<Table.HeaderCell
								content='UID'
								onClick={() => onSortClick('uid')}
								sorted={getSortState('uid')}
							/>
							<Table.HeaderCell
								content='Last Seen'
								onClick={() => onSortClick('updated')}
								sorted={getSortState('updated')}
							/>
							<Table.HeaderCell content='Devices' />
							<Table.HeaderCell content='Settings' />
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{gateways}
					</Table.Body>
				</Table>
			</Tab.Pane>
		);

	}

	const panes = [
		{
			menuItem: <Menu.Item key='devices'>Devices<Label circular>{devices.isSuccess && devices.data.results.length}</Label></Menu.Item>,
			render: renderDevicesPane
		},
		{
			menuItem: <Menu.Item key='gateways'>Gateways<Label circular>{gateways.isSuccess && gateways.data.results.length}</Label></Menu.Item>,
			render: renderGatewaysPane
		}
	];

	const page = <Tab menu={{ secondary: true, pointing: true }} panes={panes} onTabChange={onTabChange} />;

	return (<PageBase title={'Devices'} page={page} loading={loading} />);

}