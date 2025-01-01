<script lang="ts">
	import { Icon } from '@sveltestrap/sveltestrap';
	import favourites from '$lib/favourites.svelte';

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	function toggleStar(e) {
		if (!favourites.delete(slug)) {
			favourites.add(slug);
		}
		e.preventDefault();
	}
</script>

<span class="star"
	><Icon name={favourites.has(slug) ? 'star-fill' : 'star'} onclick={toggleStar} /></span
>

<style>
	:global(.star .bi-star) {
		opacity: 0.5;
	}
	.star {
		cursor: pointer;
        transition: transform 0.5s;
        transform: rotate(0deg);
        overflow: hidden;
	}
	.star:hover {
        transform: rotate(72deg);
	}
</style>
