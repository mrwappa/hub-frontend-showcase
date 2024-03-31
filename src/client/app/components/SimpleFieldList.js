import React from 'react';
import { Table, Popup, Message } from 'semantic-ui-react';
import { isDataSimple, displaySensor } from 'services/UtilityService';
import moment from 'moment';

export default function SimpleFieldList(props) {

	const { device } = props;
		let fieldRows = [];
		device.data.map((field) => {
			//determinate wether to render sensor or not
			let determinator = (
				device.simpleSensors && device.simpleSensors.length > 0 ?
					device.simpleSensors.includes(field.id)
					:
					isDataSimple(field.type)
			);
			if (determinator) {
				fieldRows.push(
					<Table.Row key={field.identifier + '-row'}>
						<Table.Cell><Popup trigger={<p>{field.name}</p>} content={field.identifier} /></Table.Cell>
						<Table.Cell><Popup trigger={<p>{moment(field.updated).toNow(true)} ago</p>} content={moment(field.updated).format('MMMM Do YYYY, HH:mm:ss')} /></Table.Cell>
						<Table.Cell collapsing>{displaySensor(field)}</Table.Cell>
					</Table.Row>
				);
			}
		});

		let headerStyle = { style: { backgroundColor: '#ffffff' } };
		let mainRender = (
			<div>
				<Table sortable={false} fixed celled basic='very'>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell {...headerStyle}>
								<b>Name</b>
							</Table.HeaderCell>
							<Table.HeaderCell {...headerStyle}>
								Last Seen
							</Table.HeaderCell>
							<Table.HeaderCell {...headerStyle}>
								Value
							</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{fieldRows}
					</Table.Body>
				</Table>
			</div>
		);

		if (fieldRows.length === 0) {
			mainRender =
				(
					<div>
						<br />
						<Message content="No viewable sensors found for this device" error />
					</div>
				);
		}

		return mainRender;
}