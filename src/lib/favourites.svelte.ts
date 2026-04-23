import { SvelteSet } from 'svelte/reactivity';

const favourites = new SvelteSet(
	(localStorage.getItem('favourites') ?? '').split('\n').filter(Boolean)
);
$effect.root(() => {
	$effect(() => localStorage.setItem('favourites', [...favourites].join('\n')));
});

export default favourites;
