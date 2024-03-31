import { appMode } from 'config';
import { ReactQueryDevtools } from 'react-query/devtools';
import PageContainer from '../components/PageContainer';
import { ToastContainer } from 'react-toastify';

import React from 'react';

export default function PageBase({
	title,
	nofooter,
	fullsize,
	loading,
	page,
	blankPage
}) {
	let container;

	if (!blankPage) {
		container = (
			<PageContainer
				title={title}
				nofooter={nofooter}
				fullsize={fullsize}
				loading={loading}
			>
				{page}
			</PageContainer>
		);
	}
	else {
		container = (
			<>
				{page}
			</>
		);
	}

	return (
		<>
			{container}
			<ToastContainer />
			{
				appMode === 'development' &&
				<ReactQueryDevtools initialIsOpen={false} />
			}
		</>

	);
}