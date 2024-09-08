<script lang="ts">
	export let data: { recipes: any[] };
</script>

<h1>Obsah</h1>
<h2>Polévky</h2>

<ul>
	{#each data.recipes as item}
		<li><a href={'/recept/' + item.key}>{item.Nadpis}</a></li>
	{/each}
</ul>
