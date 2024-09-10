<script lang="ts">
	import type { Content } from '$lib/content';

	let {data}: {data:Content} = $props()
	$inspect(data)
	let keyFrequencies = $derived(frequencies(data.pages.flatMap(x => [...Object.keys(x), ...(x?.customFields ?? []).map(x => x.name)])))

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
{#each keyFrequencies as [key, freq]}
	<li>{key}: {freq}</li>
{/each}

<style>
	h1 .badge {
		font-size: initial
	}
</style>