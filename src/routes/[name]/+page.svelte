<script lang="ts">
	import type { Page, Recipe } from '$lib/content';
	import { Col, Image, Row } from '@sveltestrap/sveltestrap';
	import { fade } from 'svelte/transition';

	export let data: Recipe;
	$: recipe = data;

	$: console.log({recipe})
</script>

{#key recipe.slug}
	<div>
		<Row>
			<Col xs="12" lg="6">
				<Image fluid src="/foto/{recipe.slug}.jpg" alt={recipe.title} />
			</Col>
			<Col xs="12" lg="6">
				<div out:fade={{ duration: 150 }} in:fade={{ delay: 150 }}>
					<h1>{recipe.title}</h1>
					{#if recipe}
						{#if recipe.tags}
							Tagy: {recipe.tags}<br />
						{/if}

						{#if recipe.ingredients}
							{#if recipe.portions}
								Na {recipe.portions} porce:
							{:else}
								Ingredience:
							{/if}
							<ul>
								{#each recipe.ingredients as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}

						{#if recipe.ingredients}
							Postup:
							<ul>
								{#each recipe.steps as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}

						{#each recipe.customFields as field}
							{field.name}:
							<ul>
								{#each field.values as value}
									<li>{value}</li>
								{/each}
							</ul>
						{/each}
					{:else}
						Tento recept tady bohužel nemáme.
					{/if}
				</div>
			</Col>
		</Row>
	</div>
{/key}
