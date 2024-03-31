import React, { useState } from 'react';
import { Modal, Button, Input } from 'semantic-ui-react';
import { api } from '../services/ApiService';

export default function RemoveAccountModal(props) {

	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(false);//TODO: add loading

	async function deleteButtonClick() {
		setLoading(true);
		let result = await api.delete('users/' + props.userData.id);

		switch (result.status) {
			case 204:
				props.navigate('/');//TODO: logout instead?
				break;
			default:
		}
	}

	function onDeleteTextChange(event) {
		setInputText(event.target.value);
	}

	function renderDeleteButton() {
		return (
			<div>
				<br />
				{
					inputText === 'DELETE' &&
					<Button color='red' onClick={deleteButtonClick} data-cy='submit'> Permanently delete  my account </Button>
				}
			</div>
		);
	}

	return (
		<Modal
			centered={true}
			trigger={props.children}
			closeIcon
			open={props.open}
			onClose={props.onClose}
		>
			<Modal.Header>Delete account</Modal.Header>
			<Modal.Content>
				<Modal.Description>
					<p>This action is not reversible, if you delete you account it can not be restored!</p>
					<p> If you want to delete your account type DELETE in the field below</p>
					<Input
						value={inputText}
						onChange={onDeleteTextChange}
						data-cy='input'
					/>
					{renderDeleteButton()}
				</Modal.Description>
			</Modal.Content>
		</Modal>
	);
}
