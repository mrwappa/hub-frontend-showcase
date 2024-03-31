import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Input, Header, Segment, TextArea, Grid, Divider } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';

export default function EditUserBenefitsModal({
	user,
	open,
	onClose,
	onSave
}) {

	const [state, setState] = useState(user.subscription.state);
	const [credits, setCredits] = useState(user.credits);
	const [endDate, setEndDate] = useState(user.subscription.endDate ? new Date(user.subscription.endDate) : null);

	const [notes, setNotes] = useState(user.subscription.notes);
	const [originalNotes, setOriginalNotes] = useState('');

	const [logs, setLogs] = useState();

	function onClickSave() {
		let aEndDate = (state !== 'expired' && state !== 'noDate') ? endDate : null;
		let aNotes = (notes !== originalNotes) ? notes : null;
		let aCredits = (credits !== user.credits) ? credits : null;

		onSave({ state, endDate: aEndDate, notes: aNotes, credits: aCredits });
	}

	useEffect(() => {
		setState(user.subscription.state);
		setCredits(user.credits);
		setEndDate(user.subscription.endDate ? new Date(user.subscription.endDate) : null);
		setOriginalNotes(user.subscription.notes);
		setNotes(user.subscription.notes);
		setLogs(user.subscription.logs);
	}, [user]);

	function onStateChange(event, { value }) {
		let aEndDate = endDate || new Date();
		setState(value);
		setEndDate(aEndDate);
	}

	function onNotesChange(event, { value }) {
		setNotes(value);
	}

	function onCreditsChanged(event, { value }) {
		setCredits(value);
	}

	if (user) {
		return (
			<Modal open={open} closeIcon onClose={onClose} centered={true}>
				<Modal.Header content={"Edit " + user.firstname + " " + user.lastname + "'s" + " Benefits"} />
				<Modal.Content>
					<Segment>
						<Grid columns={2} stackable>
							<Divider vertical></Divider>
							<Grid.Row>
								<Grid.Column>
									<Header>
										State
									</Header>
									<Form>
										<Form.Radio
											label='No End Date'
											value='noDate'
											checked={state === 'noDate'}
											onChange={onStateChange}
											data-cy='noEndDate'
										/>
										<Form.Radio
											label='End Date'
											value='date'
											checked={state === 'date'}
											onChange={onStateChange}
											data-cy='endDate'
										/>
										<Form.Radio
											label='Notified'
											value='notified'
											checked={state === 'notified'}
											onChange={onStateChange}
											data-cy='notified'
										/>
										<Form.Radio
											label='Expired'
											value='expired'
											checked={state === 'expired'}
											onChange={onStateChange}
											data-cy='expired'
										/>
										<DatePicker
											disabled={state.match(/noDate|expired/) !== null}
											floated='right'
											showTimeSelect
											timeFormat="HH:mm"
											customInput={<Input fluid label='End Date' />}
											dateFormat="yyyy-MM-dd HH:mm"
											selected={endDate}
											onChange={(aEndDate) => setEndDate(aEndDate)}
										/>
									</Form>
								</Grid.Column>
								<Grid.Column>
									<Header>
										Notes
									</Header>
									<Form style={{ height: '90%' }}>
										<TextArea value={notes} style={{ height: '90%' }} onChange={onNotesChange} />
									</Form>
								</Grid.Column>
							</Grid.Row>
						</Grid>
					</Segment>
					<Segment>
						<Header>
							Credits
						</Header>
						<Input type='number' value={credits} onChange={onCreditsChanged} />
					</Segment>
					<Segment>
						<Header>
							Logs
						</Header>
						<Form style={{ height: 200 }}>
							<TextArea disabled value={logs} style={{ height: 200 }} />
						</Form>
					</Segment>
				</Modal.Content>
				<Modal.Actions>
					<Button content="Cancel" float='right' onClick={onClose} />
					<Button color="green" content="Save" float='right' onClick={onClickSave} data-cy='submit' />
				</Modal.Actions>
			</Modal>
		);
	}
	else {
		return null;
	}
}