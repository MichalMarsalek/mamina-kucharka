<script lang="ts">
	import { isValuesField, type Page, type Recipe } from '$lib/content';
	import { Col, Image, Row, Icon } from '@sveltestrap/sveltestrap';
	import { fade } from 'svelte/transition';
  	import SvelteMarkdown from 'svelte-markdown'
	import AnchorRenderer from '$lib/anchor-renderer.svelte';
	import FavouriteStar from '$lib/favourite-star.svelte';

	interface Props {
		data: {recipe: Recipe};
	}

	let { data }: Props = $props();
	let recipe = $derived(data.recipe);

	function isLink(x: string) {
		return /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(x)
	}
</script>

{#key recipe?.slug}
	<div>
		<Row>
			{#if recipe}
				{#if recipe.photos.length > 0}
					<Col xs="12" lg="6">
						{#each recipe?.photos ?? [] as [photoName, photoSlug]}
							<figure class="photo">
								<Image fluid src="/foto/{photoSlug}.jpg" alt={photoName ?? recipe.title} />
								{#if photoName}
									<figcaption>{photoName}</figcaption>
								{/if}
							</figure>
						{/each}
					</Col>
				{/if}
				<Col>
					<div out:fade={{ duration: 150 }} in:fade={{ delay: 150 }}>
						<h1 class="d-flex justify-content-between"><div>{recipe.title}{#each recipe.tags as tag}
							<span class='badge badge-primary'>{tag}</span>
						{/each}</div>
						<FavouriteStar slug={recipe.slug}/>
					</h1>
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
								{#if field.name} {field.name}: {/if}
								{#if isValuesField(field)}
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
								{:else}
									<SvelteMarkdown source={field.markdown} renderers={{link: AnchorRenderer}}/>
								{/if}
							{/each}
					</div>
				</Col>
				{:else}
					Tento recept tady bohužel nemáme.
				{/if}
		</Row>
	</div>
{/key}

<style>
	h1 .badge {
		font-size: initial
	}
	
	@media screen and (max-width: 576px) {
		.photo {
			max-height: 30vh;
			overflow: hidden;
		}
		:global(.photo img) {
			max-height: 30vh;
			object-fit: cover;
			width: 100%;
		}
	}
</style>