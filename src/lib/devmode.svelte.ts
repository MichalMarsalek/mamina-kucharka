import { browser } from '$app/environment';

let active = $state(browser ? sessionStorage.getItem('devmode') === '1' : false);

const devmode = {
	get active() {
		return active;
	},
	enable() {
		active = true;
		if (browser) sessionStorage.setItem('devmode', '1');
	}
};

export default devmode;
