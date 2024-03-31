import React from 'react';
import { Table } from 'semantic-ui-react';

export default function DataList(data) {

	let dataList = data.map((element) => {
		return (
			<Table.Row key={element.key + '-row'}>
				<Table.Cell>{element.key}</Table.Cell>
				<Table.Cell collapsing>{element.value}</Table.Cell>
				<Table.Cell collapsing>{element.buttons}</Table.Cell>
			</Table.Row>
		);
	});
	
	return (
		<div>
			<Table unstackable>
				<Table.Body>
					{dataList}
				</Table.Body>
			</Table>
		</div>
	);
}