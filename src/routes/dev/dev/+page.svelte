<script lang="ts">
	import { isRecipe, type Content } from '$lib/content';
	import { Col, Row } from '@sveltestrap/sveltestrap';

	let {data}: {data:Content} = $props()
	$inspect(data)
	let keyFrequencies = $derived(frequencies(data.pages.flatMap(x => [...Object.keys(x), ...(x?.customFields ?? []).map(x => x.name)])))
	let ingrediences = $derived(frequencies(data.pages.flatMap(x => isRecipe(x) ? x.ingredients.flatMap(x => x.match(/\p{L}{3,}/gu) ?? []) : [])).map(x => x[0]))

	function frequencies(items: string[]) {
		const resMap = new Map<string, number>();
		for(const item of items){
			resMap.set(item, (resMap.get(item) ?? 0) + 1)
		}
		const res = [...resMap.entries()];
		res.sort((a,b) => b[1] - a[1]);
		return res;
	}
	
</script>
<Row>
	<Col>
{#each keyFrequencies as [key, freq]}
	<li>{key}: {freq}</li>
{/each}
	</Col>
	<Col>
{#each ingrediences as key}
	<li>{key}</li>
{/each}
	</Col>
</Row>

<style>
	h1 .badge {
		font-size: initial
	}
</style>