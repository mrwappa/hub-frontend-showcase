import React, { useState } from 'react';
import { Segment, Form, Button, Message, List, Label, Popup, Icon } from 'semantic-ui-react';
import RemoveAccountModal from '../components/RemoveAccountModal';
import { stripePubKey } from '../config';
import { api } from '../services/ApiService';
import { copyExistingJsonValues, removeSpecialCharacters } from '../services/UtilityService';
import { isProjectSubExpired } from '../services/SubscriptionService';
import { loadStripe } from '@stripe/stripe-js';
import moment from 'moment';
import stripeItems from '../stripeConfig';
import { projectsHook, userHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import PageBase from '../components/PageBase';
import { useNavigate } from 'react-router-dom';
import { isApiHookLoading } from '../services/ReactUtilities';
import PhoneInput from 'react-phone-input-2';
import { toastSuccess } from '../services/Toaster';
const stripePromise = loadStripe(stripePubKey);

export default function AccountPage() {

	const navigate = useNavigate();

	const [editedUser, setEditedUser] = useState({
		firstname: '',
		lastname: '',
		email: '',
		phone: '',
	});

	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		password1: '',
		password2: ''
	});

	const [projectsOwnedByUser, setProjectsOwnedByUser] = useState([]);
	const [openAccModal, setOpenAccModal] = useState(false);

	const user = userHook({
		onSuccess: (data) => {
			copyExistingJsonValues(editedUser, data);
			setEditedUser(editedUser);
		}
	});

	const projects = projectsHook();

	const loading = isApiHookLoading(user, projects);

	const saveUser = baseMutationHook({
		apiReq: async () => {
			return await api.put('users/' + user.data.id, editedUser);
		},
		onSuccess: () => {
			user.refetch();
		}
	});

	const changeMailChatNotifying = baseMutationHook({
		apiReq: async () => {
			return await api.put('users/' + user.data.id, { recieveChatMailNotices: !user.data.chatMailNotifier.recieveNotifications });
		},
		onSuccess: () => {
			user.refetch();
		}
	});

	const changePassword = baseMutationHook({
		apiReq: async () => {
			return await api.put('users/' + user.data.id, {
				currentPassword: passwordForm.currentPassword,
				password: passwordForm.password1
			});
		},
		onSuccess: () => {
			setPasswordForm({
				currentPassword: '',
				password1: '',
				password2: ''
			});

			toastSuccess('Password Successfully Changed');
		}
	});

	async function redirectToCheckout({ sessionId }) {
		(await stripePromise).redirectToCheckout({
			sessionId: sessionId
		});
	}

	const startSubPaymentProcess = baseMutationHook({
		apiReq: async () => {
			return await api.post('stripe/create-session', { priceId: stripeItems.subPrice });
		},
		onSuccess: async (data) => {
			redirectToCheckout(data);
		}
	});

	const startCreditPaymentProcess = baseMutationHook({
		apiReq: async (priceId) => {
			return await api.post('stripe/create-session', { priceId });
		},
		onSuccess: async (data) => {
			redirectToCheckout(data);
		}
	});


	function onPhoneChange(number) {
		editedUser.phone = '+' + number;
		setEditedUser({ ...editedUser });
	}

	function onFieldChange(field, event) {
		editedUser[field] = event.target.value;
		setEditedUser({ ...editedUser });
	}

	function onPasswordFieldChange(field, event) {
		passwordForm[field] = event.target.value;
		setPasswordForm({ ...passwordForm });
	}

	function onClickDeleteAccount() {
		let ownedProjects = projects.data.filter((project) => {
			if (project.members.length === 1) {
				return false;
			}

			let owner = project.members.find((member) => {
				return member.role === 'owner';
			});
			return owner.user.id === user.data.id;
		});

		if (ownedProjects.length > 0) {
			setProjectsOwnedByUser(ownedProjects);
			return;
		}

		setOpenAccModal(true);
		setProjectsOwnedByUser([]);
	}

	let ownedProjectsList = projectsOwnedByUser.map((project) => {
		return (
			<List.Item key={project.id}>
				<Button color='black' onClick={() => navigate('../members?project=' + project.id)} data-cy={'project' + removeSpecialCharacters(project.name)}>{project.name}</Button>
			</List.Item>
		);
	});

	const userInformation = (
		<Segment clearing padded>
			<h3 style={{ textAlign: 'center', 'paddingTop': 20 }}>User Information</h3>
			<Form>
				<Form.Group widths='equal'>
					<Form.Input
						label='First name'
						placeholder='First name'
						value={editedUser.firstname}
						onChange={(event) => onFieldChange('firstname', event)}
					/>
					<Form.Input
						label='Last name'
						placeholder='Last name'
						value={editedUser.lastname}
						onChange={(event) => onFieldChange('lastname', event)}
					/>
				</Form.Group>
				<Form.Input
					label='Email'
					icon='at'
					iconPosition='left'
					placeholder='Email'
					type='email'
					value={editedUser.email}
					onChange={(event) => onFieldChange('email', event)}
				/>
				<Form.Field
				>
					<label>Mobile phone number</label>
					<PhoneInput
						country={'se'}
						value={user.data.phone}
						onChange={onPhoneChange}
					/>
				</Form.Field>
				<Form.Field>
					<label>Avatar (gravatar)</label>
					<div className='accountPicture'>
						<img src={user.data.avatar} />
						<a href='https://sv.gravatar.com/emails/' target='_blank' rel='noopener noreferrer'>Change</a>
					</div>
				</Form.Field>
				<Message
					success
					header='User information updated'
					content='Your user information was successfully updated.'
				/>
				<Form.Field>
					<Button
						content='Save'
						loading={saveUser.isLoading}
						positive
						floated='right'
						size='medium'
						onClick={saveUser.mutate}
						type='submit'
					/>
				</Form.Field>
			</Form>
		</Segment>
	);

	let subscriptionSegment;
	const subscription = user.data.subscription;
	if (subscription && subscription.state.match(/date|expired/)) {
		subscriptionSegment = (
			<Segment textAlign='center' clearing padded>
				<h3 style={{ textAlign: 'center', padding: 20 }}>Subscription</h3>
				<Label style={{ marginRight: 10, backgroundColor: subscription.state === 'date' ? '#d0f7d1' : '#ffd4d4' }} size='large'>
					Expiration Date
					<Label.Detail>{moment(subscription.endDate).format('MMMM Do YYYY')}  </Label.Detail>
				</Label>
				{
					isProjectSubExpired(subscription) ?
						<Button color='blue' loading={startSubPaymentProcess.isLoading} content='Renew Subscription' onClick={startSubPaymentProcess.mutate} />
						:
						<Button color='blue' loading={startSubPaymentProcess.isLoading} content='Extend Subscription' onClick={startSubPaymentProcess.mutate} />
				}
			</Segment>
		);
	}


	let credits = user.data.credits;
	let creditsSegment;

	if (credits) {
		creditsSegment = (
			<Segment textAlign='center' clearing padded loading={!credits && credits !== 0}>
				<h3 style={{ textAlign: 'center', padding: 20 }}>
					Credits
					<Popup
						trigger={
							<Icon size='small' style={{ marginLeft: 5 }} name='question circle outline' />
						}
						content={
							'Credits are used when a Call or SMS Action/Alarm is triggered inside a project that you are the owner of. An SMS costs 10 Credits and a Call costs 20.'
						}
					/>
					<br />
					<Label style={{ marginTop: 10, marginRight: 10, backgroundColor: credits >= 100 ? '#d0f7d1' : '#ffd4d4' }} size='large'>
						Your Credits
						<Label.Detail>
							<b>{credits}</b>
							<Popup
								trigger={
									<Icon style={{ marginLeft: 5 }} size='small' name='exclamation circle' />
								}
								content={
									'If you have less than 100 Credits at the start of the month, your Credits will be set to 100.'
								}
							/>
						</Label.Detail>
					</Label>
					<Popup
						flowing
						on='click'
						pinned
						trigger={
							<Button color='blue' loading={startCreditPaymentProcess.isLoading} content='Add Credits' />
						}
						content={
							<Button.Group>
								<Button
									color='blue'
									content='500'
									onClick={() => startCreditPaymentProcess.mutate(stripeItems.credit500Price)}
								/>
								<Button.Or text='' />
								<Button
									color='blue'
									content='1000'
									onClick={() => startCreditPaymentProcess.mutate(stripeItems.credit1000Price)}
								/>
								<Button.Or text='' />
								<Button
									color='blue'
									content='2000'
									onClick={() => startCreditPaymentProcess.mutate(stripeItems.credit2000Price)}
								/>
							</Button.Group>
						}
					/>
				</h3>
			</Segment>
		);
	}


	const changePassWordSegment = (
		<Segment clearing padded>
			<h3 style={{ textAlign: 'center', padding: 20 }}>Change password</h3>
			<Form>
				<Form.Input
					icon='lock'
					iconPosition='left'
					label='Current password'
					placeholder='Password'
					type='password'
					value={passwordForm.currentPassword}
					onChange={(event) => onPasswordFieldChange('currentPassword', event)}
				/>
				<Form.Input
					icon='lock'
					iconPosition='left'
					label='New password'
					placeholder='New password'
					type='password'
					value={passwordForm.password1}
					onChange={(event) => onPasswordFieldChange('password1', event)}
				/>
				<Form.Input
					icon='lock'
					iconPosition='left'
					label='Repeat password'
					placeholder='Repeat new password'
					type='password'
					value={passwordForm.password2}
					onChange={(event) => onPasswordFieldChange('password2', event)}
				/>
				<Form.Field>
					<Button loading={changePassword.isLoading} onClick={changePassword.mutate} positive floated='right' size='medium' type='submit'>Save</Button>
				</Form.Field>
			</Form>
		</Segment>
	);

	const page = (
		<>
			{userInformation}
			{subscriptionSegment}
			{creditsSegment}
			{changePassWordSegment}
			<Segment loading={changeMailChatNotifying.isLoading} clearing padded>
				<h3 style={{ textAlign: 'center', padding: 20 }}>Notifications</h3>
				<Form>
					<Form.Checkbox label="Recieve Mail Notifications from Chat" checked={user.data.chatMailNotifier && user.data.chatMailNotifier.recieveNotifications} onChange={changeMailChatNotifying.mutate} />
				</Form>
			</Segment>

			<Segment textAlign='center' padded>
				<Button onClick={onClickDeleteAccount} color='red' data-cy='delete'>Delete account</Button>
				<RemoveAccountModal
					user={user.data}
					open={openAccModal}
					onClose={() => setOpenAccModal(false)}
				/>
				{ownedProjectsList.length > 0 ?
					<Message>
						<Segment>
							{"You need to either remove the projects that you own or assign someone else to owner before removing your account. These are your owned projects :"}
						</Segment>
						<List>
							{ownedProjectsList}
						</List>
					</Message> :
					null}
			</Segment>
		</>
	);

	return (<PageBase title='Account' page={page} loading={loading} /*TODO:fullsize?*/ />);
}