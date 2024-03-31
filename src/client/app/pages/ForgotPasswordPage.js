import React, { useState } from 'react';
import { Container, Grid, Form, Input, Button, Message } from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from 'services/ApiService';
import { alreadyLoggedInRedirectHook } from '../hooks/UtilityHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';

export default function ForgotPasswordPage() {

	alreadyLoggedInRedirectHook();

	const [email, setEmail] = useState('');
	const [success, setSuccess] = useState(false);

	const sendForgotPassword = baseMutationHook({
		apiReq: async () => {
			return await api.put('forgot', { email });
		},
		onSuccess: () => {
			setSuccess(true);
		}
	});

	const loading = sendForgotPassword.isLoading;

	function onEmailChange(event) {
		setEmail(event.target.value);
	}

	function isSendDisabled() {
		return (loading || success || !email);
	}

	return (
		<Container className='fullHeight'>
			<Grid className='fullHeight' verticalAlign='middle' centered>
				<Grid.Row>
					<Grid.Column computer={6} mobile={14}>
						<h1 style={{ textAlign: 'center', padding: 20 }}>Forgot Password</h1>
						<Form onSubmit={sendForgotPassword.mutate}>
							<Form.Field>
								<Input icon='at' iconPosition='left' placeholder='Email' type='email' value={email} onChange={onEmailChange} />
							</Form.Field>
							<Form.Field>
								<Button loading={loading} disabled={isSendDisabled()} fluid positive size='big' type='submit'>Send</Button>
							</Form.Field>
							<div style={{ minHeight: '4em' }}>
								<Message positive hidden={!success}>Please check your email for instructions on how to reset your password.</Message>
							</div>
							<Form.Field>
								<p style={{textAlign: 'center'}}><Link to='/'>Back to login page</Link></p>
							</Form.Field>
						</Form>
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</Container>
	);
}

