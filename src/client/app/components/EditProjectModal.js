import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'semantic-ui-react';

export default function EditProjectModal({
	open = () => {},
	onClose = () => {},
	onSave = () => {},
	...props
}) {
	const [name, setName] = useState();

	useEffect(() => {
		setName(props.name);
	}, [props.name]);
	
	return (
		<Modal open={open} closeIcon onClose={onClose} centered={true}>
			<Modal.Header>Edit Name</Modal.Header>
			<Modal.Content>
				<Input fluid type='text' label='Name' value={name} onChange={(event) => setName(event.target.value)} />
			</Modal.Content>
			<Modal.Actions>
				<Button content="Close" onClick={onClose} />
				<Button content="Save" onClick={() => onSave(name)} color='green' />
			</Modal.Actions>
		</Modal>
	);
}

EditProjectModal.defaultProps = {
	counter: 0
};