<script lang="ts">
	import { isRecipe, type Content } from '$lib/content';
	import { getIngredientsInText } from '$lib/ingredients';
	import { Col, Row } from '@sveltestrap/sveltestrap';

	let { data }: { data: Content } = $props();
	let keyFrequencies = $derived(
		frequencies(
			data.pages.flatMap((x) => [...Object.keys(x), ...(x?.customFields ?? []).map((x) => x.name)])
		)
	);
	const processedWords =
		'nebo cca lžíce stroužky lžička ale pro zeleninového malá větší bude plátky kaši bez kousek lžičky nejlépe půlka vynechat koření šlehání chuť parmazánového anglické lepší kostky můžeš malý plechovky stavu kousky Honzu menší baby suchém střední vaření nakrájená být velká krájených podle nebudeš vědět omáček nakrájené najemno trochu malé typu dle chuti balení špetka hladké nemusí špenátu Leňu lepku dát hrnek jarní omáčky tak sladké více klidně čerstvého bílého rozmixovaná hrst olivový plechovka'.split(
			' '
		);
	let ingrediences = $derived(
		frequencies(
			data.pages
				.filter(isRecipe)
				.flatMap((x) =>
					x.ingredients.map((x) => x.raw).flatMap((x) => x.match(/\p{L}{3,}/gu) ?? [])
				)
				.filter((x) => getIngredientsInText(x).length < 1 && !processedWords.includes(x))
		)
	);
	let unusedIngredienceLines = $derived(
		data.pages
			.filter(isRecipe)
			.flatMap((x) => x.ingredients.filter((x) => x.normalized.length === 0).map((x) => x.raw))
	);

	function frequencies(items: string[]) {
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
		{#each keyFrequencies as [key, freq]}
			<li>{key}: {freq}</li>
		{/each}
	</Col>
	<Col>
		{#each ingrediences as [key, freq]}
			<li>{key}: {freq}</li>
		{/each}
	</Col>
	<Col>
		COUNT = {unusedIngredienceLines.length}
		{#each unusedIngredienceLines as line}
			<li>{line}</li>
		{/each}
	</Col>
</Row>

<style>
	h1 .badge {
		font-size: initial;
	}
</style>
