import clone from 'lodash.clone';

export function setInnerState(current, setFunc, params) {
  let og = clone(current);
  for (let param in params) {
    og[param] = params[param];
  }
  setFunc(og);
}

export function isApiHookLoading() {
	for (let arg of arguments) {
		if (arg.isLoading) {
			return true;
		}
	}
	return false;
}