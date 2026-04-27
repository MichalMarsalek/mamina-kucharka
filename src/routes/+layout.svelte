<script lang="ts">
	import { Styles } from '@sveltestrap/sveltestrap';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<Styles theme="auto" />

{@render children()}

<style>
</style>
