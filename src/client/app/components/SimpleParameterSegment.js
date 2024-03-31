import clone from 'lodash.clone';
import React, { useEffect, useState } from 'react';
import { Segment, Header, Button, Table, Icon } from 'semantic-ui-react';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { api } from '../services/ApiService';
import { toastSuccess } from '../services/Toaster';
import { getParameterInput } from '../services/UtilityService';

export default function SimpleParameterSegment({
	device = {},
	refetchDevices = () => {}
}) {
	const [params, setParams] = useState([]);
	const [originalParams, setOriginalParams] = useState([]);

	useEffect(() => {
		let simpleParameters = device.simpleParameters;
		if (simpleParameters && simpleParameters.length > 0) {
			let newParams = clone(device.parameters);
			newParams = newParams.filter((param) => {
				return simpleParameters.includes(param.id);
			});
			setParams(newParams);
			setOriginalParams(clone(newParams));
		}
	}, [device.simpleParameters]);

	function onParameterChange(identifier, data) {
		let newParams = clone(params);
		let param_modified = newParams.find(p => p.identifier === identifier);

		if (!isNaN(data.value)) {
			param_modified.value = param_modified.type === 'integer' ? parseInt(data.value) : data.value;
			setParams(newParams);
		}

	}

	function onParameterToggle(identifier, data) {
		let newParams = clone(params);
		let param_modified = newParams.find(p => p.identifier === identifier);
		param_modified.value = data.checked;

		setParams(newParams);
	}

	function validInputValue(parameter, changed) {
		if (!changed || (parameter.type !== 'integer' && parameter.type !== 'float')) {
			return true;
		}
		return (parseFloat(changed.value) >= parameter.constraints.min && parseFloat(changed.value) <= parameter.constraints.max);
	}

	let disableSend = false;

	let parameterRows = [];
	if (device.simpleParameters && device.simpleParameters.length > 0) {
		parameterRows = originalParams.map(param => {
			const changed = params.find(p => p.identifier === param.identifier);
			let validInput = validInputValue(param, changed);
			if (changed && !disableSend) {
				disableSend = changed.value === '';
				disableSend = !disableSend ? !validInput : disableSend;
			}

			return (
				<Table.Row key={param.identifier}>
					<Table.Cell width={10}>
						{param.name}<br />
						<small>{param.description}</small>
					</Table.Cell>
					<Table.Cell width={6}>
						{getParameterInput(param, changed, validInput, onParameterChange, onParameterToggle)}
					</Table.Cell>
					<Table.Cell>
						{param.pending ? <Icon loading name='spinner' /> : <Icon name={'check'} />}
					</Table.Cell>
				</Table.Row>
			);
		});
	}

	function onCancelClick() {
		setParams(clone(originalParams));
	}

	const sendParameters = baseMutationHook({
		apiReq: async () => {
			return await api.put('devices/' + device.id + '/parameters', { parameters: params });
		},
		onSuccess: () => {
			toastSuccess('Sent Parameters');
			refetchDevices();
		}
	});

	return (
		parameterRows.length > 0 ?
			<Segment>
				<Header as='h3' floated='left'>
					<Header.Content>
						Parameters
					</Header.Content>
				</Header>
				<Header as='h3' floated='right'>
					<Header.Content>
						<Button onClick={onCancelClick}>Cancel</Button>
						<Button color='green' disabled={disableSend} onClick={sendParameters.mutate}>Send</Button>
					</Header.Content>
				</Header>
				<Table>
					<Table.Body>
						{parameterRows}
					</Table.Body>
				</Table>
			</Segment>
			:
			null
	);
}