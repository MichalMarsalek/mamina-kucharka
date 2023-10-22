<script lang="ts">
	import { Col, Image, Row } from 'sveltestrap';
	import { fade } from 'svelte/transition';

	export let data: { name: string; recipe: object };
	$: recipe = data.recipe as any;
</script>

{#key recipe.key}
	<div>
		<Row>
			<Col xs="12" lg="6">
				<Image fluid src="/foto/{recipe.key}.jpg" alt={recipe.Recept} />
			</Col>
			<Col xs="12" lg="6">
				<div out:fade={{ duration: 150 }} in:fade={{ delay: 150 }}>
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
				</div>
			</Col>
		</Row>
	</div>
{/key}
