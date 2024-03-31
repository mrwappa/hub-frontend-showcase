import React, { useState } from 'react';
import { Segment, Table, Header, Input, Button, Dropdown, Image, Grid } from 'semantic-ui-react';
import SafeButton from 'components/SafeButton';
import { capitalizeFirst } from 'services/UtilityService';
import { getRole, isMemberOwner, isMemberOwnerOrAdmin } from '../services/ProjectService';
import { subscriptionExpired } from '../services/SubscriptionService';
import { currentProjectHook, projectsHook, userHook } from '../hooks/ApiQueryHooks';
import { isApiHookLoading } from '../services/ReactUtilities';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { api, selectFirstProject } from '../services/ApiService';
import PageBase from '../components/PageBase';
import clone from 'lodash.clone';
import { redirectToOverview } from '../services/UtilityService';
import { useNavigate } from 'react-router-dom';

const roleOptions = [
	{ key: 'owner', value: 'owner', text: 'Owner' },
	{ key: 'admin', value: 'admin', text: 'Admin' },
	{ key: 'viewer', value: 'viewer', text: 'Viewer' }
];

const inviteRoles = roleOptions.slice(1, 3);

const defaultForm = {
	newMemberEmail: '',
	inviteRole: 'viewer'
};

export default function MembersPage() {

	const navigate = useNavigate();

	const [form, setForm] = useState(clone(defaultForm));//TODO: Stop using this method of local state, just have a useState for each parameter
	
	const currentProject = currentProjectHook();
	const projects = projectsHook();
	const user = userHook();

	const addMember = baseMutationHook({
		apiReq: async () => {
			return await api.post('organizations/' + currentProject.data.id + '/invites', {
				email: form.newMemberEmail,
				role: form.inviteRole
			});
		},
		onSuccess: () => {
			form.newMemberEmail = '';
			setForm({ ...form });
		},
		autoApplyRes: true
	});

	const removeMember = baseMutationHook({
		apiReq: async ({ type, id }) => {
			return await api.delete('organizations/' + currentProject.data.id + '/' + type + '/' + id);
		},
		autoApplyRes: true
	});

	const changeRole = baseMutationHook({
		apiReq: async ({ member, newRole }) => {
			return await api.put('organizations/' + currentProject.data.id + '/members/' + member.user.id, {
				role: newRole
			});
		},
		autoApplyRes: true
	});

	const leaveProject = baseMutationHook({
		apiReq: async (projectId) => {
			return await api.delete('organizations/' + projectId + '/members/' + user.data.id);
		},
		onSuccess: () => {
			selectFirstProject(projects.data);
			redirectToOverview(navigate);
			projects.refetch();
		}
	});

	const queryLoading = isApiHookLoading(
		user,
		currentProject
	);

	const userRole = getRole(currentProject.data.members, user.data.id);

	function onEmailChanged(event) {
		form.newMemberEmail = event.target.value;
		setForm({ ...form });
	}

	function inviteRoleChanged(event, { value }) {
		form.inviteRole = value;
		setForm({ ...form });
	}

	function renderAddMemberSegment() {
		if (!queryLoading && isMemberOwnerOrAdmin(userRole)) {
			return (
				<Segment loading={addMember.isLoading}>
					<Header as='h3'>Add member</Header>
					<Grid>
						<Grid.Row>
							<Input
								style={{ width: "70%", paddingLeft: "1%" }}
								placeholder='Email'
								value={form.newMemberEmail}
								onChange={onEmailChanged}
								fluid
								data-cy='emailInvite'
							/>
							<Button.Group style={{ paddingLeft: "1%" }}>
								<Button
									content={"Invite as " + capitalizeFirst(form.inviteRole)}
									color='green' disabled={form.newMemberEmail == ''}
									onClick={addMember.mutate}
									data-cy='submit'
								/>
								<Dropdown
									className='button icon'
									floating
									options={inviteRoles}
									trigger={<React.Fragment />}
									onChange={inviteRoleChanged}
								/>
							</Button.Group>
						</Grid.Row>
					</Grid>
				</Segment>
			);
		}
	}

	function renderMemberTable() {
		if (!currentProject.isLoading) {
			let membersTable = [];
			currentProject.data.members.map((member) => {
				if (member.role !== 'owner') {
					membersTable.push(
						<Table.Row key={member.user.id}>
							<Table.Cell collapsing><Image src={member.user.avatar} rounded size='mini' /></Table.Cell>
							<Table.Cell>
								{member.user.firstname + ' ' + member.user.lastname}
								<br />
								<a href={"mailto:" + member.user.email}>
									{member.user.email}
								</a>
								<br />
								<a href={"tel:" + member.user.phone}>
									{member.user.phone}
								</a>
							</Table.Cell>
							{renderRoleAdminOptions(member)}
							{renderRemoveAdminOptions(member)}
						</Table.Row>
					);
				}
			});
			currentProject.data.invites.map((invite) => {
				membersTable.push(
					<Table.Row key={invite.email}>
						<Table.Cell collapsing />
						<Table.Cell>{invite.email}</Table.Cell>
						<Table.Cell collapsing>Invited as {capitalizeFirst(invite.role)}</Table.Cell>
						{renderRemoveInviteAdminOptions(invite)}
					</Table.Row>
				);

			});
			return membersTable;
		}
	}

	function renderRemoveAdminOptions(member) {
		if (!queryLoading && isMemberOwnerOrAdmin(userRole)) {
			if (isMemberOwner(member)) {
				return <Table.Cell />;
			}
			if (member.user.id !== user.data.id) {//if it's not the current logged in user
				return (
					<Table.Cell collapsing>
						<SafeButton loading={removeMember.isLoading} content="Remove" onClick={() => removeMember.mutate({ type: 'members', id: member.user.id })} />
					</Table.Cell>
				);
			}
			else {
				return (
					<Table.Cell collapsing>
						<SafeButton content="Leave" loading={leaveProject.isLoading} onClick={() => leaveProject.mutate(currentProject.data.id)} />
					</Table.Cell>
				);
			}
		}
	}

	function renderRemoveInviteAdminOptions(invite) {
		if (!queryLoading && isMemberOwnerOrAdmin(userRole)) {
			return (
				<Table.Cell collapsing><SafeButton content="Remove" onClick={() => removeMember.mutate({ type: 'invites', id: invite.email })} /></Table.Cell>
			);
		}
	}

	function renderRoleAdminOptions(member) {
		if (!queryLoading && (isMemberOwner(userRole) || user.data.role.match(/master|superUser/))) {
			return (
				<Table.Cell collapsing>
					<Dropdown placeholder={member.role} value={member.role} selection options={roleOptions} onChange={(event, data) => changeRole.mutate({ member, newRole: data.value })} />
				</Table.Cell>
			);
		}
		else {
			return (<Table.Cell collapsing>{capitalizeFirst(member.role)}</Table.Cell>);
		}
	}

	let owner = {};
	let subscriptionText = 'Indefinite';

	if (currentProject.data.members) {
		let ownerMatch = currentProject.data.members.find((member) => {
			return member.role === 'owner';
		});

		const subscription = currentProject.data.subscription;
		if (subscriptionExpired(user.data, currentProject.data)) {
			subscriptionText = new Date(subscription.endDate).toDateString() + '(Expired)';
		}
		else if (subscription.state === 'notified' || subscription.state === 'date') {
			subscriptionText = new Date(subscription.endDate).toDateString() + ' (End Date)';
		}

		owner = ownerMatch.user;
	}

	const page = (
		<>
			{renderAddMemberSegment()}
			<Segment loading={changeRole.isLoading}>
				<Table striped stackable>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell colSpan='4'>Owner of {currentProject.data.name || 'project'}</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell collapsing><Image src={owner.avatar} rounded size='mini' /></Table.Cell>
							<Table.Cell>
								{owner.firstname + ' ' + owner.lastname}
								<br />
								<a href={"mailto:" + owner.email}>
									{owner.email}
								</a>
								<br />
								<a href={"tel:" + owner.phone}>
									{owner.phone}
								</a>
							</Table.Cell>
							<Table.Cell>
								<h4>Subscription:</h4> {subscriptionText}
							</Table.Cell>
							<Table.Cell>
								<h4>Credits:</h4> {owner.credits}
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>
				{
					currentProject.data.members && currentProject.data.members.length > 0 &&
					<Table striped stackable>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell colSpan='4'>All members of {currentProject.data.name || 'project'}</Table.HeaderCell>
							</Table.Row>
						</Table.Header>

						<Table.Body>
							{renderMemberTable()}
						</Table.Body>
					</Table>
				}
			</Segment>
		</>
	);

	return (
		<PageBase title={'Members'} loading={queryLoading} page={page} />
	);
}