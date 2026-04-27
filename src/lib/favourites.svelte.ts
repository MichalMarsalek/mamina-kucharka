import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';

const favourites = new SvelteSet(
	((browser ? localStorage.getItem('favourites') : '') ?? '').split('\n').filter(Boolean)
);
$effect.root(() => {
	$effect(() => {
		if (browser) localStorage.setItem('favourites', [...favourites].join('\n'));
	});
});

export default favourites;
