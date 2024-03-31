import React from 'react';
import { Segment, Button, Grid, Icon } from 'semantic-ui-react';


export default function DeviceChartSelector({
	loading,
	selectedSpan,
	changePrevNextCounter,
	onSelectSpan,
	disableLastPeriod
}) {

	return (
		<div>
			<Segment loading={loading} textAlign='center'>
				<Grid columns={3} stackable>

					<Grid.Row>
						<Grid.Column>
							<Button.Group compact>
								<Button icon labelPosition='left' onClick={() => changePrevNextCounter(-1)}>
									Prev
									<Icon name='left arrow' />
								</Button>
								<Button icon labelPosition='right' onClick={() => changePrevNextCounter(1)}>
									Next
									<Icon name='right arrow' />
								</Button>
							</Button.Group>
						</Grid.Column>
						<Grid.Column>
							<Button disabled={disableLastPeriod} onClick={() => changePrevNextCounter(0)}>{'Last ' + selectedSpan}</Button>
						</Grid.Column>
						<Grid.Column>
							<Button.Group>
								<Button active={selectedSpan === 'month'} onClick={() => onSelectSpan('month')} >Month</Button>
								<Button active={selectedSpan === 'week'} onClick={() => onSelectSpan('week')} >Week</Button>
								<Button active={selectedSpan === 'day'} onClick={() => onSelectSpan('day')} >Day</Button>
							</Button.Group>
						</Grid.Column>
					</Grid.Row>
				</Grid>
			</Segment>
		</div>
	);
}