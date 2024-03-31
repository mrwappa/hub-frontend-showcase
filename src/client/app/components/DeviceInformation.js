import React, { useState, useEffect } from 'react';
import { setInnerState } from '../services/ReactUtilities';
import { Segment, Table, Header, Button, Dimmer, Popup, Form, TextArea } from 'semantic-ui-react';
import moment from 'moment';
import EditFieldNameModal from '../components/EditFieldNameModal';
import { getTimeDescription, joinTypes, classTypes, constructComment } from '../services/UtilityService';
import UploadMediaButton from '../components/UploadMediaButton';
import { api } from '../services/ApiService';
import clone from 'lodash.clone';
import { deviceKeysHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { toastSuccess } from '../services/Toaster';


let defaultState = {
	form: {
		connectedGateway: {},
		showAdvanced: false,
		editingNotes: false,
		uploadLoading: false,
		editNameOpen: false
	},
	note: {
		current: '',
		original: ''
	},
	name: {
		current: '',
		original: ''
	},
	keys: {
		current: null,
		original: null
	}
};

export default function DeviceInformation({
	device,
	isGateway,
	projectId,
	projectDisabled,
	isOwnerOrAdmin,
	refetchDevices
}) {
	const [form, setForm] = useState(defaultState.form);
	const [note, setNote] = useState(defaultState.note);
	const [keys, setKeys] = useState(defaultState.keys);

	const deviceInfoEnabled = !isGateway && form.showAdvanced;

	const deviceKeys = deviceKeysHook(deviceInfoEnabled ? device.id : null, {
		onSuccess: (data) => {
			if (!data.headers)
				setKeys({
					current: data,
					original: clone(data)
				});

			if (!data.joinType) {
				setKeys(defaultState.keys);
			}
		}
	});

	useEffect(() => {
		let aNote = device.note || '';
		setNote({
			current: aNote,
			original: aNote
		});

	}, [device.note]);

	const saveKeys = baseMutationHook({
		apiReq: async () => await api.put('devices/' + device.id, { keys: keys.current }),
		onSuccess: () => {
			deviceKeys.refetch();
			toastSuccess('Keys Saved');
		}
	});

	const saveName = baseMutationHook({
		apiReq: async (newName) => await api.put('organizations/' + projectId + '/devices/' + device.id, { name: newName }),
		onSuccess: () => {
			setInnerState(form, setForm, { editNameOpen: false });
			refetchDevices();
		}
	});

	const saveNote = baseMutationHook({
		apiReq: async () => await api.put('devices/' + device.id, { note: note.current }),
		onSuccess: () => {
			setInnerState(form, setForm, {
				editingNotes: false
			});
			//TODO: add refetch here?
		}
	});

	function canSaveKeys() {
		let aKeys = keys.current;
		if (aKeys) {
			if (aKeys.joinType === 'OTAA') {
				let validAppKey = /^[0-9A-Fa-f]{32}$/.test(aKeys.appKey);
				let validAppEUI = /^[0-9A-Fa-f]{16}$/.test(aKeys.appEUI);
				return validAppKey && validAppEUI;
			}
			else {
				let validDevAddr = /^[0-9A-Fa-f]{8}$/.test(aKeys.devAddr);
				let validNwsKey = /^[0-9A-Fa-f]{32}$/.test(aKeys.nwkSKey);
				let validAppSKey = /^[0-9A-Fa-f]{32}$/.test(aKeys.appSKey);
				return validDevAddr && validNwsKey && validAppSKey;
			}
		}
	}

	function onOpenEditNameNodal() {
		setInnerState(form, setForm, {
			editNameOpen: true
		});
	}

	function onCloseEditNameModal() {
		setInnerState(form, setForm, {
			editNameOpen: false
		});
	}

	function joinTypeChanged(e, { value }) {
		let aKeys = clone(keys.current);
		aKeys.joinType = value;
		if (value === 'OTAA' && !aKeys.appKey) {
			aKeys.appKey = '';
			aKeys.appEUI = '';
		}
		else if (value === 'ABP' && !aKeys.devAddr) {
			aKeys.devAddr = '';
			aKeys.appSKey = '';
			aKeys.nwkSKey = '';
		}
		setInnerState(keys, setKeys, {
			current: aKeys
		});
	}

	function keyChanged(type, e, { value }) {
		let aKeys = clone(keys.current);
		aKeys[type] = value;
		setInnerState(keys, setKeys, {
			current: aKeys
		});
	}

	function addKeys() {
		let aKeys = { joinType: 'OTAA', appKey: '', appEUI: '', class: 'A' };
		setKeys({
			current: aKeys,
			original: clone(aKeys)
		});

		setInnerState(form, setForm, {
			showAdvanced: true
		});
	}

	function onCancelKeys() {
		let aKeys = clone(keys.original);
		setInnerState(keys, setKeys, {
			current: aKeys
		});
	}

	function cancelNote() {
		setInnerState(form, setForm, {
			editingNotes: false
		});

		let aNote = clone(note.current);
		setNote({
			current: aNote,
			original: aNote
		});
	}

	function noteChanged(e, { value }) {
		setInnerState(note, setNote, {
			current: value
		});
	}

	function applyMediaUrl(url) {
		let aNote = note.current + (note.current.length !== 0 ? '\n' : '') + url;
		setInnerState(note, setNote, {
			current: aNote
		});
	}

	function setLoading(uploadLoading) {//TODO: Test Upload Media Button
		setInnerState(form, setForm, {
			uploadLoading
		});
	}

	let editNameButton = isOwnerOrAdmin ? <Button icon='pencil' onClick={onOpenEditNameNodal} /> : null;
	let messageInterval = device.previousUpdated ? moment(device.updated).diff(moment(device.previousUpdated)) : null;
	let messageIntervalText = getTimeDescription(messageInterval);

	let keysReadOnly = device.source && !device.source.match(/sensefarm-lora|lora/);

	let disableSaveKeys = !canSaveKeys();

	let noteContent = constructComment(note.current);

	return (
		<Segment>
			<Header as='h3' floated='left'>
				<Header.Content>
					Device information
				</Header.Content>
			</Header>
			<Table unstackable>
				<Table.Body>
					<Table.Row>
						<Table.Cell>Added</Table.Cell>
						<Table.Cell>{moment(device.added).format('MMMM Do YYYY, HH:mm:ss')}</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
					{device.name ? <Table.Row>
						<Table.Cell>Name</Table.Cell>
						<Table.Cell >{device.name}</Table.Cell>
						<Table.Cell collapsing>
							{editNameButton}
							<EditFieldNameModal
								open={form.editNameOpen}
								name={device.name}
								onClose={onCloseEditNameModal}
								onSave={saveName.mutate}
							/>
						</Table.Cell>
					</Table.Row> : null}
					<Table.Row>
						<Table.Cell>Type</Table.Cell>
						<Table.Cell>{device.type}</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>ID</Table.Cell>
						<Table.Cell>{device.uid}</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
					{
						device.connectedGateway &&
						<Table.Row>
							<Table.Cell>Connected Gateway</Table.Cell>
							<Table.Cell>{device.connectedGateway}</Table.Cell>
							<Table.Cell collapsing>
							</Table.Cell>
						</Table.Row>
					}
					<Table.Row>
						<Table.Cell>Source</Table.Cell>
						<Table.Cell>{device.source}</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Latest report</Table.Cell>
						<Table.Cell>
							<Popup
								trigger={
									device.updated ?
										<p>
											{moment(device.updated).format('MMMM Do YYYY, HH:mm:ss')}
										</p>
										:
										<p>No info</p>
								}
								content={
									device.updated ?
										<p>
											{moment(device.updated).toNow(true)} ago
										</p>
										:
										<p>No Info</p>
								}
							/>
						</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Latest Message Interval</Table.Cell>
						<Table.Cell>
							{
								messageInterval ?
									<Popup trigger={<p>{messageIntervalText}</p>} content={moment(device.previousUpdated).format('MMMM Do YYYY, HH:mm:ss')} />
									:
									"No Info"
							}
						</Table.Cell>
						<Table.Cell></Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table>

			{
				(note.current.length > 0 && !isOwnerOrAdmin) || isOwnerOrAdmin &&
				<Segment>
					<Header as='h3' content='Notes' floated='left' />
					{
						isOwnerOrAdmin && !form.editingNotes &&
						<Button floated='right' color='green' content='Edit' onClick={() => setInnerState(form, setForm, { editingNotes: true })} />
					}
					{
						form.editingNotes &&
						<Form>
							<Button
								floated='right'
								style={{ marginBottom: '1em' }}
								content='Save' color='green'
								onClick={saveNote.mutate}
							/>
							<UploadMediaButton
								onUploadSuccess={applyMediaUrl}
								setLoading={setLoading}
								floated='right'
							/>
							<Button
								floated='right'
								content='Cancel'
								onClick={cancelNote}
								style={{ marginRight: '1em' }}
							/>
							<TextArea
								style={{ minHeight: 100 }}
								value={note.current}
								onChange={noteChanged}
								placeholder='Write notes about device here'
							/>
						</Form>
					}
					{
						!form.editingNotes &&
						<div>
							<br />
							<br />
							{
								note.current.length > 0 ?
									<Segment style={{ maxHeight: 500, overflow: 'scroll' }}>
										<span>
											{noteContent}
										</span>
									</Segment>
									:
									<Segment>
										<span style={{ whiteSpace: 'pre-line' }}>
											<b style={{ color: '#ff8288' }}>No Notes</b>
										</span>
									</Segment>
							}
						</div>
					}
				</Segment>
			}
			{
				isOwnerOrAdmin &&
				<Button
					content={form.showAdvanced ? 'Hide Advanced Info' : 'Show Advanced Info'}
					onClick={() => setInnerState(form, setForm, { showAdvanced: !form.showAdvanced })}
				/>
			}
			{
				!keys.current && form.showAdvanced && !isGateway && isOwnerOrAdmin && device.source === 'sensefarm-lora' &&
				<Button
					style={{ marginLeft: 'auto', display: 'inherit' }}
					content='Add Keys'
					color='green'
					onClick={addKeys}
				/>
			}
			{
				keys.current && isOwnerOrAdmin && form.showAdvanced &&
				<Dimmer.Dimmable blurring dimmed={projectDisabled} >
					<br />
					<Segment loading={deviceKeys.isLoading}>
						<Header as='h3' content='Keys' floated='left' />
						<Form>
							{
								!keysReadOnly &&
								<div>
									<Button floated='right' content='Save' color='green' loading={saveKeys.isLoading} disabled={disableSaveKeys} onClick={saveKeys.mutate} />
									<Button floated='right' content='Cancel' onClick={onCancelKeys} />
								</div>
							}

							<Form.Dropdown
								label='Join Type'
								fluid
								search
								selection
								options={joinTypes}
								value={keys.current.joinType}
								onChange={(e, d) => joinTypeChanged(e, d)}
								disabled={keysReadOnly}
							/>
							<Form.Dropdown
								label='Class'
								fluid
								search
								selection
								options={classTypes}
								value={keys.current.class}
								onChange={(e, d) => keyChanged('class', e, d)}
								disabled={keysReadOnly}
							/>
							{
								keys.current.joinType === 'OTAA' ?
									<div>
										<Form.Input
											label='appKey'
											value={keys.current.appKey}
											error={keys.current.appKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(keys.current.appKey)}
											readOnly={keysReadOnly}
											onChange={(e, d) => keyChanged('appKey', e, d)}
										/>
										<Form.Input
											label='appEUI'
											value={keys.current.appEUI}
											error={keys.current.appEUI !== '' && !/^[0-9A-Fa-f]{16}$/.test(keys.current.appEUI)}
											readOnly={keysReadOnly}
											onChange={(e, d) => keyChanged('appEUI', e, d)}
										/>
									</div>
									:
									<div>
										<Form.Input
											label='devAddr'
											value={keys.current.devAddr}
											error={keys.current.devAddr !== '' && !/^[0-9A-Fa-f]{8}$/.test(keys.current.devAddr)}
											readOnly={keysReadOnly}
											onChange={(e, d) => keyChanged('devAddr', e, d)}
										/>
										<Form.Input
											label='nwkSKey'
											value={keys.current.nwkSKey}
											error={keys.current.nwkSKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(keys.current.nwkSKey)}
											readOnly={keysReadOnly}
											onChange={(e, d) => keyChanged('nwkSKey', e, d)}
										/>
										<Form.Input
											label='appSKey'
											value={keys.current.appSKey}
											error={keys.current.appSKey !== '' && !/^[0-9A-Fa-f]{32}$/.test(keys.current.appSKey)}
											readOnly={keysReadOnly}
											onChange={(e, d) => keyChanged('appSKey', e, d)}
										/>
									</div>
							}
						</Form>
					</Segment>
				</Dimmer.Dimmable>
			}
			{
				device.uplinkPayload && form.showAdvanced &&
				<Segment>
					<Header as='h3' content='Uplink Payload (Raw Data)' floated='left' />
					<br />
					<br />
					<Segment raised style={{ maxHeight: 500, overflow: 'auto' }} secondary>
						<pre>{JSON.stringify(device.uplinkPayload, null, 4)}</pre>
					</Segment>
				</Segment>
			}
		</Segment>
	);
}