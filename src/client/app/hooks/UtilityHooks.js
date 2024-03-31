import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from '../services/ApiService';
import { socketSubcribe, socketUnsubcribe } from "../services/Socket.io";
import { redirectToOverview } from "../services/UtilityService";


export function alreadyLoggedInRedirectHook () {
	const navigate = useNavigate();

	useEffect(() => {
		if (isAuthenticated()) {
			redirectToOverview(navigate);
		}
	}, []);	

	return 0;
}

export function socketHook(
	type,
	id,
	cb
) {

	useEffect(() => {
		socketSubcribe(type, id, cb);
		return () => {
			socketUnsubcribe(type, id, cb);
		};
	}, []);

	return 0;
}

export function useForceUpdate(){
	const [value, setValue] = useState(0); // integer state
	return () => setValue(value => value + 1); // update the state
}