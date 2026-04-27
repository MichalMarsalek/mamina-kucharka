<script lang="ts">
	import { Icon } from '@sveltestrap/sveltestrap';
	import favourites from '$lib/favourites.svelte';

	interface Props {
		slug: string;
		large?: boolean;
	}

	let { slug, large = false }: Props = $props();

	function toggleStar(e: MouseEvent) {
		if (!favourites.delete(slug)) {
			favourites.add(slug);
		}
		e.preventDefault();
	}
</script>

<span class="star-clip"
	><button
		type="button"
		class="star"
		style:--tx={large ? '2px' : '0px'}
		style:--ty={large ? '2px' : '0px'}
		aria-label={favourites.has(slug) ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
		onclick={toggleStar}><Icon name={favourites.has(slug) ? 'star-fill' : 'star'} /></button
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
		border: 0;
		padding: 2px;
		background: transparent;
		border-radius: 999px;
		transform-origin: center center;
		transform-box: fill-box;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease;
	}
	:global(.star svg) {
		display: block;
	}
	.star:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
		animation: star-hover 0.28s ease-out;
	}

	.star:focus {
		animation: star-pop 0.4s ease-out forwards;
		outline: none;
	}

	@keyframes star-hover {
		0% {
			transform: scale(1) rotate(0deg);
		}
		50% {
			transform: scale(1.1) rotate(-8deg);
		}
		100% {
			transform: scale(1.04) rotate(0deg);
		}
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
