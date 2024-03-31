import React from 'react';
import PageBase from '../components/PageBase';
import { Button, } from 'semantic-ui-react';
import { projectsHook } from '../hooks/ApiQueryHooks';
import { useNavigate } from 'react-router-dom';
import DeviceMap from '../components/DeviceMap';

export default function OverviewPage(props) {

	const navigate = useNavigate();

	const projects = projectsHook();
	
	let page;
	let title;

	if (projects.data.length > 0) {
		title = 'Overview';
		page = (
			<>
				<DeviceMap/>
				{/*<DeviceMapFilter
					loading={this.state.loading}
					selectedFilter={this.state.selectedFilter}
					searchValue={this.state.filterSearchValue}
					activeObjects={this.state.activeObjects.length}
					alarmObjects={this.state.alarmObjects.length}
					allObjects={this.state.devices.length}
					searchObjects={this.state.visibleObjects.length}
					onSearchChange={this.onFilterSearchChange}
					onSelectFilter={this.onSelectFilter}
				/>*/}
				{
					<div style={{ flexGrow: 1, position: 'relative' }}>
						{/*<DeviceMap
							objects={this.state.visibleObjects}
							gateways={this.state.gateways}
							zoom={true}
							history={this.props.history}
							changeGatewayLocation={this.changeGatewayLocation.bind(this)}
						/>*/}
					</div>
				}
			</>
		);
	}
	else {
		if (projects.isLoading) {
			title = 'Overview';
			page = (
				<div>
				</div>
			);
		}
		else {
			title = 'No Projects';
			page = (
				<div style={{ paddingLeft: '35%', paddingTop: '20%' }}>
					<Button color='green' onClick={() => { navigate('/projects'); }} size='massive' content='Add Project' icon='plus' labelPosition='left' />
				</div>
			);
		}
	}

	return <PageBase page={page} title={title} nofooter fullsize />;

}
