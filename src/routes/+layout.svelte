<script lang="ts">
	import { Styles } from '@sveltestrap/sveltestrap';
	import InstallPrompt from '$lib/install-prompt.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<InstallPrompt />
<Styles theme="auto" />

{@render children()}
