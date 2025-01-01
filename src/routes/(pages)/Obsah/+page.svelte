<script lang="ts">
	import { Input, Nav, NavItem, NavLink } from '@sveltestrap/sveltestrap';
	import { isRecipe, type Content, type Page, type Recipe } from '$lib/content';
	import { getIngredientsInText } from '$lib/ingredients';
	import FavouriteStar from '$lib/favourite-star.svelte';
	import favourites from '$lib/favourites.svelte';

	interface Props {
		data: Content;
	}

	let { data }: Props = $props();
	let pages = $derived(data.pages);

	let search = $state('');
	let searchIngredients = $derived(getIngredientsInText(search));

	let favouritesOnly = $state(localStorage.getItem('favouritesOnly') == 'true');
	$effect(() => localStorage.setItem('favouritesOnly', favouritesOnly ? 'true' : 'false'));

	let favouritePages = $derived(
		favouritesOnly ? pages.filter((x) => favourites.has(x.slug)) : pages
	);

	let searchResults = $derived.by(() => {
		const byIngredients = favouritePages
			.filter(isRecipe)
			.map((recipe) => ({
				page: recipe,
				matchedIngredients: recipe.ingredients
					.flatMap((x) => x.normalized)
					.filter((x) => searchIngredients.includes(x)),
				addedIngredients: except(
					recipe.ingredients.flatMap((x) => x.normalized),
					searchIngredients
				),
				removedIngredients: except(
					searchIngredients,
					recipe.ingredients.flatMap((x) => x.normalized)
				)
			}))
			.filter((x) => x.matchedIngredients.length > 0);
		byIngredients.sort(
			(a, b) =>
				a.addedIngredients.length +
				a.removedIngredients.length -
				(b.addedIngredients.length + b.removedIngredients.length)
		);
		const byName = favouritePages
			.filter((page) => (' ' + page.title.toLowerCase()).includes(' ' + search.toLowerCase()))
			.map((page) => ({ page }));
		return [...byName, ...byIngredients] as {
			page: Page;
			matchedIngredients?: string[];
			addedIngredients?: string[];
			removedIngredients?: string[];
		}[];
	});

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent);
	}

	function except(a: string[], b: string[]) {
		return a.filter((x) => !b.includes(x));
	}
</script>

<h1>Obsah</h1>
<Input bind:value={search} placeholder="Hledat pomocí kombinace ingrediencí nebo názvu" autofocus />
<Input bind:checked={favouritesOnly} type="switch" label="Pouze oblíbené" class="mb-5" />
<div class="contents">
	<Nav class="flex-column">
		{#if search}
			{#each searchResults as result}
				<NavItem
					><NavLink href={'/' + result.page.slug} class="d-flex"
						><div class="page" style="padding-left: {level(result.page) * 15}px">
							{#if result.page.number}<span>{result.page.number}.&nbsp;</span>{/if}{result.page
								.title}
						</div>
						{#if 'matchedIngredients' in result}
							<div>
								{result.matchedIngredients!.join(', ')}{#if result.addedIngredients!.length}, {result
										.addedIngredients!.length} další
								{/if}
							</div>
						{/if}
					</NavLink></NavItem
				>
			{:else}
				Žádné recepty
			{/each}
		{:else}
			{#each favouritePages as item}
				<NavItem
					><NavLink href={'/' + item.slug} class="d-flex gap-3">
						<div class="d-flex gap-2">
							<span class="star"><FavouriteStar slug={item.slug} /></span>
							<span class="page" style="padding-left: {level(item) * 15}px">
								{#if item.number}<span>{item.number}.&nbsp;</span>{/if}{item.title}
							</span>
						</div>
						<div>{#if item.page}<span class="d-none d-sm-inline">str.&nbsp;</span>{item.page}{/if}</div></NavLink
					></NavItem
				>
			{/each}
		{/if}
	</Nav>
</div>

<style>
	.page {
		width: 450px;
	}

	@media screen and (min-width: 1200px) {
		.contents {
			column-count: 2;
			column-gap: 4rem;
		}
	}

	@media screen and (max-width: 576px) {
		.star {
			display: none;
		}
		.page {
			width: initial;
		}
	}
	:global(.nav-link) {
		justify-content: space-between;
	}

	h1 {
		text-transform: uppercase;
	}
</style>
