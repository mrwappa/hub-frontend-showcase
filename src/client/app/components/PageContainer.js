import React, { useEffect, useState } from 'react';
import { Container, Dimmer, Loader } from 'semantic-ui-react';
import Drawer from 'components/Drawer';
import HeaderBox from 'components/HeaderBox';
import Footer from 'components/Footer';

export default function PageContainer(props) {

	const [openDrawer, setOpenDrawer] = useState(false);

	const toggleMenuClick = () => {
		setOpenDrawer(!openDrawer);
	};

	let container = (
		<Container className='pageContainer' fluid={props.fullsize}>
			<Dimmer.Dimmable blurring={props.loading} dimmed={props.loading} >
				{props.children}
			</Dimmer.Dimmable>
		</Container>
	);

	return (
		<div className="fullHeight">
			{/* TODO: Is this needed visually?
				props.loading &&
				<Loader active></Loader>
				*/
			}
			<Drawer manualShow={openDrawer} />
			<div className={openDrawer ? 'mainContent manualShow' : 'mainContent'}>
				<HeaderBox title={props.title} manualShow={openDrawer} onToggleMenuClick={toggleMenuClick} />
				{container}
				{props.nofooter || props.loading ? null : <Footer />}
			</div>
		</div>
	);
}
