import isEmpty from "lodash.isempty";

let subscription, project = { members: [] }, userRoles = {};

export function setUserRoles(user) {
	let memberMatch = project.members.find((member) => {
		return member.user.id === user.id;
	});

	if (!memberMatch) return;

	userRoles = { self: user.role, project: memberMatch.role };
}

export function setSubscription(aProject) {
	if (aProject && aProject.members) {
		project = aProject;
		subscription = aProject.subscription;
	}
}

function update(user, currentProject) {
	if (isEmpty(userRoles) || isEmpty(project.members)) {
		setSubscription(currentProject);
		setUserRoles(user);
	}
}

export function getRoleWithExpiredState(user, currentProject) {
	update(user, currentProject);
	let expired = subscriptionExpired();
	if (expired && (userRoles.project === 'viewer' || userRoles.project === 'admin')) {
		return 'member';
	}
	else if (expired && (userRoles.project === 'owner')) {
		return 'owner';
	}

	return 'none';
}

export function isProjectSubExpired(sub) {
	let aSub = sub || subscription;
	const subHasDate = aSub.state === 'date' || aSub.state === 'notified';
	return aSub.state === 'expired' || (subHasDate && new Date().getTime() > new Date(aSub.endDate).getTime());
}

export function subscriptionExpired(user, currentProject) {
	update(user, currentProject);

	if (userRoles.self.match(/master|superUser/)) {
		return false;
	}
	return isProjectSubExpired();
}