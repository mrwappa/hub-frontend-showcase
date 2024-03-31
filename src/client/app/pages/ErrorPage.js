import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Image, Button, Message, Segment } from 'semantic-ui-react';


export default function ErrorPage() {
	const navigate = useNavigate();

	function backToHub() {
		navigate('../overview');
	}
	return (
		<Container>
			<Segment textAlign="center">
				<Image centered src={require('../../images/sensefarm_logo.svg')} style={{ padding: 30 }} href='http://sensefarm.com' />
				<Message error content={"Oops! Something went wrong. Either you don't have access to the resource or it doesn't exist anymore."} />
				<Button onClick={backToHub} content="Back to the Hub" color='green' />
			</Segment>
		</Container>
	);
}