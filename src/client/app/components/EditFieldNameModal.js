import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from 'semantic-ui-react';

export default function EditFieldNameModal({
	onClose = () => { },
	onSave = () => { },
	name,
	identifier,
	open
}) {

	const [newName, setNewName] = useState();

	useEffect(() => {
		if (name) {
			setNewName(name);
		}
	}, [name]);

	function onNameChange(event) {
		setNewName(event.target.value);
	}

	return (
		<Modal open={open && !!newName} closeIcon onClose={onClose} centered={true} >
			<Modal.Header>Edit Name</Modal.Header>

			<Modal.Content>
				<Modal.Description>
					{
						identifier &&
						<div style={{ paddingBottom: '1em' }}>
							<b style={{ opacity: 0.8 }}>Original Name |</b> <b style={{ opacity: 0.6 }}>{identifier}</b>
						</div>
					}
				</Modal.Description>
				<Input fluid type='text' label='Name' value={newName} onChange={onNameChange} />
			</Modal.Content>
			<Modal.Actions>
				<Button content="Close" onClick={onClose} />
				<Button content="Save" color='green' onClick={() => onSave(newName)} />
			</Modal.Actions>
		</Modal>
	);

}