import React, { useEffect, useState } from 'react';
import { Segment, Header, Button, Table, Input, Checkbox, Icon, Dropdown, Message, Popup, Label } from 'semantic-ui-react';
import { deepCopy, payloadHexWarning } from 'services/UtilityService';
import { getActionsOfIntegration, executeAction } from 'services/IntegrationService';
import { api } from 'services/ApiService';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { toastSuccess } from '../services/Toaster';
import { getParameterInput } from '../services/UtilityService';

//TODO: Test ALL features to make sure this works as intended

const interfaceStates = [
	{ key: 'parameters', text: 'Paramaters', value: 'parameters' },
	{ key: 'payloadHex', text: 'Payload Hex', value: 'payloadHex' },
	{ key: 'latestSentData', text: 'Latest Sent Data', value: 'latestSentData' }
];
let integrationActions = [];

export default function ParameterSegment({
	device,
	projectId,
	refetchDevices
}) {

	const [parameters, setParameters] = useState([]);
	const [originalParameters, setOriginalParameters] = useState([]);
	const [interfaceState, setInterfaceState] = useState('parameters');
	const [payloadHex, setPayloadHex] = useState('');
	const [originalPayloadHex, setOriginalPayloadHex] = useState('');
	const [selectedParameters, setSelectedParameters] = useState([]);

	const sendAction = baseMutationHook({
		apiReq: async (action) => await executeAction(action, device.id),
		onSuccess: () => { toastSuccess('Action Sent'); }
	});

	useEffect(() => {
		integrationActions = getActionsOfIntegration(device.source).map((action) => {
			return (<Dropdown.Item key={action.key} onClick={() => sendAction.mutate(action.value)} text={action.text} />);
		});
	}, []);

	useEffect(() => {
		setParameters(deepCopy(device.parameters));
		setOriginalParameters(deepCopy(device.parameters));

		setPayloadHex(device.payloadHex.value);
		setOriginalPayloadHex(device.payloadHex.value);
	}, [device.id]);

	const onCancelClick = () => {
		setParameters(deepCopy(originalParameters));
		setPayloadHex(originalPayloadHex);
	};

	const savePayloadHex = baseMutationHook({
		apiReq: async () => await api.put('devices/' + device.id + '/payload-hex', { payloadHex }),
		onSuccess: () => {
			refetchDevices();
			toastSuccess('Payload Sent');
		}
	});

	const editSimpleParamList = baseMutationHook({
		apiReq: async (action) => {
			return await api.put('organizations/' + projectId + '/devices/' + device.id, { simpleParameters: selectedParameters, listAction: action });
		},
		onSuccess: () => {
			refetchDevices();
			setSelectedParameters([]);
		}
	});

	const saveParameters = baseMutationHook({
		apiReq: async (aParameters) => {
			// Fix to avoid value jumping back and forth
			for (let n of parameters) {
				let current = device.parameters.find(p => p.identifier === n.identifier);
				if (current) current.value = n.value;
			}

			return await api.put('devices/' + device.id, { parameters: aParameters });
		},
		onSuccess: () => {
			refetchDevices();
			toastSuccess('Parameters Sent');
		}
	});

	function onSendClick() {
		if (interfaceState === 'parameters') {
			let aParameters = parameters.map((parameter) => {
				if (parameter.type === 'choice' || parameter.type === 'integer') {
					parameter.value = parseInt(parameter.value);
				}
				else if (parameter.type === 'float') {
					parameter.value = parseFloat(parameter.value);
				}
				return parameter;
			});

			saveParameters.mutate(aParameters);
		}
		else if (interfaceState === 'payloadHex') {
			savePayloadHex.mutate(payloadHex);
		}
		setOriginalParameters(deepCopy(parameters));
		setOriginalPayloadHex(payloadHex);
	}

	function onInterfaceChange(e, { value }) {
		setInterfaceState(value);
	}

	function onPayloadHexChange(event) {
		setPayloadHex(event.target.value);
	}

	function onParameterChange(identifier, event, data) {
		let aParameters = deepCopy(parameters);
		let param_modified = aParameters.find(p => p.identifier === identifier);

		if (!isNaN(data.value)) {
			param_modified.value = param_modified.type === 'integer' ? parseInt(data.value) : data.value;
			setParameters(aParameters);
		}
	}

	function onToggleSelected(paramId) {
		let current = selectedParameters.indexOf(paramId);
		let modified = selectedParameters.slice();
		if (current != -1) {
			modified.splice(current, 1);
		}
		else {
			modified.push(paramId);
		}
		setSelectedParameters(modified);
	}

	function onSelectAllClick() {
		let modified = [];
		if (selectedParameters.length != device.parameters.length) {
			modified = parameters.map((param) => param.id);
		}
		setSelectedParameters(modified);
	}

	function onParameterToggle(identifier, event, data) {
		let aParameters = deepCopy(parameters);
		let param_modified = aParameters.find(p => p.identifier === identifier);
		param_modified.value = data.checked;
		setParameters(aParameters);
	}

	function validInputValue(parameter, changed) {
		if (!changed || (parameter.type !== 'integer' && parameter.type !== 'float')) {
			return true;
		}
		return (parseFloat(changed.value) >= parameter.constraints.min && parseFloat(changed.value) <= parameter.constraints.max);
	}

	let disableSend = false;
	const firstDisableCheck = device.parameters.length === 0 || selectedParameters.length === 0;
	let disableAddSimpleParam = firstDisableCheck;
	let disableRemoveSimpleParam = firstDisableCheck;

	let parameterRows = device.parameters.map(param => {
		const changed = parameters.find(p => p.identifier === param.identifier);
		let validInput = validInputValue(param, changed);
		if (changed && !disableSend) {
			disableSend = changed.value === '';
			disableSend = !disableSend ? !validInput : disableSend;
		}

		let checked = selectedParameters.includes(param.id);

		let isSimple = device.simpleParameters ?
			device.simpleParameters.includes(param.id)
			:
			false;

		let tags = [];
		if (isSimple) {
			tags.push(
				<Popup
					key={tags.length}
					content='This Parameter will be shown on Device List page and is available to use for Viewers'
					trigger={<Label key={tags.length} size='large' content='S' />}
				/>
			);
			disableAddSimpleParam = disableAddSimpleParam === false ? checked : disableAddSimpleParam;
			if (checked) {
				disableRemoveSimpleParam = disableRemoveSimpleParam === false ? false : disableRemoveSimpleParam;
			}
		}
		else {
			disableRemoveSimpleParam = disableRemoveSimpleParam === false ? checked : disableRemoveSimpleParam;
		}

		return <Table.Row key={param.identifier}>
			<Table.Cell>
				<Checkbox
					checked={checked}
					onClick={(e, d) => onToggleSelected(param.id, e, d)}
				/>
			</Table.Cell>
			<Table.Cell width={10}>
				{param.name}<br />
				<small>{param.description}</small>
			</Table.Cell>
			<Table.Cell>
				{tags}
			</Table.Cell>
			<Table.Cell width={6}>
				{getParameterInput(param, changed, validInput, onParameterChange, onParameterToggle)}
			</Table.Cell>
			<Table.Cell>
				{param.pending ? <Icon loading name='spinner' /> : <Icon name={changed ? 'pencil' : 'check'} />}
			</Table.Cell>
		</Table.Row>;
	});

	if (disableAddSimpleParam && disableRemoveSimpleParam && selectedParameters.length > 0) {
		disableAddSimpleParam = false;
		disableRemoveSimpleParam = false;
	}

	return (
		<Segment>
			<Header as='h3' floated='left'>
				<Header.Content>
					Parameters
				</Header.Content>
			</Header>
			<Header as='h3' floated='right'>
				<Header.Content>
					<Button.Group style={{ paddingRight: '20px' }}>
						<Popup
							content='Simple Parameters will be shown on the Device List page and will be usable by Viewers of the project'
							trigger={<Label content={<h5>Simple Parameters</h5>} size='large' />}
						/>
						<Button.Or text='' />
						<Button
							loading={editSimpleParamList.isLoading}
							disabled={disableAddSimpleParam}
							onClick={() => editSimpleParamList.mutate('add')}
							color='green'
						>
							Add
						</Button>
						<Button
							loading={editSimpleParamList.isLoading}
							disabled={disableRemoveSimpleParam}
							onClick={() => editSimpleParamList.mutate('remove')}
							color='red'
						>
							Remove
						</Button>
					</Button.Group>
					<Dropdown options={interfaceStates} value={interfaceState} onChange={onInterfaceChange} button />
					{integrationActions.length > 0 ?
						<Dropdown text='Action(s)' button>
							<Dropdown.Menu>
								{integrationActions}
							</Dropdown.Menu>
						</Dropdown> :
						null}
					<Button onClick={onCancelClick}>Cancel</Button>
					<Button loading={saveParameters.isLoading || savePayloadHex.isLoading} color='green' disabled={disableSend} onClick={onSendClick}>Send</Button>
				</Header.Content>
			</Header>
			{interfaceState === 'payloadHex' ?
				<Header as='h4' floated='right'>
					<Header.Content>
						<Message
							error
							header='WARNING'
							content={payloadHexWarning}
						/>
					</Header.Content>
				</Header> : null}
			{interfaceState === 'parameters' ?
				<Table>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>
								<Checkbox
									checked={selectedParameters.length > 0 && selectedParameters.length == device.parameters.length}
									onClick={onSelectAllClick}
								/>
							</Table.HeaderCell>
							<Table.HeaderCell>
								Description
							</Table.HeaderCell>
							<Table.HeaderCell>
								Tags
							</Table.HeaderCell>
							<Table.HeaderCell>
								Value
							</Table.HeaderCell>
							<Table.HeaderCell>
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{parameterRows}
					</Table.Body>
				</Table>
				:
				interfaceState === 'payloadHex' ?
					<Table>
						<Table.Body>
							<Table.Row>
								<Table.Cell width={10}>
									Payload Hex<br />
									<small>Hex value that can contain several options for a device</small>
								</Table.Cell>
								<Table.Cell width={6}>
									<Input
										fluid
										step='1'
										value={payloadHex}
										onChange={onPayloadHexChange}
									/>
								</Table.Cell>
								<Table.Cell>
									{device.payloadHex.pending ? <Icon loading name='spinner' /> : <Icon name={payloadHex !== device.payloadHex.value ? 'pencil' : 'check'} />}
								</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table>
					:
					<div>
						<br />
						<br />
						<Segment style={{ overflowX: 'auto' }} secondary>
							<pre>{!device.latestSentData ? "NO DATA SENT" : JSON.stringify(device.latestSentData, null, 4)}</pre>
						</Segment>
					</div>}
		</Segment>
	);
}