import React, { useState } from 'react';
import { Popup, Icon, Feed } from 'semantic-ui-react';

import NotifierItem from '../components/NotifierItem';
//import socket from '../services/Socket.io';
import { removeSpecialCharacters } from '../services/UtilityService';
import { getNotificationContent, getNotificationDestination } from '../services/NotificationHelper';
import { noticesHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { api } from '../services/ApiService';
import { useNavigate } from 'react-router-dom';
import clone from 'lodash.clone';

export default function Notifier({
	userData = {},
	inventoryNotices = false
}) {

	const navigate = useNavigate();

	const notices = noticesHook(
		userData,
		inventoryNotices,
		(data) => {//onSuccess
			createNotificationList(data);
		}
	);

	const [open, setOpen] = useState(false);
	const [pendingNotifications, setPendingNotifications] = useState(
		getStoreValue('pendingNotifications', inventoryNotices)
	);
	const [notifications, setNotifications] = useState(
		getStoreValue('notifications', inventoryNotices)
	);

	const setNoticeViewed = baseMutationHook({
		apiReq: async (id) => {
			return await api.put('notices/' + id, {
				viewed: true
			});
		},
		onSuccess: () => {
			notices.refetch();
		}
	});

	const removeNotification = baseMutationHook({
		apiReq: async (id) => {
			return await api.delete('notices/' + id);
		},
		onSuccess: () => {
			notices.refetch();
		}
	});

	function createNotificationList(list) {
		let pendingNotices = false;
		let noticesList = list.map((notification) => {
			let content = getNotificationContent(notification);
			let destination = getNotificationDestination(notification);
			pendingNotices = pendingNotices || !notification.viewed;
			return {
				id: notification.id,
				content,
				time: notification.createdAt,
				viewed: notification.viewed,
				destination,
				organization: notification.organization,
				type: notification.type
			};
		});

		setOpen(open && noticesList.length > 0);
		setStoreValue('notifications', inventoryNotices, noticesList, setNotifications);
		setStoreValue('pendingNotifications', inventoryNotices, pendingNotices, setPendingNotifications);
	}

	function onOpen() {
		let pendingNotices = false;
		for (let notice of notifications) {
			if (!notice.viewed) {
				pendingNotices = true;
				break;
			}
		}

		setOpen(true);
		setStoreValue('pendingNotifications', inventoryNotices, pendingNotices, setPendingNotifications);
	}

	function calculateFeedHeight(notifierCount) {
		const noticeHeight = 92.6;
		const feedHeightEstimate = notifierCount * noticeHeight;
		const maxFeedHeight = global.innerHeight / 1.8;
		const height = feedHeightEstimate > maxFeedHeight ? maxFeedHeight : null;
		return height;
	}

	const notifierItems = notifications.map((notification, index) => {
		return (
			<NotifierItem
				key={notification.id}
				notification={notification}
				customDataCy={removeSpecialCharacters(notification.destination + index)}
				onRemove={() => removeNotification.mutate(notification.id)}
				onSetToViewed={() => setNoticeViewed.mutate(notification.id)}
				navigate={navigate}
			/>
		);
	});

	let moreThan0Notices = notifications.length > 0;
	let feedStyle = moreThan0Notices ? { height: '100%', overflowY: 'scroll' } : null;

	return (
		<Popup
			trigger={
				<Icon.Group size='large' className='notifierBell' data-cy='notifierBell'>
					<Icon
						color={inventoryNotices ? 'grey' : undefined}
						name={inventoryNotices ? 'archive' : 'bell outline'}
						style={{ fontSize: inventoryNotices ? '1.2em' : '1.1em' }}
					/>
					{pendingNotifications ? <Icon data-cy='redNotifierBell' corner name='circle' color='red' style={{ fontSize: '0.6em' }} /> : null}
				</Icon.Group>
			}
			on='click'
			open={open}
			onOpen={onOpen}
			onClose={() => setOpen(false)}
			position='bottom right'
			className={moreThan0Notices ? 'notifierPopup' : ''}
		>
			<div style={{ height: calculateFeedHeight(notifierItems.length) }}>
				<Feed style={feedStyle} data-cy='notifications'>
					{
						moreThan0Notices ?
							notifierItems
							:
							<Feed.Event>
								<Feed.Content>
									{
										inventoryNotices ?
											'No Inventory Notifications'
											:
											'No Notifications'
									}

								</Feed.Content>
							</Feed.Event>
					}
				</Feed>
			</div>
		</Popup>
	);
}

/**/
//If we have state data that is needed across pages and can't be pulled from react-query, this is the solution
//If there's a case where another component needs this, think about generalising this into a "Service"
function createStore(store, newParam, defaultValue) {
	store[newParam + true] = clone(defaultValue);
	store[newParam + false] = clone(defaultValue);
}

function getStoreValue(param, inventoryNotices) {
	return storedParams[param + inventoryNotices];
}

function setStoreValue(param, inventoryNotices, newValue, hookSetter) {
	storedParams[param + inventoryNotices] = newValue;
	hookSetter(newValue);
}

let storedParams = {};
createStore(storedParams, 'notifications', []);
createStore(storedParams, 'pendingNotifications', false);
/**/ 