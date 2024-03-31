import React, { useEffect } from 'react';
import { setAuthToken, setCurrentProjectId } from '../services/ApiService';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '../hooks/ApiQueryHooks';

export default function LogOutPage () {
	const navigate = useNavigate();

	const clearAuthToken = async () => {
		await setAuthToken(null);
	};

	useEffect(() => {
		queryClient.clear();//Clear Cache
		clearAuthToken();
		setCurrentProjectId(null);
		navigate('/');//Go To Login Page
	}, []);

	return (<></>);
}