<script lang="ts">
	export let data: { recipes: any[] };
	$: recipes = data.recipes.map((x) => x.Recept);
</script>

<h1>Obsah</h1>
<h2>Polévky</h2>

<ul>
	{#each recipes as item}
		<li><a href={'/recept/' + item.replaceAll(' ', '-')}>{item}</a></li>
	{/each}
</ul>
