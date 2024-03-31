import React, { useState } from 'react';
import { Segment, Button, Grid, Dropdown, Input, Label, Icon } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import queryString from 'query-string';
import { useNavigate } from 'react-router-dom';


export default function Selector({
	selectedDevice,
	selectedView,
	devices,
	projectId,
	loading,
	from,
	to
}) {

	let navigate = useNavigate();

	function validTimeInterval(from, to) {
		return to > from;
	}

	function onFromTimeChange(date) {
		let unixTime = moment(date).unix();
		if (validTimeInterval(unixTime, Number(to))) {
			navigate('../charts?' + queryString.stringify({ project: projectId, device: selectedView, from: unixTime, to }), { replace: true });
		}
	}

	function onToTimeChange(date) {
		let unixTime = moment(date).unix();
		if (validTimeInterval(Number(from), unixTime)) {
			navigate('../charts?' + queryString.stringify({ project: projectId, device: selectedView, from, to: unixTime }), { replace: true });
		}
	}

	function OnLastPeriodClick(value) {
		let aFromTime = moment().subtract(1, value).unix();
		let aToTime = moment().unix();

		let deviceParam = selectedView === 'all' ? 'all' : selectedDevice;

		navigate('../charts?' + queryString.stringify({ 
			project: projectId, device: deviceParam, from: aFromTime, to: aToTime }), 
			{ replace: true }
		);
	}

	function onSingleAllClick(value) {
		navigate('../charts?' + queryString.stringify({ project: projectId, device: value, from, to }), { replace: true });
	}

	function onDropDownClick(event, data) {
		navigate('../charts?' + queryString.stringify({ project: projectId, device: data.value, from, to }), { replace: true });
	}
	return (
		<div>
			<Segment textAlign='center'>
				<Grid columns={2} stackable>
					<Grid.Row>
						<Grid.Column>
							<Button.Group style={{ marginBottom: '10px' }}>
								<Button disabled={loading} active={selectedView !== 'all'} onClick={() => onSingleAllClick(selectedDevice)}>Single</Button>
								<Button disabled={loading} active={selectedView === 'all'} onClick={() => onSingleAllClick('all')}>All</Button>
							</Button.Group>
						</Grid.Column>
						<Grid.Column>
							<Dropdown placeholder='Select Device'
								fluid
								search
								selection
								value={selectedDevice}
								disabled={selectedView === 'all' || loading}
								options={devices}
								onChange={onDropDownClick}
							/>
						</Grid.Column>
					</Grid.Row>
				</Grid>
				<Grid columns={3} stackable>
					<Grid.Row>
						<Grid.Column style={{ width: '50%' }}>
							<table style={{ width: '100%' }}>
								<tbody>
									<tr>
										<td>
											<DatePicker
												disabled={loading}
												showTimeSelect
												timeFormat="HH:mm"
												dateFormat="yyyy-MM-dd HH:mm"
												customInput={<Input fluid label='From' />}
												selected={moment.unix(from).toDate()}
												onChange={onFromTimeChange}
											/>
										</td>
										<td>
											<DatePicker
												disabled={loading}
												showTimeSelect
												timeFormat="HH:mm"
												dateFormat="yyyy-MM-dd HH:mm"
												customInput={<Input fluid label='To' />}
												selected={moment.unix(to).toDate()}
												onChange={onToTimeChange}
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</Grid.Column>
						<Grid.Column style={{ overflowX: 'auto', width: '49%' }}>
							<Button.Group>
								<Label color='grey' content={<h4><Icon name='calendar' /> Last</h4>} size='large' style={{ paddingRight: 17 }} />
								<Button.Or text='' />
								<Button disabled={loading} onClick={() => OnLastPeriodClick('day')}>Day</Button>
								<Button disabled={loading} onClick={() => OnLastPeriodClick('week')}>Week</Button>
								<Button disabled={loading} onClick={() => OnLastPeriodClick('month')}>Month</Button>
								<Button disabled={loading} onClick={() => OnLastPeriodClick('year')}>Year</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Segment>
		</div>
	);
}