import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, Dropdown, Icon } from 'semantic-ui-react';
import { projectsHook, currentProjectHook, userHook } from '../hooks/ApiQueryHooks';
//import socket from 'services/Socket.io';
import { removeSpecialCharacters } from 'services/UtilityService';
import { stopImpersonating } from '../services/ApiService';

export default function UserMenuDropdown() {

	const user = userHook();
	const projects = projectsHook();
	const currentProject = currentProjectHook();
	
	const navigate = useNavigate();

	const isSuperUser = user.data ? user.data.role !== 'user' : false;

	async function selectProject(projectId) {
		navigate('../overview?project=' + projectId);
	}

	function calculateDropDownHeight(projectCount) {
		const elementHeight = 40.375;
		const baseElementCount = 5;
		let extraElements = 0;
		if (user.data.impersonator) {
			extraElements = 2;
		}
		else if (!user.data.impersonator && isSuperUser) {
			extraElements = 1;
		}

		const elementCount = baseElementCount + extraElements + projectCount;
		const dropDownHeightEstimate = elementHeight * elementCount;
		const dropDownHeight = (dropDownHeightEstimate > global.innerHeight) ? global.innerHeight / 1.2 : null;
		return dropDownHeight;
	}

	const trigger = (
		<div className='userMenuTrigger'>
			<Image inline rounded size='mini' src={user.data.avatar} />
			<span>
				<h1>{user.data.firstname} {user.data.lastname}</h1>
				<span>{currentProject.data.name}</span>
			</span>
			<span>
				<Icon name='chevron down' size='small' />
			</span>
		</div>
	);

	const projectList = projects.data.slice(0).reverse().map((project) =>
		<Dropdown.Item
			key={'project-' + project.id}
			onClick={() => selectProject(project.id)}
			content={currentProject.data && project.id === currentProject.data.id ? <strong>{project.name}</strong> : project.name}
			data-cy={removeSpecialCharacters(project.name)} //define test element as project name with spaces removed
		/>
	);

	return (
		<Dropdown className='userMenuDropdown' trigger={trigger} icon={null} direction='right' data-cy='userMenuDropdown'>
			<Dropdown.Menu style={{ height: calculateDropDownHeight(projects.data.length), overflowY: 'scroll' }}>
				<Dropdown.Header content='Select project' />
				{projectList}
				<Dropdown.Item key={'projects'} icon='suitcase' as={Link} to='/projects' text='Manage Projects' data-cy='manageProjects' />
				<Dropdown.Divider />
				<Dropdown.Item key={'account'} icon='user' as={Link} to='/account' text='My Account' data-cy='myAccount' />
				<Dropdown.Divider />
				<Dropdown.Item key={'help'} icon='help' as={Link} to='/help' text='Help' data-cy='help' />
				{
					user.data.impersonator ?
						<Dropdown.Item key={'admin-impersonate'} icon='spy' content='Stop Impersonating' onClick={() => stopImpersonating(navigate)} data-cy='stopImpersonating' /> : null}
				{
					isSuperUser ?
						<Dropdown.Item key={'admin'} icon='wrench' as={Link} to='/admin' text='Admin' data-cy='adminPage' />
						: null
				}
				<Dropdown.Item key={'logout'} icon='sign out' as={Link} to='/logout' text='Sign Out' data-cy='logout' />
			</Dropdown.Menu>
		</Dropdown>
	);
}


