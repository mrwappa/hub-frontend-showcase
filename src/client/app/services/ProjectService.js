import isEmpty from 'lodash.isempty';
import QueryString from 'query-string';

export function getMember(memberList, userId) {
	if (!memberList) return null;

	return memberList.find((member) => {
		return member.user.id === userId;
	});
}

export function getRole(memberList, userId) {
	let member = getMember(memberList, userId);
	return member ? member.role : null;
}

export function isMemberOwnerOrAdmin(member) {
	if (!member) return false;
	
	if (typeof (member) === 'object') {
		return (/owner|admin/.test(member.role));
	}
	else if (typeof (member) === 'string') {
		return (/owner|admin/.test(member));
	}
	else return false;
}

export function isUserOwnerOrAdmin(project, user) {
	if (isEmpty(user) || isEmpty(project)) return false;
	
	if (user.role.match(/master|superUser/)) {
		return true;
	}
	return isMemberOwnerOrAdmin(getMember(project.members, user.id));
}

export function isMemberOwner(member) {
	if (typeof (member) === 'object') {
		return (member.role === 'owner');
	}
	else if (typeof (member) === 'string') {
		return (member === 'owner');
	}
}

export function isUserOwner(project, user) {
	return isMemberOwner(getMember(project.members, user.id));
}

export function getProjectIdFromURL(url) {
	let match = QueryString.parseUrl(url);
	if (match.query.project) {
		return match.query.project;
	}
	return undefined;
}