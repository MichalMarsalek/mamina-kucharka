<script lang="ts">
	import type { Page, Recipe } from '$lib/content';
	import { Col, Image, Row } from '@sveltestrap/sveltestrap';
	import { fade } from 'svelte/transition';

	export let data: Recipe;
	$: recipe = data;

	function isLink(x: string) {
		return /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(x)
	}
</script>

{#key recipe.slug}
	<div>
		<Row>
			{#if recipe == null || recipe.photos.length > 0}
				<Col xs="12" lg="6">
					{#each recipe.photos as photo}
						<Image fluid src="/foto/{photo}.jpg" alt={recipe.title} />
					{/each}
				</Col>
			{/if}
			<Col>
				<div out:fade={{ duration: 150 }} in:fade={{ delay: 150 }}>
					<h1>{recipe.title}{#each recipe.tags as tag}
						<span class='badge badge-primary'>{tag}</span>
					{/each}</h1>
					{#if recipe}
						<div class="mb-2">#{recipe.page}</div>

						{#if recipe.ingredients}
							{#if recipe.portions}
								Na {recipe.portions} porce:
							{:else}
								Ingredience:
							{/if}
							<ul>
								{#each recipe.ingredients as item}
									<li title={item.normalized}>{item.raw}</li>
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
									<li>
										{#if isLink(value)}
											<a href={value} target="_blank">{value}</a>
										{:else}
											{value}
										{/if}
									</li>
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

<style>
	h1 .badge {
		font-size: initial
	}
</style>