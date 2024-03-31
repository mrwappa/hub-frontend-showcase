import React from 'react';
import { Icon, Feed } from 'semantic-ui-react';
import moment from 'moment';

const changeProjectRoutes = [
	'/chat',
	'/devices'
];

const notificationColors = {
	alarm: '#ffebeb',
	invite: '#eeffed',
	chat: '#f2fdff',
	badCreditsMember: '#ffd1d1',
	badCreditsOwner: '#ffd1d1',
	lowCredits: '#ffd1d1',
	inventoryAmount: 'fff7f7',
	inventoryETAORder: 'fff7f7'
};

export default function NotifierItem(props) {

	async function onItemClick() {
		//TODO: Check how well this works with newer pages such as chat/devices (compare it to the old code to see differences)
		props.navigate(props.notification.destination);
		props.onSetToViewed();
	}
	
	let bkgrColor = props.notification ? notificationColors[props.notification.type] : '#eeffed';
	
	return (
		<Feed.Event style={{ backgroundColor: bkgrColor }} id="specialCaseEvent">
			<Feed.Content>
				{props.notification.content}
				<Feed.Date>
					{props.notification.viewed ? null : <Icon name='circle' size='small' color='green' />}
					{moment(props.notification.time).toNow(true)} ago
				</Feed.Date>
			</Feed.Content>
			<div>
				<Feed.Event style={{ backgroundColor: bkgrColor }} id="specialCaseOtherEvent" onClick={props.onRemove}>
					<Icon name='close' size="large" />
				</Feed.Event>
				<Feed.Event style={{ backgroundColor: bkgrColor }} id="specialCaseOtherEvent" onClick={onItemClick} data-cy={props.customDataCy}>
					<Icon name='external' size="large" />
				</Feed.Event>
			</div>
		</Feed.Event>
	);
}