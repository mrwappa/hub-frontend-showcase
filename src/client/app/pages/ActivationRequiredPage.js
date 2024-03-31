import React, { useState } from 'react';
import { Grid } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { api } from '../services/ApiService';

export default function ActivationRequiredPage() {
	const [sent, setSent] = useState(false);

	async function resend() {
		if (!sent) {
			await api.get('activate/resend');
			setSent(true);
		}
	}

	return (
		<Grid className='fullHeight' verticalAlign='middle' centered>
			<Grid.Row>
				<Grid.Column>
					<h2 style={{ textAlign: 'center' }}>Activation required!</h2>
					<p style={{ textAlign: 'center' }}><a onClick={resend}>Resend activation email</a> or <Link to='/logout'>Logout</Link></p>
					{sent ? <h2 style={{ textAlign: 'center' }}>Link Sent!</h2> : null}
				</Grid.Column>
			</Grid.Row>
		</Grid>
	);
}
