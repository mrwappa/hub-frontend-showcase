import React, { useEffect, useState } from 'react';
import { Table, Checkbox, Button, Segment } from 'semantic-ui-react';
import PageBase from '../components/PageBase';
import SafeButton from '../components/SafeButton';
import { api } from 'services/ApiService';
import { subscriptionExpired } from 'services/SubscriptionService';
import { getAlarmDescription } from 'services/UtilityService';
import { isUserOwnerOrAdmin } from 'services/ProjectService';
import { Link } from 'react-router-dom';
import { alarmsHook, currentProjectHook, userHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import queryString from 'query-string';


export default function ActionsListPage() {

	const alarms = alarmsHook();
	const currentProject = currentProjectHook();
	const user = userHook();
	
	const [selectedActions, setSelectedActions] = useState([]);
	const [disableButtons, setDisableButtons] = useState(false);

	useEffect(() => {
		if (currentProject.isSuccess && user.isSuccess) {
			const ownerOrAdmin = isUserOwnerOrAdmin(currentProject.data, user.data);
			setDisableButtons(!ownerOrAdmin || subscriptionExpired(user.data, currentProject.data));
		}
	}, [currentProject.isSuccess, user.isSuccess]);

	function onToggleSelectedActions(action) {
		let current = selectedActions.indexOf(action.id);
		let modified = selectedActions.slice();
		if (current != -1) {
			modified.splice(current, 1);
		}
		else {
			modified.push(action.id);
		}
		setSelectedActions(modified);
	}

	const toggleEnabled = baseMutationHook({
		apiReq: async (action) => await api.put('/alarms/' + action.id + '/enable', { enabled: !action.enabled }),
		onSuccess: async () => {
			await alarms.refetch();
		}
	});

	const removeAction = baseMutationHook({
		apiReq: async (id) => await api.delete(`alarms/` + id)
	});

	async function onRemoveClick() {
		for (let id of selectedActions) {
			await removeAction.mutateAsync(id);
		}
		setSelectedActions([]);

		alarms.refetch();
	}

	function onToggleAllClick() {
    let modified = [];
    if (selectedActions.length != alarms.data.results.length) {
      modified = selectedActions.map((action) => action.id);
    }
		setSelectedActions(modified);
  }

	let actionList = [];
	if (alarms.isSuccess) {
		actionList = alarms.data.results.map((action) => {
			/*Cypress Parameters*/
			let cyCriteriaValue = '';
			if (action.alarmType === 'lowerThan' || action.alarmType === 'greaterThan') {
				cyCriteriaValue = action.criteria[action.alarmType];
			}
			else if (action.alarmType === 'outOfRange') {
				cyCriteriaValue = action.criteria.lowerThan + 'and' + action.criteria.greaterThan;
			}
			let uniqueElId = action.sensorType + action.alarmType + cyCriteriaValue;
			/*Cypress Parameters*/

			return <Table.Row key={action.id}>
				<Table.Cell collapsing><Checkbox checked={selectedActions.includes(action.id)} onClick={() => onToggleSelectedActions(action)} data-cy={'check' + uniqueElId} /></Table.Cell>
				<Table.Cell>{getAlarmDescription(action)}</Table.Cell>
				<Table.Cell><Checkbox toggle checked={action.enabled} onChange={() => toggleEnabled.mutate(action)} /></Table.Cell>
				<Table.Cell>{action.sources.length}</Table.Cell>
				<Table.Cell collapsing>
					<Link to={'../actions/action?' + queryString.stringify({ project: currentProject.data.id, action: action.id })}>
						<Button disabled={disableButtons} color='blue' size='small' content='Edit' data-cy={'edit' + uniqueElId} />
					</Link>
				</Table.Cell>
			</Table.Row>;
		});
	}

	if (actionList.length === 0) {
		actionList = <Table.Row>
			<Table.Cell colSpan={6}>{'You don\'t have any actions yet.'}</Table.Cell>
		</Table.Row>;
	}

	const page = (
		<Segment loading={alarms.isLoading}>
			<Link to={'/actions/add?' + queryString.stringify({ project: currentProject.data.id })}>
				<Button disabled={disableButtons} color='green' icon='plus' content='Add' labelPosition='left' data-cy='addAlarm' />
			</Link>
			<SafeButton
				content='Remove'
				floated='right'
				onClick={onRemoveClick}
				disabled={selectedActions.length == 0 || disableButtons}
				customDataCy='removeAlarm'
			/>
			<Table striped>
				<Table.Header>
					<Table.Row>
						<Table.HeaderCell><Checkbox disabled={alarms.data.results && alarms.data.results.length == 0}
							checked={(selectedActions.length > 0) && (alarms.data.results && alarms.data.results.length == selectedActions.length)}
							onClick={onToggleAllClick} /></Table.HeaderCell>
						<Table.HeaderCell>Condition</Table.HeaderCell>
						<Table.HeaderCell>Enabled</Table.HeaderCell>
						<Table.HeaderCell>Connected Sensors</Table.HeaderCell>
						<Table.HeaderCell>Manage</Table.HeaderCell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{actionList}
				</Table.Body>
			</Table>
		</Segment>
	);

	return (
		<PageBase title='Actions' page={page} />
	);
}
