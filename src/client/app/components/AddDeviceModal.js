import React, { useState, useEffect } from 'react';
import { setInnerState } from 'services/ReactUtilities';
import { Modal, Button, Form, Message, Step, Segment, Icon, Checkbox, Popup } from 'semantic-ui-react';
import { api } from 'services/ApiService';
import { GeoLocationOptions, classTypes, joinTypes } from 'services/UtilityService';
import clone from 'lodash.clone';
import { deviceTypesHook } from '../hooks/ApiQueryHooks';

let state = {
	newDevice: {
		name: '',
		uid: '',
		joinType: null,
		type: null,
		devAddr: null,
		nwkSKey: null,
		appSKey: null,
		appKey: null,
		appEUI: null
	},
	location: {
		longitude: 0,
		latitude: 0,
		altitude: 0,
		locked: false
	},
	form: {
		loading: false,
		errorMessage: '',
		step: 0
	}
};


export default function AddDeviceModal(props) {

	const [newDevice, setNewDevice] = useState(state.newDevice);
	const [form, setForm] = useState(state.form);
	const [location, setLocation] = useState(state.location);

	useEffect(() => {
		let aNewDevice = clone(newDevice);
		aNewDevice.uid = props.defaultUID;
		setNewDevice(aNewDevice);
	}, [props.defaultUID]);

	const deviceTypes = deviceTypesHook({
		onSuccess: (data) => {
			let types = data.devices.map((item, index) => {
				return { key: index, value: item.type, text: item.description, description: item.type };
			});

			setDeviceTypeList(types);
		}
	});

	const [deviceTypeList, setDeviceTypeList] = useState([]);

	const onFieldChange = (field, event, data) => {
		let aNewDevice = clone(newDevice);
		if (field === 'uid') {
			aNewDevice[field] = event.target.value.replace(/[\s\uFEFF\xA0]+/g, '');
		}
		else {
			let newValue = event.target.value;
			if (!newValue) {
				newValue = data ? data.value : newValue;
			}
			aNewDevice[field] = newValue;
		}

		setNewDevice(aNewDevice);
	};

	const onLocationChange = (field, event, data) => {
		let aLocation = clone(location);
		if (typeof data.checked === 'boolean') {
			aLocation[field] = data.checked;
		}
		else aLocation[field] = Number(data.value);
		setLocation(aLocation);
	};

	const onAddDeviceClick = async () => {

		setInnerState(form, setForm, {
			loading: true,
			errorMessage: ''
		});

		let result = await api.post('organizations/' + props.projectId + (props.isGateway ? '/gateways' : '/devices'), newDevice);

		switch (result.status) {
			case 200:
				await api.put((props.isGateway ? 'gateways/' : 'devices/') + result.data.id, { location });
				setNewDevice({ name: '', uid: '' });
				setForm({
					loading: false,
					step: 0,
					errorMessage: ''
				});
				props.onSuccess();
				break;
			case 400:
				setInnerState(form, setForm, {
					loading: false,
					errorMessage: 'Invalid parameters'
				});
				break;
			case 403:
				setInnerState(form, setForm, {
					loading: false,
					errorMessage: result.data.details
				});
				break;
			case 404:
				setInnerState(form, setForm, {
					loading: false,
					errorMessage: 'Device does not exist'
				});
				break;
			case 409:
				if (result.data.message == 'ALREADY_ADDED_BY_YOU') {
					setInnerState(form, setForm, {
						loading: false,
						errorMessage: 'Device already added to your account'
					});
				}
				else {
					setInnerState(form, setForm, {
						loading: false,
						errorMessage: 'Device already added by someone else'
					});
				}
				break;
			case 500:
				setInnerState(form, setForm, {
					loading: false,
					errorMessage: 'Internal Server Error'
				});
				break;
			default:
				setInnerState(form, setForm, {
					loading: false,
					errorMessage: 'Unknown Error'
				});
		}
	};

	const onNextClick = async () => {
		if (form.step === 0) {
			setInnerState(form, setForm, {
				loading: true
			});

			let result;
			if (props.isGateway) {
				result = await api.get('gateways/check/' + newDevice.uid);
			}
			else {
				result = await api.get('devices/check/' + newDevice.uid);
			}

			switch (result.status) {
				case 200:
					if (result.data.owner) {
						setInnerState(form, setForm, {
							loading: false,
							errorMessage: 'Device already claimed'
						});
					}
					else if (newDevice.joinType) {
						setInnerState(form, setForm, {
							loading: false,
							errorMessage: 'Device already exists'
						});
					}
					else {
						setInnerState(form, setForm, {
							loading: false,
							errorMessage: '',
							step: 1
						});
						setLocation(result.data.location);
					}
					break;
				case 404:
					if (!newDevice.joinType && !props.isGateway) {
						setInnerState(form, setForm, {
							loading: false,
							errorMessage: 'Device does not exist'
						});
					}
					else {
						setInnerState(form, setForm, {
							loading: false,
							step: 1
						});
					}
					break;
				default:
					setInnerState(form, setForm, {
						loading: false,
						errorMessage: 'Unknown Error'
					});
			}
		}
		else {
			setInnerState(form, setForm, {
				step: form.step + 1
			});
		}
	};

	const onBackClick = () => {
		setInnerState(form, setForm, {
			step: form.step - 1
		});
	};

	const changeOptions = () => {
		let aNewDevice = clone(newDevice);
		if (aNewDevice.joinType) {
			aNewDevice = { name: '', uid: '' };
		}
		else {
			aNewDevice.joinType = 'OTAA';
			aNewDevice.class = 'A';
			aNewDevice.type = '';
			aNewDevice.devAddr = '';
			aNewDevice.nwkSKey = '';
			aNewDevice.appSKey = '';
			aNewDevice.appKey = '';
			aNewDevice.appEUI = '';
		}
		setNewDevice(aNewDevice);
	};

	const goToStep = (step) => {
		setInnerState(form, setForm, {
			step
		});
	};


	const canContinue = () => {
		if (form.step === 0 && !newDevice.joinType && !props.isGateway) {
			return (newDevice.name && newDevice.uid);
		}
		else if (form.step === 0 && newDevice.joinType) {
			let validUID = /^[0-9A-Fa-f]{16}$/.test(newDevice.uid);
			let validDeviceType = !(!newDevice.type);
			if (newDevice.joinType === 'OTAA') {
				let validAppKey = /^[0-9A-Fa-f]{32}$/.test(newDevice.appKey);
				let validAppEUI = /^[0-9A-Fa-f]{16}$/.test(newDevice.appEUI);
				return validUID && validDeviceType && validAppKey && validAppEUI;
			}
			else {
				let validDevAddr = /^[0-9A-Fa-f]{8}$/.test(newDevice.devAddr);
				let validnwkSKey = /^[0-9A-Fa-f]{32}$/.test(newDevice.nwkSKey);
				let validAppSKey = /^[0-9A-Fa-f]{32}$/.test(newDevice.appSKey);
				return validUID && validDeviceType && validDevAddr && validnwkSKey && validAppSKey;
			}
		}
		else if (form.step === 0 && props.isGateway) {
			let validUID = /^[0-9A-Fa-f]{16}$/.test(newDevice.uid);
			return validUID;
		}

		return true;
	};

	const clearLocation = () => {
		setLocation({
			latitude: 0,
			longitude: 0,
			altitude: 0,
			locked: location.locked
		});
	};

	const retrieveLocation = () => {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLocation({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						altitude: position.coords.altitude || location.altitude,
						locked: location.locked
					});
				},
				(err) => {
					console.log(err);
				},
				GeoLocationOptions
			);
		}
	};

	const renderMainSegment = () => {

		let validUID = /^[0-9A-Fa-f]{16}$/.test(newDevice.uid);
		let invalidUID = ((newDevice.joinType || props.isGateway) && newDevice.uid !== '' && !validUID);

		if (form.step === 0) {
			return (
				<Segment attached>
					<Form error={form.errorMessage !== ''}>
						<Form.Input
							label='Name'
							placeholder='Name'
							value={newDevice.name}
							onChange={(e) => onFieldChange('name', e)}
							data-cy='name'
						/>
						<Form.Input
							label={props.isGateway ? 'Gateway ID' : 'Device ID'}
							placeholder={props.isGateway ? 'EUI, MAC, e.t.c' : 'EUI, IMEI, e.t.c.'}
							value={newDevice.uid}
							error={invalidUID}
							onChange={(e) => onFieldChange('uid', e)}
							data-cy='deviceId'
						/>
						{
							newDevice.joinType &&
							<div>
								<Form.Dropdown
									label='Join Type'
									fluid
									selection
									options={joinTypes}
									value={newDevice.joinType}
									onChange={(e, data) => onFieldChange('joinType', e, data)}
								/>
								<Form.Dropdown
									label='Class'
									fluid
									selection
									options={classTypes}
									value={newDevice.class}
									onChange={(e, data) => onFieldChange('class', e, data)}
								/>
								<Form.Dropdown
									label='Device Type'
									fluid
									search
									selection
									placeholder='No Device Type Selected'
									options={deviceTypeList}
									value={newDevice.type}
									onChange={(e, data) => onFieldChange('type', e, data)}
								/>
								{
									newDevice.joinType === 'ABP' ?
										<div>
											<Form.Input
												label='Device Adress'
												placeholder='devAddr'
												value={newDevice.devAddr}
												error={newDevice.devAddr !== '' && !/^[0-9A-Fa-f]{8}$/.test(newDevice.devAddr)}
												onChange={(e) => onFieldChange('devAddr', e)}
												data-cy='devAddr'
											/>
											<Form.Input
												label='Network Session Key'
												placeholder='nwkSKey'
												value={newDevice.nwkSKey}
												error={newDevice.nwkSKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(newDevice.nwkSKey)}
												onChange={(e) => onFieldChange('nwkSkey', e)}
												data-cy='nwkSKey'
											/>
											<Form.Input
												label='Application Session Key'
												placeholder='appSKey'
												value={newDevice.appSKey}
												error={newDevice.appSKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(newDevice.appSKey)}
												onChange={(e) => onFieldChange('appSKey', e)}
												data-cy='appSKey'
											/>
										</div>
										:
										<div>
											<Form.Input
												label='Application Key'
												placeholder='appKey'
												value={newDevice.appKey}
												error={newDevice.appKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(newDevice.appKey)}
												onChange={(e) => onFieldChange('appKey', e)}
												data-cy='appKey'
											/>
											<Form.Input
												label='Application EUI/Join EUI'
												placeholder='appEUI'
												value={newDevice.appEUI}
												error={newDevice.appEUI !== '' && !/^[0-9A-Fa-f]{16}$/.test(newDevice.appEUI)}
												onChange={(e) => onFieldChange('appEUI', e)}
												data-cy='appEUI'
											/>
										</div>
								}
								<br />
							</div>
						}
						{
							!props.isGateway &&
							<Popup
								trigger={
									<Button
										style={{ marginLeft: 'auto', display: 'inherit' }}
										content={newDevice.joinType ? 'Cancel' : 'Create Non-Registered'}
										onClick={changeOptions}
									/>
								}
								content={
									newDevice.joinType ?
										'Cancel creation of non-registered device'
										:
										'If the device is not registered with us (our LoraServer), add it with the necessary keys'
								}
							/>
						}
						<Message
							error
							header='Problem'
							content={form.errorMessage}
							onDismiss={() => setInnerState(form, setForm, { errorMessage: '' })}
						/>
					</Form>
				</Segment>
			);
		}
		else if (form.step === 1) {
			return (
				<Segment attached loading={form.loading}>
					<Form error={form.errorMessage !== ''}>
						<Form.Input
							label='Latitude'
							placeholder='Latitude'
							type='number' min={-90} max={90} step='any'
							value={location.latitude}
							onChange={(e, d) => onLocationChange('latitude', e, d)}
							data-cy='latitude'
						/>
						<Form.Input
							label='Longitude'
							placeholder='Longitude'
							type='number' min={-180} max={180} step='any'
							value={location.longitude}
							onChange={(e, d) => onLocationChange('longitude', e, d)}
							data-cy='longitude'
						/>
						<Form.Input
							label='Altitude'
							placeholder='Altitude'
							type='number' min={-1000} max={10000} step='any'
							value={location.altitude}
							onChange={(e, d) => onLocationChange('altitude', e, d)}
							data-cy='altitude'
						/>
						<Checkbox
							label='Lock location'
							checked={location.locked}
							onChange={(e, d) => onLocationChange('locked', e, d)}
						/>
						<br />
						<Message size='small' compact>By locking the location you can prevent the location from being overwritten by devices with integrated GPS.</Message>
						<br />
						<Button basic circular content="Retrieve Location" icon="map pin" onClick={retrieveLocation} data-cy='retrieveLocation' />
						<Button basic circular content="Clear Location" icon="remove" onClick={clearLocation} />
						<Message
							error
							header='Problem'
							content={form.errorMessage}
							onDismiss={() => setInnerState(form, setForm, { errorMessage: '' })}
						/>
					</Form>
				</Segment>
			);
		}
	};

	let title = props.isGateway ? 'Gateway' : 'Device';
	return (
		<Modal open={props.open} closeIcon onClose={props.onCancel} centered={true}>
			<Modal.Header>Add {title}</Modal.Header>
			<Modal.Content>
				<Step.Group attached='top'>
					<Step link onClick={() => goToStep(0)} active={form.step === 0}>
						<Icon name='info' />
						<Step.Content>
							<Step.Title>{title}</Step.Title>
							<Step.Description>Enter Name and {title} credentials</Step.Description>
						</Step.Content>
					</Step>
					<Step link onClick={() => goToStep(1)} active={form.step === 1} disabled={form.step < 1}>
						<Icon name='map pin' />
						<Step.Content>
							<Step.Title>Location</Step.Title>
							<Step.Description>Enter location information</Step.Description>
						</Step.Content>
					</Step>
				</Step.Group>
				{renderMainSegment()}
			</Modal.Content>
			<Modal.Actions>
				<Button float='right' content="Cancel" onClick={props.onCancel} />
				<Button float='right' icon='arrow left' labelPosition='left' content="Back" disabled={form.step === 0} onClick={onBackClick} data-cy='back' />
				{form.step === 1 ?
					<Button positive float='right' content="Add" onClick={onAddDeviceClick} data-cy='submit' /> :
					<Button positive float='right' icon='arrow right' labelPosition='right' content="Next" disabled={!canContinue()} onClick={onNextClick} data-cy='next' />
				}
			</Modal.Actions>
		</Modal>
	);
}