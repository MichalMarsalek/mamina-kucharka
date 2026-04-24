<script lang="ts">
	import { Styles } from '@sveltestrap/sveltestrap';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		data: {
			photoSlugs?: string[];
		};
	}

	let { children, data }: Props = $props();
</script>

<Styles theme="auto" />

<svelte:head>
	{#each data.photoSlugs ?? [] as photoSlug}
		<link rel="preload" href="/foto/{photoSlug}.webp" as="image" />
	{/each}
</svelte:head>

{@render children()}

<style>
</style>
