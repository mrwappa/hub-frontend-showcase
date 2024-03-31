import React, { useEffect, useState } from 'react';
import { Table, Button, Popup, Checkbox, Segment, Header, Message, Label, Grid } from 'semantic-ui-react';
import { displaySensor } from '../services/UtilityService';
import WidgetCodeModal from './WidgetCodeModal';
import EditFieldNameModal from './EditFieldNameModal';
import moment from 'moment';
import { api } from '../services/ApiService';
import { useForceUpdate } from '../hooks/UtilityHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import isEmpty from 'lodash.isempty';

export default function SensorList({
	device,
	isOwnerOrAdmin,
	projectId,
	refetchDevices = () => { }
}) {

	const forceUpdate = useForceUpdate();

	useEffect(() => {
		const interval = setInterval(forceUpdate, 15000);
		return () => clearInterval(interval);
	}, []);

	const [selectedSensors, setSelectedSensors] = useState([]);
	const [widgetCodeModal, setWidgetCodeModal] = useState({
		open: false,
		uid: '',
		sensor: ''
	});
	const [editingField, setEditingField] = useState(null);

	const editSimpleSensorList = baseMutationHook({
		apiReq: async (action) => {
			return await api.put('organizations/' + projectId + '/devices/' + device.id, { simpleSensors: selectedSensors, listAction: action });
		},
		onSuccess: () => {
			refetchDevices();
			setSelectedSensors([]);
		}
	});

	const removeSensors = baseMutationHook({
		apiReq: async () => {
			return await api.post('devices/' + device.id + '/remove-sensors', { sensors: selectedSensors });
		},
		onSuccess: () => {
			refetchDevices();
			setSelectedSensors([]);
		}
	});

	const setPrimarySensor = baseMutationHook({
		apiReq: async () => {
			return await api.put('devices/' + device.id, { primarySensor: selectedSensors[0] });
		},
		onSuccess: () => {
			refetchDevices();
			setSelectedSensors([]);
		}
	});

	const saveFieldName = baseMutationHook({
		apiReq: async (name) => {
			return await api.put(`devices/${device.id}/fields/${editingField.id}`, { name });
		},
		onSuccess: () => {
			refetchDevices();
			setEditingField(null);
		}
	});

	function onToggleSelected(sensorId) {
		let current = selectedSensors.indexOf(sensorId);
		let modified = selectedSensors.slice();
		if (current != -1) {
			modified.splice(current, 1);
		}
		else {
			modified.push(sensorId);
		}

		setSelectedSensors(modified);
	}

	function openWidgetCodeModal(uid, sensor) {
		setWidgetCodeModal({
			open: true,
			uid,
			sensor
		});
	}

	function closeWidgetCodeModal() {
		setWidgetCodeModal(
			{ open: false, uid: '', sensor: '' }
		);
	}

	function onSelectAllClick() {
		let modified = [];
		if (selectedSensors.length != device.data.length) {
			modified = device.data.map((device) => device.id);
		}
		setSelectedSensors(modified);
	}

	const firstDisableCheck = device.data.length === 0 || selectedSensors.length === 0;
	let disableAddSimpleSensor = firstDisableCheck;
	let disableRemoveSimpleSensor = firstDisableCheck;
	const fieldRows = device.data.map((field) => {
		let isSimple = device.simpleSensors ?
			device.simpleSensors.includes(field.id)
			:
			false;
		let checked = selectedSensors.includes(field.id);

		let tags = [];
		if (device.primarySensor == field.id) {
			tags.push(
				<Popup
					key={tags.length}
					content="This sensor's value will be shown on the Overview Map"
					trigger={<Label color='green' size='large' content='P' />}
				/>
			);
		}
		if (isSimple) {
			tags.push(
				<Popup
					key={tags.length}
					content='This Sensor will be shown on Device List page'
					trigger={<Label key={tags.length} size='large' content='S' />}
				/>
			);
			disableAddSimpleSensor = disableAddSimpleSensor === false ? checked : disableAddSimpleSensor;
			if (checked) {
				disableRemoveSimpleSensor = disableRemoveSimpleSensor === false ? false : disableRemoveSimpleSensor;
			}
		}
		else {
			disableRemoveSimpleSensor = disableRemoveSimpleSensor === false ? checked : disableRemoveSimpleSensor;
		}

		return (
			<Table.Row key={field.identifier + '-row'}>
				<Table.Cell collapsing>
					<Checkbox checked={checked} onClick={() => onToggleSelected(field.id)} />
				</Table.Cell>
				<Table.Cell collapsing>
					<Button icon='pencil' onClick={() => setEditingField(field)} />
				</Table.Cell>
				<Table.Cell><Popup trigger={<p>{field.name}</p>} content={field.identifier} /></Table.Cell>
				<Table.Cell collapsing>
					{tags}
				</Table.Cell>
				<Table.Cell><Popup trigger={<p>{moment(field.updated).toNow(true)} ago</p>} content={moment(new Date()).format('MMMM Do YYYY, HH:mm:ss')} /></Table.Cell>
				<Table.Cell collapsing>{displaySensor(field)}</Table.Cell>
				<Table.Cell collapsing>
					<Button
						icon='share alternate'
						label='Widget'
						onClick={() => openWidgetCodeModal(device.uid, field.identifier)}
					/>
				</Table.Cell>
			</Table.Row>
		);
	});

	if (disableAddSimpleSensor && disableRemoveSimpleSensor && selectedSensors.length > 0) {
		disableAddSimpleSensor = false;
		disableRemoveSimpleSensor = false;
	}

	let mainRender = (
		<>
			<Header as='h3' floated='right'>
				<Header.Content>
					{
						isOwnerOrAdmin &&
						<Grid>
							<Grid.Row>
								<Button.Group style={{ paddingRight: '20px' }}>
									<Popup
										content='Simple Sensors will be shown on the Device List page'
										trigger={<Label content={<h5>Simple Sensors</h5>} size='large' />}
									/>
									<Button.Or text='' />
									<Button
										disabled={disableAddSimpleSensor}
										loading={editSimpleSensorList.isLoading}
										onClick={() => editSimpleSensorList.mutate('add')}
										color='green'
										content='Add'
									/>
									<Button
										disabled={disableRemoveSimpleSensor}
										loading={editSimpleSensorList.isLoading}
										onClick={() => editSimpleSensorList.mutate('remove')}
										color='red'
										content='Remove'
									/>
								</Button.Group>
								<Button
									color='red'
									loading={removeSensors.isLoading}
									onClick={removeSensors.mutate}
									disabled={selectedSensors.length === 0}
									content='Remove'
								/>
								<Popup
									position='top center'
									trigger={
										<Button
											color='green'
											loading={setPrimarySensor.isLoading}
											onClick={setPrimarySensor.mutate}
											disabled={selectedSensors.length !== 1 || selectedSensors[0] === device.primarySensor}
											content='Set as Pimary Sensor'
										/>
									}
									content={"The Primary Sensor's value will be shown on the Overview Map"}
								/>
							</Grid.Row>
						</Grid>
					}
				</Header.Content>
			</Header>
			<WidgetCodeModal
				open={widgetCodeModal.open}
				uid={widgetCodeModal.uid}
				sensor={widgetCodeModal.sensor}
				onClose={closeWidgetCodeModal}
			/>
			<EditFieldNameModal
				open={!isEmpty(editingField) && editingField.name}
				name={editingField && editingField.name}
				identifier={editingField && editingField.identifier}
				onClose={() => setEditingField(null)}
				onSave={saveFieldName.mutate}
			/>
			<Table stackable>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell>
							<Checkbox
								checked={selectedSensors.length > 0 && selectedSensors.length == device.data.length}
								onClick={onSelectAllClick} />
						</Table.HeaderCell>
						<Table.HeaderCell>
							Edit
						</Table.HeaderCell>
						<Table.HeaderCell>
							Name
						</Table.HeaderCell>
						<Table.HeaderCell>
							Tags
						</Table.HeaderCell>
						<Table.HeaderCell>
							Last Seen
						</Table.HeaderCell>
						<Table.HeaderCell>
							Value
						</Table.HeaderCell>
						<Table.HeaderCell>
							Widget
						</Table.HeaderCell>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{fieldRows}
				</Table.Body>
			</Table>
		</>
	);

	if (device.data.length == 0) {
		mainRender =
			(
				<>
					<br />
					<Message content="No sensors found for this device" error />
				</>
			);
	}

	return (
		<Segment>
			<Header as='h3' floated='left'>
				<Header.Content>
					Sensor Data
				</Header.Content>
			</Header>
			{mainRender}
		</Segment>
	);

}