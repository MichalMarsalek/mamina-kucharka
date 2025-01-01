<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		title?: any;
		children?: Snippet;
	}

	let { href = '', title = undefined, children }: Props = $props();
</script>

<a data-sveltekit-reload {href} {title}>{@render children?.()}</a>
