<script lang="ts">
	import { Icon } from '@sveltestrap/sveltestrap';
	import favourites from '$lib/favourites.svelte';

	interface Props {
		slug: string;
		large?: boolean;
	}

	let { slug, large = false }: Props = $props();

	function toggleStar(e) {
		if (!favourites.delete(slug)) {
			favourites.add(slug);
		}
		e.preventDefault();
	}
</script>

<span class="star-clip"
	><span
		class="star"
		style:--tx={large ? '2px' : '0px'}
		style:--ty={large ? '2px' : '0px'}
		tabindex="0"
		onclick={toggleStar}
		onkeydown={(e) => e.key === 'Enter' && toggleStar(e)}
		><Icon name={favourites.has(slug) ? 'star-fill' : 'star'} /></span
	></span
>

<style>
	:global(.star .bi-star) {
		opacity: 0.5;
	}
	.star-clip {
		display: inline-block;
		overflow: hidden;
		padding: 4px;
		margin: -4px;
		vertical-align: middle;
	}
	.star {
		cursor: pointer;
		display: inline-block;
		outline: none;
		transform-origin: center center;
		transform-box: fill-box;
	}
	:global(.star svg) {
		display: block;
	}
	.star:focus {
		animation: star-pop 0.4s ease-out forwards;
		outline: none;
	}
	@keyframes star-pop {
		0% {
			transform: rotate(0deg) translate(0px, 0px);
		}
		70% {
			transform: rotate(90deg) translate(var(--tx), calc(-1 * var(--ty)));
		}
		100% {
			transform: rotate(72deg) translate(var(--tx), calc(-1 * var(--ty)));
		}
	}
</style>
