import React, { useEffect, useState } from 'react';
import { Tab, Grid, Menu, Dropdown, Input, Table, Button, Loader, Label } from 'semantic-ui-react';
//import AnnouncementPane from 'components/AnnouncementPane';
//import GeneralSettingsPane from 'components/GeneralSettingsPane';
//import EditUserBenefitsModal from 'components/EditUserBenefitsModal';
import { isProjectSubExpired } from 'services/SubscriptionService';
import { api } from 'services/ApiService';
import moment from 'moment';
import { removeSpecialCharacters, availableLimits } from '../services/UtilityService';
import { Link, useNavigate } from 'react-router-dom';
import PageBase from '../components/PageBase';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import clone from 'lodash.clone';
import { setInnerState } from '../services/ReactUtilities';
import { userHook } from '../hooks/ApiQueryHooks';
import EditUserBenefitsModal from '../components/EditUserBenefitsModal';
import { impersonate, superViewProject } from '../services/ApiService';

const defaultTabSorting = [
	'firstname',
	'uid',
	'uid',
	'name'
];

export default function AdminPage() {
	const navigate = useNavigate();
	const [mounted, setMounted] = useState(false);

	const user = userHook();

	const [activeTab, setActiveTab] = useState(0);
	const [items, setItems] = useState([]);

	const [queryFilters, setQueryFilters] = useState({
		limit: 20,
		filter: '',
		sorting: {
			column: defaultTabSorting[0],
			direction: 'asc'
		},
		page: 1,
	});

	const [total, setTotal] = useState(0);
	const [system, setSystem] = useState({});

	const [userRefForBenefits, setUserRefForBenefits] = useState(null);
	const [openBenefitsModal, setOpenBenefitsModal] = useState(false);


	const getItems = baseMutationHook({
		apiReq: async (newFilters) => {
			let newQueryFilters = applyQueryFilters(newFilters);

			let defaultQuery = {
				params:
				{
					limit: newQueryFilters.limit,
					page: newQueryFilters.page,
					filter: newQueryFilters.filter,
					sortby: newQueryFilters.sorting.column,
					sortdir: newQueryFilters.sorting.direction
				}
			};

			switch (activeTab) {
				case 0:
					return await api.get('users', defaultQuery);
				case 1:
					return await api.get('devices', defaultQuery);
				case 2:
					return await api.get('gateways', defaultQuery);
				case 3:
					return await api.get('organizations', defaultQuery);
				case 4:
					return await api.get('organizations/owners');
				case 7:
					return await api.get('system');
				default:
					break;
			}
		},
		onSuccess: async (data) => {
			if (activeTab === 7) {
				setSystem(data);
			}
			else if (activeTab === 3) {
				let projects = data.results;
				for (let org of projects) {
					org.owner = org.members.find((member) => {
						return member.role === 'owner';
					}).user;
				}

				setTotal(data.total);
				setItems(projects);
			}
			else {
				setTotal(data.total);
				setItems(data.results);
			}
		}
	});

	useEffect(() => {
		const retrieveData = async () => {
			await getItems.mutateAsync();
		};

		retrieveData();
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted) {
			getItems.mutate({ filter: queryFilters.filter });
		}

	}, [queryFilters.filter]);

	useEffect(() => {
		if (mounted) {
			getItems.mutate();
		}
	}, [activeTab]);

	const saveBenefits = baseMutationHook({
		apiReq: async ({ state, endDate, notes, credits }) => {
			return await api.put('users/' + userRefForBenefits.id + '/subscriptions', { state, endDate, notes, credits });
		},
		onSuccess: () => {
			getItems.mutate();
			onBenefitsClose();
		}
	});

	function applyQueryFilters(newFilters, excludeSearch = true) {
		let newQueryFilters = Object.assign(clone(queryFilters), newFilters);

		if (excludeSearch)
			newQueryFilters.filter = queryFilters.filter;

		setQueryFilters(newQueryFilters);
		return newQueryFilters;
	}

	function onSortClick(column) {
		let aSorting = { column, direction: 'asc' };

		// If same column, flip direction
		if (queryFilters.sorting.column === column) {
			aSorting.direction = aSorting.direction == 'asc' ? 'desc' : 'asc';
		}

		getItems.mutate({ page: 1, sorting: aSorting });
	}

	function getSortState(column) {
		const { sorting } = queryFilters;
		if (sorting.column == column) {
			return sorting.direction == 'asc' ? 'ascending' : 'descending';
		}
	}

	function getEditSubButtonColor(subscription) {
		let buttonColor = 'green';
		if (isProjectSubExpired(subscription)) {
			buttonColor = 'red';
		}
		else if (subscription.state === 'notified') {
			buttonColor = 'purple';
		}
		return buttonColor;
	}

	async function openEditUserBenefitsModal(userRef) {
		setUserRefForBenefits(userRef);
		setOpenBenefitsModal(true);
	}

	function onLimitChange(event, data) {
		getItems.mutate({ limit: data.value });
	}

	async function onFilterChange(event) {
		setInnerState(queryFilters, setQueryFilters, {
			filter: event.target.value
		});
	}

	function onBenefitsClose() {
		setOpenBenefitsModal(false);
		setUserRefForBenefits(null);
	}

	function renderPagination(pageDisplayLimit) {
		let pageCount = Math.ceil(total / queryFilters.limit);

		let firstDisplayedPage = 1;
		let lastDisplayedPage = pageCount;

		if (pageDisplayLimit) {
			firstDisplayedPage = Math.max(1, Math.round(queryFilters.page - pageDisplayLimit / 2));
			lastDisplayedPage = Math.min(pageCount, firstDisplayedPage + pageDisplayLimit - 1);
		}

		let buttons = [];
		for (let i = firstDisplayedPage; i <= lastDisplayedPage; i++) {
			buttons.push(<Menu.Item key={i} content={i.toString()} active={queryFilters.page === i} onClick={() => getItems.mutate({ page: i })} />);
		}

		return (
			<Menu pagination>
				<Menu.Item content='<<' disabled={queryFilters.page === 1} onClick={() => getItems.mutate({ page: 1 })} />
				<Menu.Item content='<' disabled={queryFilters.page === 1} onClick={() => getItems.mutate({ page: queryFilters.page - 1 })} />
				{firstDisplayedPage > 1 ? <Menu.Item disabled>...</Menu.Item> : null}
				{buttons}
				{lastDisplayedPage < pageCount ? <Menu.Item disabled>...</Menu.Item> : null}
				<Menu.Item content='>' disabled={queryFilters.page === pageCount} onClick={() => getItems.mutate({ page: queryFilters.page + 1 })} />
				<Menu.Item content='>>' disabled={queryFilters.page === pageCount} onClick={() => getItems.mutate({ page: pageCount })} />
			</Menu>
		);
	}

	function renderUsersPane() {
		const users = items.map((aUser) => {
			let isSelf = aUser && aUser.id === user.data.id;
			return <Table.Row key={aUser.id}>
				<Table.Cell>{aUser.firstname + ' ' + aUser.lastname}</Table.Cell>
				<Table.Cell>{aUser.role}</Table.Cell>
				<Table.Cell>{aUser.email}</Table.Cell>
				<Table.Cell minWidth={768}>{aUser.lastLogin ? moment(aUser.lastLogin).format('MMMM Do YYYY, HH:mm:ss') : ''}</Table.Cell>
				<Table.Cell collapsing>
					{
						isSelf ?
							<Label color='green'>It&apos;s you!</Label> :
							<Button basic circular={true} size='small' icon='spy' content='Impersonate' onClick={() => impersonate(aUser.id, navigate)} data-cy={'impersonate' + removeSpecialCharacters(aUser.email)} />
					}
				</Table.Cell>
				<Table.Cell>
					<Button content="Edit" color={getEditSubButtonColor(aUser.subscription)} onClick={() => openEditUserBenefitsModal(aUser)} data-cy={'editSubscription' + removeSpecialCharacters(aUser.email)} />
				</Table.Cell>
			</Table.Row>;
		});

		return (
			<Tab.Pane>
				<Grid stackable>
					<Grid.Column computer={4}>
						<Dropdown
							fluid
							labeled
							button
							text={'Show ' + queryFilters.limit + ' per page'}
							className='icon'
							value={queryFilters.limit}
							onChange={onLimitChange}
							options={availableLimits} />
					</Grid.Column>
					<Grid.Column computer={8}>
						<Input
							fluid
							label='Filter'
							placeholder='Name, Email or Role'
							value={queryFilters.filter}
							onChange={onFilterChange}
							data-cy='search'
						/>
					</Grid.Column>
					<Grid.Column computer={4}>
						<Button fluid basic circular={true} icon='refresh' content='Refresh' labelPosition='left' onClick={getItems.mutate} />
					</Grid.Column>
					<Grid.Column width={16}>
						{
							openBenefitsModal &&
							<EditUserBenefitsModal
								open={openBenefitsModal}
								onClose={onBenefitsClose}
								user={userRefForBenefits}
								onSave={saveBenefits.mutate}
							/>
						}
						{getItems.isLoading ? <Loader active inline='centered' /> :
							<Table sortable>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell onClick={() => onSortClick('firstname')}
											sorted={getSortState('firstname')}
										>Name
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('role')}
											sorted={getSortState('role')}
										>Role
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('email')}
											sorted={getSortState('email')}

										>Email
										</Table.HeaderCell>

										<Table.HeaderCell onClick={() => onSortClick('lastLogin')}
											sorted={getSortState('lastLogin')}
											minWidth={768}
										>Last Login
										</Table.HeaderCell>

										<Table.HeaderCell>Impersonate</Table.HeaderCell>
										<Table.HeaderCell style={{ 'minWidth': '120px' }}>Benefits</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{users}
								</Table.Body>
								<Table.Footer>
									<Table.Row>
										<Table.HeaderCell colSpan='4' textAlign='center'>
											{renderPagination(10)}
										</Table.HeaderCell>
										<Table.HeaderCell>
										</Table.HeaderCell>
									</Table.Row>
								</Table.Footer>
							</Table>
						}
					</Grid.Column>
				</Grid>
			</Tab.Pane>
		);
	}

	function renderDevicesPane() {
		const devices = items.map((device) => {
			return <Table.Row key={device.id}>
				<Table.Cell>{device.uid}</Table.Cell>
				<Table.Cell >{device.type}</Table.Cell>
				<Table.Cell>{device.source}</Table.Cell>
				<Table.Cell minWidth={768}>{moment(device.updated).format('MMMM Do YYYY, HH:mm:ss')}</Table.Cell>
				<Table.Cell collapsing>
					<Button as={Link} to={'/devices/' + 'null' + '/' + device.id} basic circular={true} size='small' icon='eye' content='View' />
				</Table.Cell>
			</Table.Row>;
		});

		return (
			<Tab.Pane>
				<Grid stackable>
					<Grid.Column computer={4}>
						<Dropdown
							fluid
							labeled
							button
							text={'Show ' + queryFilters.limit + ' per page'}
							className='icon'
							value={queryFilters.limit}
							onChange={onLimitChange}
							options={availableLimits} />
					</Grid.Column>
					<Grid.Column computer={8}>
						<Input
							fluid
							label='Filter'
							placeholder='UID or Type'
							value={queryFilters.filter}
							onChange={onFilterChange} />
					</Grid.Column>
					<Grid.Column computer={4}>
						<Button fluid basic circular={true} icon='refresh' content='Refresh' labelPosition='left' onClick={getItems.mutate} />
					</Grid.Column>
					<Grid.Column width={16}>
						{getItems.isLoading ? <Loader active inline='centered' /> :
							<Table sortable>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell onClick={() => onSortClick('uid')}
											sorted={getSortState('uid')}
										>UID
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('type')}
											sorted={getSortState('type')}
										>Type
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('source')}
											sorted={getSortState('source')}
										>Source
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('updated')}
											sorted={getSortState('updated')}
											minWidth={768}
										>Last Update
										</Table.HeaderCell>
										<Table.HeaderCell>Actions</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{devices}
								</Table.Body>
								<Table.Footer>
									<Table.Row>
										<Table.HeaderCell colSpan='4' textAlign='center'>
											{renderPagination(10)}
										</Table.HeaderCell>
									</Table.Row>
								</Table.Footer>
							</Table>
						}
					</Grid.Column>
				</Grid>
			</Tab.Pane>
		);
	}

	function renderGatewaysPane() {
		const gateways = items.map((gateway) => {
			return <Table.Row key={gateway.id}>
				<Table.Cell>{gateway.uid}</Table.Cell>
				<Table.Cell>{gateway.type}</Table.Cell>
				<Table.Cell minWidth={768}>{moment(gateway.updated).format('MMMM Do YYYY, HH:mm:ss')}</Table.Cell>
				<Table.Cell collapsing>
					<Button as={Link} to={'/gateways/' + 'null' + '/' + gateway.id} basic circular={true} size='small' icon='eye' content='View' />
				</Table.Cell>
			</Table.Row>;
		});

		return (
			<Tab.Pane>
				<Grid stackable>
					<Grid.Column computer={4}>
						<Dropdown
							fluid
							labeled
							button
							text={'Show ' + queryFilters.limit + ' per page'}
							className='icon'
							value={queryFilters.limit}
							onChange={onLimitChange}
							options={availableLimits} />
					</Grid.Column>
					<Grid.Column computer={8}>
						<Input
							fluid
							label='Filter'
							placeholder='UID or Type'
							value={queryFilters.filter}
							onChange={onFilterChange} />
					</Grid.Column>
					<Grid.Column computer={4}>
						<Button fluid basic circular={true} icon='refresh' content='Refresh' labelPosition='left' onClick={getItems.mutate} />
					</Grid.Column>
					<Grid.Column width={16}>
						{getItems.isLoading ? <Loader active inline='centered' /> :
							<Table sortable>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell onClick={() => onSortClick('uid')}
											sorted={getSortState('uid')}
										>UID
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('type')}
											sorted={getSortState('type')}
										>Type
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('updated')}
											sorted={getSortState('updated')}
											minWidth={768}
										>Last Update
										</Table.HeaderCell>
										<Table.HeaderCell>Actions</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{gateways}
								</Table.Body>
								<Table.Footer>
									<Table.Row>
										<Table.HeaderCell colSpan='4' textAlign='center'>
											{renderPagination(10)}
										</Table.HeaderCell>
									</Table.Row>
								</Table.Footer>
							</Table>
						}
					</Grid.Column>
				</Grid>
			</Tab.Pane>
		);
	}

	function renderProjectsPane() {
		const projects = items.map((org) => {
			return <Table.Row key={org.id}>
				<Table.Cell>{org.name}</Table.Cell>
				<Table.Cell>{org.members.length}</Table.Cell>
				<Table.Cell minWidth={360}>{org.owner ? org.owner.firstname + ' ' + org.owner.lastname : ''}</Table.Cell>
				<Table.Cell>{moment(org.createdAt).format('MMMM Do YYYY, HH:mm:ss')}</Table.Cell>
				<Table.Cell collapsing>
					<Button basic circular={true} size='small' icon='eye' content='View' onClick={() => superViewProject(org.id, user.data.id, navigate)} />
				</Table.Cell>
			</Table.Row>;
		});

		return (
			<Tab.Pane loading={getItems.isLoading}>
				<Grid stackable>
					<Grid.Column computer={4}>
						<Dropdown
							fluid
							labeled
							button
							text={'Show ' + queryFilters.limit + ' per page'}
							className='icon'
							value={queryFilters.limit}
							onChange={onLimitChange}
							options={availableLimits} />
					</Grid.Column>
					<Grid.Column computer={8}>
						<Input
							fluid
							label='Filter'
							placeholder='Name'
							value={queryFilters.filter}
							onChange={onFilterChange} />
					</Grid.Column>
					<Grid.Column computer={4}>
						<Button fluid basic circular={true} icon='refresh' content='Refresh' labelPosition='left' onClick={getItems.mutate} />
					</Grid.Column>
					<Grid.Column width={16}>
						{getItems.isLoading ? <Loader active inline='centered' /> :
							<Table sortable>
								<Table.Header>
									<Table.Row>
										<Table.HeaderCell onClick={() => onSortClick('name')}
											sorted={getSortState('name')}
										>Name
										</Table.HeaderCell>
										<Table.HeaderCell
										>Members
										</Table.HeaderCell>
										<Table.HeaderCell
											minWidth={360}
										>Owner
										</Table.HeaderCell>
										<Table.HeaderCell onClick={() => onSortClick('createdAt')}
											sorted={getSortState('createdAt')}
										>Created
										</Table.HeaderCell>
										<Table.HeaderCell>Actions</Table.HeaderCell>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{projects}
								</Table.Body>
								<Table.Footer>
									<Table.Row>
										<Table.HeaderCell colSpan='5' textAlign='center'>
											{renderPagination(10)}
										</Table.HeaderCell>
									</Table.Row>
								</Table.Footer>
							</Table>
						}
					</Grid.Column>
				</Grid>
			</Tab.Pane>
		);
	}

	function renderOwnersPane() {

	}

	function renderAnnouncementPane() {

	}

	function renderGeneralSettings() {

	}

	function renderSystemPane() {

	}

	const panes = [
		{ menuItem: 'Users', render: renderUsersPane },
		{ menuItem: 'Devices', render: renderDevicesPane },
		{ menuItem: 'Gateways', render: renderGatewaysPane },
		{ menuItem: 'Projects', render: renderProjectsPane },
		{ menuItem: 'Owners', render: renderOwnersPane },
		{ menuItem: 'Announcements', render: renderAnnouncementPane },
		{ menuItem: 'General Settings', render: renderGeneralSettings },
		{ menuItem: 'System', render: renderSystemPane }
	];

	let isMobile = global.innerWidth < 640;
	let style = isMobile ? { maxWidth: global.innerWidth, overflow: 'scroll' } : null;

	const renderedPage = (
		<Tab activeIndex={activeTab} style={style} menu={{ secondary: true, pointing: true }} panes={panes}
			onTabChange={(event, data) => {
				if (activeTab !== data.activeIndex) {
					setItems([]);
					setActiveTab(data.activeIndex);
					setQueryFilters((prevState) => {
						prevState.page = 1;
						prevState.sorting = {
							column: defaultTabSorting[data.activeIndex],
							direction: 'asc'
						};
						prevState.filter = '';

						return ({ ...prevState });
					});
				}
			}} />
	);

	return (
		<PageBase title='Admin' page={renderedPage} />
	);
}
