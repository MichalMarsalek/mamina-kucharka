<script lang="ts">
	import { isRecipe, type Content } from '$lib/content';
	import { Col, Row } from '@sveltestrap/sveltestrap';

	let {data}: {data:Content} = $props()
	$inspect(data)
	let keyFrequencies = $derived(frequencies(data.pages.flatMap(x => [...Object.keys(x), ...(x?.customFields ?? []).map(x => x.name)])))
	const processedWords = "nebo cca sůl lžíce pepř cibule česneku olej stroužky lžička oleje másla ale pro zeleninového vývaru hrst malá větší bude brambor vejce plátky kaši bez vody kousek bujónu sýru lžičky nejlépe masa půlka vynechat smetana koření smetany šlehání brambory chuť paprika parmazánového slaniny rajčat polévka anglické lepší kostky olivového hovězího můžeš malý plechovky stavu kousky brokolice kmín Honzu menší rýže baby olivový cukru suchém tymián střední vaření nakrájená oregano bramborový chilli být plechovka velká mrkve krájených podle nebudeš vědět mrkev mouky majoránka omáček nakrájené bobkové listy sýr protlak hladká mouka najemno čerstvé papriky trochu malé typu dle chuti kukuřičný škrob balení špetka hladké nemusí špenátu Leňu lepku kuřecího vepřová šunky dát bazalky hrnek jarní omáčky tak sladké rajče více klidně čerstvého bílého rozmixovaná".split(" ");
	let ingrediences = $derived(frequencies(data.pages.filter(isRecipe).flatMap(x => x.ingredients.map(x => x.raw).flatMap(x => x.match(/\p{L}{3,}/gu) ?? [])).filter(x => !processedWords.includes(x))))
	let unusedIngredienceLines = $derived(data.pages.filter(isRecipe).flatMap(x => x.ingredients.filter(x => x.normalized.length === 0).map(x => x.raw)))

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
		font-size: initial
	}
</style>