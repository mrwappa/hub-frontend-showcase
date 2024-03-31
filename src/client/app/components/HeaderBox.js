import React from 'react';
import { Segment, Icon, Sticky } from 'semantic-ui-react';
import UserMenuDropdown from 'components/UserMenuDropdown';
import Notifier from './Notifier';
import { userHook } from '../hooks/ApiQueryHooks';
//import Announcements from 'components/Announcements';//TODO: READD THESE COMPONENTS

export default function HeaderBox(props) {

	const user = userHook();

	return (
		<Sticky>
			<Segment clearing className={props.manualShow ? 'pageHeader manualShow' : 'pageHeader'}>
				<table>
					<tbody>
						<tr>
							<td className='collapsing'>
								<a className='menuToggle' onClick={props.onToggleMenuClick}><Icon name='content' size='large' /></a>
							</td>
							<td>
								<h1>{props.title}</h1>
							</td>
							{<td style={{ textAlign: 'right' }}>
								{
									user.data.role && user.data.role !== 'user' &&
									<Notifier inventoryNotices={true} userData={user.data} />
								}
								{/*<Announcements />*/}
								<Notifier userData={user.data} />
								<UserMenuDropdown />
							</td>}
						</tr>
					</tbody>
				</table>
			</Segment>
		</Sticky>
	);
}