import React, { useState } from 'react';
import { Container, Grid, Form, Input, Button, Image, Message } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { api, initUser, isAuthenticated } from '../services/ApiService';
import { alreadyLoggedInRedirectHook } from '../hooks/UtilityHooks';

import PageBase from '../components/PageBase';
import { redirectToOverview } from '../services/UtilityService';
import { baseMutationHook } from '../hooks/ApiPostHooks';


export default function LoginPage() {

	const [form, setForm] = useState({
		email: '',
		password: ''
	});

	const navigate = useNavigate();
	let page;

	alreadyLoggedInRedirectHook();

	const emailChange = (event) => {
		form.email = event.target.value;
		setForm({ ...form });
	};

	const passwordChange = (event) => {
		form.password = event.target.value;
		setForm({ ...form });
	};

	const signIn = baseMutationHook({
		apiReq: async () => {
			return await api.post('login', form);
		},
		onSuccess: async (data) => {
			await initUser(data.token);
			redirectToOverview(navigate);
		}
	});

	const createAccountClick = () => {
		navigate('/register');
	};

	const dismissErrorMessage = () => {
		setForm({ errorMessage: undefined });
	};

	if (isAuthenticated()) {
		page = <></>;
	}
	else {
		page = (
			<Container className='fullHeight' style={{ paddingTop: '10%' }}>
				{/*<Announcements/>  TODO: ADD Announcements*/}
				<Grid className='fullHeight' verticalAlign='middle' centered>
					<Grid.Row>
						<Grid.Column computer={6} mobile={14}>
							<Image centered src={require('images/sensefarm_logo.svg')} style={{ padding: 10 }} />
							<Form onSubmit={signIn.mutate}>
								<Form.Field>
									<Input icon='at' iconPosition='left' placeholder='Email' type='email' value={form.email} onChange={emailChange} data-cy='email' />
								</Form.Field>
								<Form.Field>
									<Input icon='lock' iconPosition='left' placeholder='Password' type='password' value={form.password} onChange={passwordChange} data-cy='password' />
								</Form.Field>
								<Form.Field>
									<Button loading={signIn.isLoading} disabled={signIn.isLoading} fluid positive size='big' type='submit' data-cy='submit'>Sign In</Button>
									<p style={{ textAlign: 'center', marginTop: '1em' }}><Button color='blue' size='medium' onClick={createAccountClick} >Sign Up!</Button></p>
								</Form.Field>
								<div style={{ minHeight: '4em' }}>
									<Message negative hidden={!form.errorMessage} onDismiss={dismissErrorMessage}>{form.errorMessage}</Message>
								</div>
								<Form.Field>
									<p style={{ textAlign: 'center' }}><Link to='/forgot'>I forgot my password</Link></p>
									<p style={{ textAlign: 'center' }}>
									</p>
								</Form.Field>
							</Form>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Container>
		);
	}

	return (
		<PageBase blankPage={true} page={page} />
	);

}