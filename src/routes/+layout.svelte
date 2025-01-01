<script lang="ts">
	import { Styles } from '@sveltestrap/sveltestrap';
	import { ingredients as _ingredients } from '$lib/ingredients';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<Styles theme="auto" />

{@render children()}

<style>
</style>
