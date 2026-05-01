<script lang="ts">
	import { isRecipe, type Content } from '$lib/content';
	import { Col, Row } from '@sveltestrap/sveltestrap';

	let { data }: { data: Content } = $props();
	let ingredients = $derived(
		frequencies(data.pages.filter(isRecipe).flatMap((x) => x.normalizedIngredients))
	);

	function frequencies(items: string[]) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const resMap = new Map<string, number>();
		for (const item of items) {
			resMap.set(item, (resMap.get(item) ?? 0) + 1);
		}
		const res = [...resMap.entries()];
		res.sort((a, b) => b[1] - a[1]);
		return res;
	}
</script>

<Row>
	<Col>
		{#each ingredients as [key, freq]}
			<li>{key}: {freq}</li>
		{/each}
	</Col>
</Row>

<style>
	h1 .badge {
		font-size: initial;
	}
</style>
