import React, { useState } from 'react';
import { Segment, Header, Form, Button, Table } from 'semantic-ui-react';
import PageBase from '../components/PageBase';
import SafeButton from '../components/SafeButton';
import { isUserOwner } from '../services/ProjectService';
import { api } from '../services/ApiService';
import { removeSpecialCharacters } from '../services/UtilityService';
import { invitesHook, userHook, projectsHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { isApiHookLoading } from '../services/ReactUtilities';
import { useNavigate } from 'react-router-dom';
import EditProjectModal from '../components/EditProjectModal';
import clone from 'lodash.clone';

const deafultForm = {
	errorMessage: 0,
	projectName: '',
	newProjectName: ''
};

export default function ProjectsPage() {

	const user = userHook();
	const projects = projectsHook();
	const invites = invitesHook();

	const [form, setForm] = useState(clone(deafultForm));
	const [editingProject, setEditingProject] = useState(null);

	const isSuperUser = user.data.role !== 'user';
	const pageLoading = isApiHookLoading(
		user,
		projects,
		invites
	);

	const navigate = useNavigate();

	const addProject = baseMutationHook({
		apiReq: async () => {
			return await api.post('organizations', { name: form.newProjectName });
		},
		onSuccess: () => {
			form.newProjectName = '';
			setForm({ ...form });
			projects.refetch();
		}
	});

	const acceptInvitation = baseMutationHook({
		apiReq: async (id) => {
			return await api.post('organizations/' + id + '/invites/accept');
		},
		onSuccess: () => {
			form.newProjectName = '';
			setForm({ ...form });
			projects.refetch();
			invites.refetch();
		}
	});

	const declineInvitation = baseMutationHook({
		apiReq: async (id) => {
			return await api.post('organizations/' + id + '/invites/decline');
		},
		onSuccess: () => {
			form.newProjectName = '';
			setForm({ ...form });
			projects.refetch();
		}
	});

	const removeProject = baseMutationHook({
		apiReq: async (id) => {
			return await api.delete('organizations/' + id);
		},
		onSuccess: () => {
			projects.refetch();
		}
	});

	const changeProjectName = baseMutationHook({
		apiReq: async ({ id, name }) => {
			return await api.put('organizations/' + id, { name });
		},
		onSuccess: () => {
			setEditingProject(null);
			projects.refetch();
		}
	});

	const leaveProject = baseMutationHook({
		apiReq: async (projectId) => {
			return await api.delete('organizations/' + projectId + '/members/' + user.data.id);
		},
		onSuccess: () => {
			projects.refetch();
		}
	});

	function onViewProjectClick(projectId) {
		navigate('../overview?project=' + projectId);
	}

	function onViewMembersClick(projectId) {
		navigate('../members?project=' + projectId);
	}

	function onNewProjectNameChanged(event) {
		form.newProjectName = event.target.value;
		setForm({ ...form });
	}

	const renderInvites = () => {
		if (invites.data.length > 0) {
			let invitations = invites.data.map((inv, index) =>
				<Table.Row key={inv.id}>
					<Table.Cell><p>You have been invited to join <b>{inv.name}</b></p></Table.Cell>
					<Table.Cell textAlign='right'>
						<Button
							loading={acceptInvitation.isLoading}
							color='green'
							content='Accept'
							onClick={() => acceptInvitation.mutate(inv.id)}
							data-cy={'inviteAccept' + index}
						/>
						<SafeButton loading={declineInvitation.isLoading} color='red' content='Deny' onClick={() => declineInvitation.mutate(inv.id)} />
					</Table.Cell>
				</Table.Row>
			);
			return (
				<Segment>
					<Header as='h3'>Pending Invitations</Header>
					<Table >
						<Table.Body>
							{invitations}
						</Table.Body>
					</Table>
				</Segment>
			);
		}
	};

	const renderCreateProjects = () => {
		return (
			<Segment loading={addProject.isLoading}>
				<Header as='h3'>Create new project</Header>
				<Form>
					<Form.Input
						label='Name'
						placeholder='Name'
						value={form.newProjectName}
						onChange={onNewProjectNameChanged}
						action={<Button disabled={form.newProjectName.length === 0} positive content="Add" onClick={addProject.mutate} data-cy='submit' />}
						data-cy='projectName'
					/>
				</Form>
			</Segment>
		);
	};

	const renderProjects = () => {
		let projectList = projects.data.slice(0).reverse().map((org) => {

			const userIsOwner = isUserOwner(org, user.data);
			let removeButton = null;

			const removeCyTag = 'remove' + removeSpecialCharacters(org.name);
			const leaveCyTag = 'leave' + removeSpecialCharacters(org.name);

			if (userIsOwner && !isSuperUser) {
				removeButton =
					<Table.Cell collapsing>
						<SafeButton
							content='Remove'
							onClick={() => removeProject.mutate(org.id)}
							customDataCy={removeCyTag}
							loading={removeProject.isLoading}
						/>
					</Table.Cell>;
			}
			else if (isSuperUser) {
				removeButton =
					<Table.Cell collapsing>
						<Button.Group>
							<SafeButton
								content='Remove'
								onClick={() => removeProject.mutate(org.id)}
								customDataCy={removeCyTag}
								loading={removeProject.isLoading}
							/>
							<Button.Or />
							<SafeButton
								disabled={userIsOwner}
								content='Leave'
								onClick={() => leaveProject.mutate(org.id)}
								customDataCy={leaveCyTag}
								loading={leaveProject.isLoading}
							/>
						</Button.Group>
					</Table.Cell>;
			}
			else if (!userIsOwner) {
				removeButton =
					<Table.Cell collapsing>
						<SafeButton
							content='Leave'
							onClick={() => leaveProject.mutate(org.id)}
							customDataCy={leaveCyTag}
							loading={leaveProject.isLoading}
						/>
					</Table.Cell>;
			}

			return (
				<Table.Row key={org.id}>
					<Table.Cell collapsing>
						<Button icon='pencil' disabled={!userIsOwner && !isSuperUser} onClick={() => setEditingProject(org)} />
					</Table.Cell>
					<Table.Cell>
						{org.name}<br /><small>{org.members.length} members</small>
					</Table.Cell>
					<Table.Cell collapsing>
						<Button.Group>
							<Button color='blue' float='right' content="View" onClick={() => onViewProjectClick(org.id)} data-cy={'view' + removeSpecialCharacters(org.name)} />
							<Button.Or text='' />
							<Button color='blue' float='right' content="Members" onClick={() => onViewMembersClick(org.id)} />
						</Button.Group>

					</Table.Cell>
					{removeButton}
				</Table.Row>
			);
		});

		return (
			<Segment loading={removeProject.isLoading}>
				<Header as='h3'>Your projects</Header>
				<Table striped stackable>
					<Table.Body>
						{projectList.length > 0 ?
							projectList :
							<Table.Row><Table.Cell>{"You don't have any projects"}</Table.Cell></Table.Row>
						}
						<EditProjectModal
							open={editingProject != null}
							name={editingProject ? editingProject.name : ''}
							onClose={() => { setEditingProject(null); }}
							onSave={(name) => changeProjectName.mutate({ id: editingProject.id, name })}
						/>
					</Table.Body>
				</Table>
			</Segment>
		);

	};

	const page = (
		<>
			{renderCreateProjects()}
			{renderInvites()}
			{renderProjects()}
		</>
	);

	return <PageBase loading={pageLoading} page={page} title='Projects' />;
}