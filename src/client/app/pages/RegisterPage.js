import React, { useState } from 'react';
import { Container, Grid, Form, Button, Message, Checkbox } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { alreadyLoggedInRedirectHook } from '../hooks/UtilityHooks';
import { setInnerState } from '../services/ReactUtilities';
import PhoneInput from 'react-phone-input-2';
import { api } from 'services/ApiService';

const defaultState = {
	firstname: '',
	lastname: '',
	email: '',
	phone: '+46',
	password: '',
	password2: '',
	errorFields: [],
	success: false,
	acceptTOS: false,
	loading: false
};

export default function RegisterPage() {

	const [state, setState] = useState(defaultState);

	alreadyLoggedInRedirectHook();

	const toggleTOS = () => {
		state.acceptTOS = !state.acceptTOS;
		state.errorFields = state.errorFields.filter((f) => f !== 'tos');

		if (state.errorFields.length === 0) state.errorMessage = undefined;
		setState({ ...state });
	};

	const onFieldChange = (field, event) => {
		state.errorFields = state.errorFields.filter((f) => f !== field);
		if (state.errorFields.length === 0) state.errorMessage = undefined;

		state[field] = event.target.value;
		setState({ ...state });
	};

	const onPhoneChange = (number) => {
		state.phone = number.replace(/[ ()-]/g, '');
		state.errorFields = state.errorFields.filter((f) => f !== 'phone');

		if (state.errorFields.length === 0) state.errorMessage = undefined;
		setState({ ...state });
	};

	const registerClick = async () => {

		if (!/^[^{}()[\]<>\\/]+$/.test(state.firstname)) {
			setInnerState(state, setState, {
				errorFields: ['firstname'], errorMessage: 'Please enter a valid first name.'
			});
			return;
		}
		else if (!/^[^{}()[\]<>\\/]+$/.test(state.lastname)) {
			setInnerState(state, setState, {
				errorFields: ['lastname'], errorMessage: 'Please enter a valid last name.'
			});
			return;
		}
		else if (state.email.length < 1) {
			setInnerState(state, setState, {
				errorFields: ['email'], errorMessage: 'Please enter a valid email-address.'
			});
			return;
		}
		else if (!/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/.test(state.phone)) {
			setInnerState(state, setState, {
				errorFields: ['phone'], errorMessage: 'Please enter a valid phone number.'
			});
			return;
		}
		else if (state.password.length < 8) {
			setInnerState(state, setState, {
				errorFields: ['password'], errorMessage: 'Please enter a password with a minimum length of 8 characters.'
			});
			return;
		}
		else if (state.password !== state.password2) {
			setInnerState(state, setState, {
				errorFields: ['password', 'password2'], errorMessage: 'Password fields do not match.'
			});
			return;
		}
		else if (!state.acceptTOS) {
			setInnerState(state, setState, {
				errorFields: ['tos'], errorMessage: 'You need to accept the Terms of Service.'
			});
			return;
		}

		setState({ errorMessage: undefined, errorFields: [], loading: true });

		let result = await api.post('register', {
			firstname: state.firstname,
			lastname: state.lastname,
			email: state.email,
			phone: '+' + state.phone,
			password: state.password
		});

		if (result.status === 201) {
			setInnerState(state, setState, {
				success: true, loading: false
			});
		}
		else if (result.status === 400 && result.data.details === 'Invalid phone number') {
			setInnerState(state, setState, {
				errorMessage: 'Invalid phone number, needs to be a valid mobile number.', loading: false
			});
		}
		else if (result.status === 409) {
			setInnerState(state, setState, {
				errorMessage: 'A user with this email or phone number is already registered.', loading: false
			});
		}
		else {
			setInnerState(state, setState, {
				errorMessage: 'Unknown error.', loading: false
			});
		}

	};

	const dismissErrorMessage = () => {
		setState({ errorMessage: undefined, errorFields: [] });
	};

	const createLinkFromEmail = (email) => {
		return 'https://' + email.substring(email.indexOf('@') + 1, email.length);
	};

	const clickEmail = () => {
		global.open(createLinkFromEmail(state.email));
	};

	return (
		<Container className='fullHeight' style={{ 'overflow': 'auto', maxHeight: global.window.innerHeight }}>
			<Grid className='fullHeight' verticalAlign='middle' centered>
				<Grid.Row>
					<Grid.Column largeScreen={6} computer={8} mobile={14}>
						<h1 style={{ textAlign: 'center', padding: 20 }}>{state.success ? "Check your email!" : "Register Account"}</h1>
						<Form onSubmit={registerClick} hidden={state.success} error={state.errorMessage !== undefined}>
							<Form.Group widths='equal'>
								<Form.Input
									error={state.errorFields.includes('firstname')}
									disabled={state.loading}
									label='First name'
									placeholder='First name'
									value={state.firstname}
									onChange={(d) => onFieldChange('firstname', d)}
									data-cy='firstname'
								/>
								<Form.Input
									error={state.errorFields.includes('lastname')}
									disabled={state.loading}
									label='Last name'
									placeholder='Last name'
									value={state.lastname}
									onChange={(d) => onFieldChange('lastname', d)}
									data-cy='lastname'
								/>
							</Form.Group>
							<Form.Input
								error={state.errorFields.includes('email')}
								disabled={state.loading}
								icon='at'
								iconPosition='left'
								type='email'
								label='Email'
								placeholder='Email'
								value={state.email}
								onChange={(d) => onFieldChange('email', d)}
								data-cy='email'
							/>
							<Form.Field error={state.errorFields.includes('phone')} data-cy='phone'>
								<label>Mobile phone number</label>
								<PhoneInput
									country={'se'}
									value={state.phone}
									onChange={onPhoneChange}
								/>
							</Form.Field>
							<p>This number is used to send alarm messages to you. It should preferably be a direct number to you. Alarms can later be set up by yourself or by someone in a project you are part of.</p>
							<Form.Group widths='equal'>
								<Form.Input
									error={state.errorFields.includes('password')}
									disabled={state.loading}
									icon='lock'
									iconPosition='left'
									label='Password'
									placeholder='Password'
									type='password'
									value={state.password}
									onChange={(d) => onFieldChange('password', d)}
									data-cy='password'
								/>
								<Form.Input
									error={state.errorFields.includes('password2')}
									disabled={state.loading}
									icon='lock'
									iconPosition='left'
									label='Repeat password'
									placeholder='Password'
									type='password'
									value={state.password2}
									onChange={(d) => onFieldChange('password2', d)}
									data-cy='password2'
								/>
							</Form.Group>
							<Form.Field>
								<Checkbox
									disabled={state.loading}
									label={<label>Accept the</label>}
									checked={state.acceptTOS}
									onClick={toggleTOS}
									data-cy='acceptTOS' />
								<Link to='/tos' target={PHONEGAP ? '' : '_blank'}>Terms of Service</Link>
							</Form.Field>
							<Form.Field>
								<Button
									fluid
									positive
									size='big'
									type='submit'
									loading={state.loading}
									disabled={state.loading || state.success}
									data-cy='submit'
								>
									Send Verification Email
								</Button>
							</Form.Field>
							<Message
								error
								header='Failed to register account'
								content={state.errorMessage}
								onDismiss={dismissErrorMessage}
							/>
							<Form.Field>
								<p style={{ textAlign: 'center' }}>Already have an account? <Link to='/'>Sign in!</Link></p>
							</Form.Field>
						</Form>
						<Message
							style={{ cursor: 'pointer' }}
							onClick={clickEmail}
							success
							hidden={!state.success}
							content={<p>Please check your email <b>{state.email}</b> for <b>activation link</b>.</p>}
						/>
						{state.success ? <p style={{ textAlign: 'center' }}><Link to='/' data-cy='signIn'>Sign in!</Link></p> : null}
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</Container>
	);
}
