require('./App.css');

import React, { useEffect } from 'react';
import {
	BrowserRouter,
	Routes,
	Route,
	useLocation
} from 'react-router-dom';

import ga from 'react-ga';
ga.initialize('UA-40759916-4');

import { currentProjectHook, queryClient } from '../app/hooks/ApiQueryHooks';
import {
	QueryClientProvider
} from 'react-query';
import LoginPage from './pages/LoginPage';
import LogOutPage from './pages/LogoutPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OverviewPage from './pages/OverviewPage';
import ProjectsPage from './pages/ProjectsPage';
import ActivationRequiredPage from './pages/ActivationRequiredPage';
import MembersPage from './pages/MembersPage';
import AccountPage from './pages/AccountPage';
import DeviceListPage from './pages/DeviceListPage';
import DevicePage from './pages/DevicePage';
import ChartPage from './pages/ChartPage';
import EditActionPage from './pages/EditActionPage';
import ActionsListPage from './pages/ActionsListPage';
import GroupChatPage from './pages/GroupChatPage';
import AdminPage from './pages/AdminPage';
import ErrorPage from './pages/ErrorPage';

export default function App() {
	return (
		<>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<PageWatcher />
					<Routes>
						<Route exact path='/' element={<LoginPage />} />
						<Route exact path='/logout' element={<LogOutPage />} />
						<Route exact path='/register' element={<RegisterPage/>} />
						<Route exact path='/forgot' element={<ForgotPasswordPage/>} />
						<Route path='/notactivated' element={<ActivationRequiredPage />} />
						<Route path='/error' element={<ErrorPage />} />
						<Route path='/admin' element={<AdminPage />} />
						<Route path='/account' element={<AccountPage />} />
						<Route path='/overview' element={<OverviewPage />} />
						<Route path='/projects' element={<ProjectsPage />} />
						<Route path='/members' element={<MembersPage />} />
						<Route path='/devices' element={<DeviceListPage />} />
						<Route path='/devices/device' element={<DevicePage />} />
						{/*<Route path='/devices/device' element={<GatewayPage />} />*/}
						<Route path='/charts' element={<ChartPage />} />
						<Route path='/actions' element={<ActionsListPage />} />
						<Route path='/actions/add' element={<EditActionPage />} />
						<Route path='/actions/action' element={<EditActionPage />} />
						<Route path='/chat' element={<GroupChatPage />} />
					</Routes>
				</BrowserRouter>
			</QueryClientProvider>
		</>
	);
}

import { getProjectIdFromURL } from './services/ProjectService';
import { getCurrentProjectId } from './services/ApiService';

function PageWatcher() {
	const location = useLocation();
	const currentProject = currentProjectHook();

	useEffect(() => {//TODO: Where is the most optimal place for this to exist?
		//Change Project
		let URLProjectId = getProjectIdFromURL(location.search);

		if (getCurrentProjectId() !== URLProjectId && URLProjectId !== undefined) {
			currentProject.changeProject(URLProjectId);
		}

		//Push Google Analytics
		ga.pageview(location.pathname + location.search);
	}, [location]);

	return (<></>);
}