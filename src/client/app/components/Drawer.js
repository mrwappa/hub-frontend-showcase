import React from 'react';
import { NavLink } from 'react-router-dom';
import { Dimmer, Image, Loader } from 'semantic-ui-react';
import { userHook, projectsHook, currentProjectHook } from '../hooks/ApiQueryHooks';
import { isApiHookLoading } from '../services/ReactUtilities';
import { selectFirstProject } from '../services/ApiService';

export default function Drawer(props) {
	
	const user = userHook();
	const projects = projectsHook({
		onSuccess: (data) => {
			if (data.length <= 1) selectFirstProject(data);
		}
	});
	const currentProject = currentProjectHook();

	const loading = isApiHookLoading(user, projects);

	const role = user.data ? user.data.role : 'user';
	const superUser = role !== 'user';

	let inventoryLink = superUser ?
		<li>
			<NavLink
				to={'/inventory'}
				data-cy='InventoryItemsPage'
			>
				<i className="fa fa-archive" />
				Inventory & Orders
			</NavLink>
		</li>
		:
		null;

	let navigationList;

	const projectLink = '?project=' + currentProject.data.id;

	let fullNavigationList = (
		<ul>
			<li><NavLink to={'/overview' + projectLink} data-cy='overviewPage'><i className="fa fa-home"></i> Overview</NavLink></li>
			<li><NavLink to={'/charts' + projectLink} data-cy='chartPage'><i className="fa fa-area-chart"></i> Charts</NavLink></li>
			<li><NavLink to={'/devices' + projectLink} data-cy='deviceListPage'><i className="fa fa-sitemap"></i> Devices</NavLink></li>
			<li><NavLink to={'/actions' + projectLink} data-cy='actionsListPage'><i className="fa fa-bell"></i> Actions</NavLink></li>
			<li><NavLink to={'/chat' + projectLink} data-cy='groupChatPage'><i className="fa fa-comments-o"></i> Chat</NavLink></li>
			<li><NavLink to={'/members' + projectLink} data-cy='membersPage'><i className="fa fa-users"></i> Members</NavLink></li>
			<li><NavLink to={'/projects'} data-cy='projectsPage'><i className="fa fa-suitcase"></i> Projects</NavLink></li>
			{/*inventoryLink*/}
			{
				superUser &&
				<li><NavLink to={'/admin'} data-cy='adminPage'><i className="fa fa-wrench"></i> Admin</NavLink></li>
			}
		</ul>
	);

	if (loading) {
		navigationList = (
			<Dimmer.Dimmable blurring dimmed >
				{
					loading &&
					<Loader active></Loader>
				}
				{fullNavigationList}
			</Dimmer.Dimmable>
		);
	}
	else {
		if (projects.data.length > 0) {
			navigationList = fullNavigationList;
		}
		else {
			navigationList =
				<ul>
					<li><NavLink to={'/overview'}><i className="fa fa-home"></i> Overview</NavLink></li>
					{inventoryLink}
				</ul>;
		}
	}

	return (
		<div className={props.manualShow ? 'drawer manualShow' : 'drawer'} >
			<Image centered size='small' className='headerImage' src={require('images/sensefarm_logo.svg')} />
			{navigationList}
		</div>
	);
}
