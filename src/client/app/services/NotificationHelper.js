import React from 'react';
import { Feed } from 'semantic-ui-react';
import { capitalizeFirst, getSensorUnit, beautifyTimeIntervalCriteria } from '../services/UtilityService';

function insertContent(type, organization, description) {
	let summary = 
	type.includes('inventory') ?
		'Inventory Alert'
		:
		capitalizeFirst(type) + " - " + organization;
	return (
		<span>
			<Feed.Summary >
				{summary}
			</Feed.Summary>
			<Feed.Extra text>
				{description}
			</Feed.Extra>
		</span>
	);
}

function getAlarmContent(item) {
	const alarm = item.content.alarm;
	const sensor = item.content.sensor;
	const device = item.content.device;
	const sensorType = getSensorUnit(sensor.type);
	switch (alarm.type) {
		case 'lowerThan':
			return <p><b>{sensor.name}</b> in <b>{device.name}</b> is lower than <b>{alarm.criteria.lowerThan} {sensorType}</b> ({sensor.value} {sensorType})</p>;
		case 'greaterThan':
			return <p><b>{sensor.name}</b> in <b>{device.name}</b> is greater than <b>{alarm.criteria.greaterThan} {sensorType}</b> ({sensor.value} {sensorType})</p>;
		case 'outOfRange':
			return <p><b>{sensor.name}</b> ({sensor.value} {sensorType}) in <b>{device.name}</b> is outside the range <b>{alarm.criteria.lowerThan} {sensorType}</b> to <b>{alarm.criteria.greaterThan} {sensorType}</b></p>;
		case 'updateInterval':
			return <p><b>{sensor.name}</b> in <b>{device.name}</b> has not reported for <b>{beautifyTimeIntervalCriteria(alarm.criteria.updateInterval)}</b></p>;
	}
}

export function getNotificationContent(item) {
	switch (item.type) {
		case 'invite':
			return insertContent(item.type, item.organization.name, <p>You have been invited to join <b>{item.organization.name}</b></p>);
		case 'alarm':
			return insertContent(item.type, item.organization.name, getAlarmContent(item));
		case 'chat':
			return insertContent(item.type, item.organization.name, <p>{item.content.userName} said: {item.content.text}</p>);
		case 'badCreditsMember':
			return insertContent('Insufficent Credits', item.organization.name,
				<p>
					The owner of {item.organization.name} does not have enough Credits for SMS/Call Alarms to be sent. If you want to continue to recieve Alarms through SMS/Calls, please contact the owner of the project.
				</p>
			);
		case 'badCreditsOwner':
			return insertContent('Insufficent Credits', item.organization.name,
				<p>
					You have insufficient Credits for Call/SMS Alarms. If you or your project members would like to continue recieving Alarms through Call/SMS, please add Credits to your account.<br />
					You can add Credits on your Account page.
				</p>
			);
		case 'lowCredits':
			return insertContent('Low Credits', item.organization.name,
				<p>
					Your Credits are running low. If you want to continue recieving Alarms with SMS/Calls, please add more Credits. Read more about Credits at your Account page.
				</p>
			);
		case 'inventoryETAORder':
			return insertContent(item.type, '',
				<p>
					The Inventory Order <b>{item.content.itemName}</b> is now expected to have arrived. Check confirmation of arrival if possible.
				</p>
			);
		case 'inventoryAmount':
			return insertContent(item.type, '',
				<p>
					There are now {item.content.amount} <b>{item.content.itemName}</b> Items left in the Inventory
				</p>
			);
	}
}

export function getNotificationDestination(item) {
	switch (item.type) {
		case 'invite':
			return '/projects';
		case 'alarm':
			return '/devices?project=' + item.organization.id;
		case 'chat':
			return '/chat?project=' + item.organization.id;
		case 'badCreditsMember':
			return '/members?project=' + item.organization.id;
		case 'badCreditsOwner':
			return '/account';
		case 'lowCredits':
			return '/account';
		case 'inventoryETAORder':
			return '/inventory';
		case 'inventoryAmount':
			return '/inventory';
	}
}
