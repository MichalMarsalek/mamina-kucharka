<script lang="ts">
	export let data: { name: string; recipe: object; next: string };
	$: recipe = data.recipe as any;
</script>

<a href="/obsah">Obsah</a><a href={data.next.replaceAll(' ', '-')} style="padding-left: 20px"
	>{data.next}</a
>
<h1>{recipe.Recept ?? data.name}</h1>
{#if recipe}
	{#if recipe.Tagy}
		Tagy: {recipe.Tagy}<br />
	{/if}

	{#if recipe.Ingredience}
		{#if recipe.Porce}
			Na {recipe.Porce} porce:
		{:else}
			Ingredience:
		{/if}
		<ul>
			{#each recipe.Ingredience.split('\n') as item}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}

	{#if recipe.Postup}
		Postup:
		<ul>
			{#each recipe.Postup.split('\n') as item}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
{:else}
	Tento recept tady bohužel nemáme.
{/if}
