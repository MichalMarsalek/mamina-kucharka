<script lang="ts">
	import { Input, Nav, NavItem, NavLink } from '@sveltestrap/sveltestrap';
	import { isChapter, isRecipe, type Content, type Page } from '$lib/content';
	import { getIngredientsInText } from '$lib/ingredients';
	import FavouriteStar from '$lib/favourite-star.svelte';
	import favourites from '$lib/favourites.svelte';
	import PhotoTooltip from '$lib/photo-tooltip.svelte';

	interface Props {
		data: Content;
	}

	let { data }: Props = $props();
	let pages = $derived(data.pages);

	let search = $state('');
	let searchIngredients = $derived(getIngredientsInText(search));

	let favouritesOnly = $state(localStorage.getItem('favouritesOnly') == 'true');
	$effect(() => localStorage.setItem('favouritesOnly', favouritesOnly ? 'true' : 'false'));

	const savedTocView = localStorage.getItem('tocView');
	let viewMode = $state<'list' | 'cards'>(
		savedTocView === 'list' || savedTocView === 'cards' ? savedTocView : 'cards'
	);
	$effect(() => localStorage.setItem('tocView', viewMode));

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
		const byRawIngredients = favouritePages
			.filter(isRecipe)
			.filter((recipe) =>
				search
					.toLowerCase()
					.split(' ')
					.some((w) =>
						recipe.ingredients
							.flatMap((x) => x.raw)
							.join()
							.toLowerCase()
							.includes(w)
					)
			)
			.map((page) => ({ page }));
		return [...byName, ...byIngredients, ...byRawIngredients] as {
			page: Page;
			matchedIngredients?: string[];
			addedIngredients?: string[];
			removedIngredients?: string[];
		}[];
	});

	// Pages grouped by chapter for card view (ungrouped top-level pages first, then chapters)
	let cardGroups = $derived.by(() => {
		const ungrouped = favouritePages.filter((p) => !p.parent && !isChapter(p));
		const chapters = data.rootPages
			.filter(isChapter)
			.map((chapter) => {
				const cards = chapter.pages.filter((p) => favouritePages.includes(p));
				const photoless =
					cards.filter((p) => isRecipe(p) && p.photos.length > 0).length < cards.length / 2;
				return {
					chapter: chapter as typeof chapter | null,
					cards: photoless
						? [...cards].sort((a, b) => {
								const aHas = isRecipe(a) && a.photos.length > 0 ? 0 : 1;
								const bHas = isRecipe(b) && b.photos.length > 0 ? 0 : 1;
								return aHas - bHas;
							})
						: cards
				};
			})
			.filter((g) => g.cards.length > 0);
		const result = [];
		if (ungrouped.length > 0) result.push({ chapter: null, cards: ungrouped });
		result.push(...chapters);
		return result;
	});

	function mostlyPhotoless(cards: Page[]): boolean {
		const withPhoto = cards.filter((p) => isRecipe(p) && p.photos.length > 0).length;
		return withPhoto < cards.length / 2;
	}

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent);
	}

	function except(a: string[], b: string[]) {
		return a.filter((x) => !b.includes(x));
	}
</script>

<div class="toc-header">
	<h1>Obsah</h1>
	<div class="header-controls">
		<div class="mobile-favourites d-sm-none">
			<Input bind:checked={favouritesOnly} type="switch" label="Pouze oblíbené" class="mb-0" />
		</div>
		<div class="view-toggle" role="group" aria-label="Zobrazení">
			<button
				class="toggle-btn"
				class:active={viewMode === 'list'}
				onclick={() => (viewMode = 'list')}
				title="Seznam"
				aria-pressed={viewMode === 'list'}
			>
				<i class="bi bi-list-ul"></i>
			</button>
			<button
				class="toggle-btn"
				class:active={viewMode === 'cards'}
				onclick={() => (viewMode = 'cards')}
				title="Karty"
				aria-pressed={viewMode === 'cards'}
			>
				<i class="bi bi-grid-3x3-gap"></i>
			</button>
		</div>
	</div>
</div>

<Input
	bind:value={search}
	placeholder="Hledat pomocí kombinace ingrediencí nebo názvu"
	autofocus
	class="mb-3"
/>
<Input
	bind:checked={favouritesOnly}
	type="switch"
	label="Pouze oblíbené"
	class="mb-3 d-none d-sm-block"
/>

{#if viewMode === 'cards' && !search}
	<!-- Card / grid view -->
	{#each cardGroups as group}
		{#if group.chapter}
			<a
				href={group.chapter.slug}
				class="chapter-header"
				class:favourite={favourites.has(group.chapter.slug)}
			>
				<span>{group.chapter.title}</span>
				<span class="chapter-star"><FavouriteStar slug={group.chapter.slug} /></span>
			</a>
		{/if}
		{@const groupMostlyPhotoless = mostlyPhotoless(group.cards)}
		<div class="card-grid" class:mixed-grid={groupMostlyPhotoless}>
			{#each group.cards as item}
				{@const hasPhoto = isRecipe(item) && item.photos.length > 0}
				{@const compact = groupMostlyPhotoless && !hasPhoto}
				{@const spanTwo = groupMostlyPhotoless && hasPhoto}
				<a
					href={item.slug}
					class="recipe-card"
					class:favourite={favourites.has(item.slug)}
					class:compact
					class:span-two={spanTwo}
				>
					{#if hasPhoto}
						<div class="card-img-wrap" class:stretch-img={spanTwo}>
							<img src="/foto1/{item.photos[0][1]}.webp" alt={item.title} loading="lazy" />
						</div>
					{:else if !compact}
						<div class="card-img-placeholder">
							<i class="bi bi-journal-richtext"></i>
						</div>
					{/if}
					<div class="card-body">
						<span class="card-title">{item.title}</span>
						<span class="card-star"><FavouriteStar slug={item.slug} /></span>
					</div>
				</a>
			{/each}
		</div>
	{/each}
{:else}
	<!-- List view -->
	<div class="contents">
		<Nav class="flex-column">
			{#if search}
				{#each searchResults as result}
					{@const r = isRecipe(result.page) ? result.page : null}
					<PhotoTooltip
						photoUrl={r && r.photos.length > 0 ? `/foto1/${r.photos[0][1]}.webp` : undefined}
						side="left"
						><NavItem
							><NavLink href={result.page.slug} class="d-flex"
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
						></PhotoTooltip
					>
				{:else}
					Žádné recepty
				{/each}
			{:else}
				{#each favouritePages as item}
					{@const recipe = isRecipe(item) ? item : null}
					<PhotoTooltip
						photoUrl={recipe && recipe.photos.length > 0
							? `/foto1/${recipe.photos[0][1]}.webp`
							: undefined}
						side="left"
						><NavItem
							><NavLink
								href={item.slug}
								class="d-flex gap-3"
								style="margin-top: {level(item) * -5}px"
							>
								<div class="d-flex gap-2">
									<span class="star"><FavouriteStar slug={item.slug} /></span>
									<span class="page" style="padding-left: {level(item) * 15}px">
										{#if item.number}<span>{item.number}.&nbsp;</span>{/if}{item.title}
									</span>
								</div>
								<div>
									{#if item.page}<span class="d-none d-sm-inline">str.&nbsp;</span>{item.page}{/if}
								</div></NavLink
							></NavItem
						></PhotoTooltip
					>
				{/each}
			{/if}
		</Nav>
	</div>
{/if}

<style>
	.toc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-favourites :global(.form-check) {
		margin: 0;
	}

	.mobile-favourites :global(.form-check-label) {
		font-size: 0.85rem;
		white-space: nowrap;
	}

	h1 {
		text-transform: uppercase;
		margin: 0;
	}

	/* View toggle buttons */
	.view-toggle {
		display: flex;
		gap: 4px;
	}

	.toggle-btn {
		width: 36px;
		height: 36px;
		border: 1px solid var(--bs-border-color, #dee2e6);
		background: var(--bs-body-bg, white);
		color: var(--bs-body-color);
		border-radius: 6px;
		cursor: pointer;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.toggle-btn:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		);
	}

	.toggle-btn.active {
		background: var(--bs-primary, #0d6efd);
		color: white;
		border-color: var(--bs-primary, #0d6efd);
	}

	/* Card grid */
	.chapter-header {
		width: 100%;
		padding: 14px 16px;
		margin-top: 1.25rem;
		margin-bottom: 6px;
		background: var(--bs-body-bg, white);
		border: 1px solid var(--bs-border-color, #dee2e6);
		border-radius: 10px;
		font-weight: 600;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: inherit;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition:
			background-color 0.18s ease,
			border-color 0.18s ease;
	}

	.chapter-header:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		);
	}

	.chapter-header.favourite {
		background: color-mix(in srgb, #c8a400 10%, transparent);
		border-color: color-mix(in srgb, #c8a400 40%, var(--bs-border-color, #dee2e6));
	}

	.chapter-header.favourite:hover {
		background: color-mix(in srgb, #c8a400 18%, transparent);
		border-color: color-mix(in srgb, #c8a400 55%, var(--bs-border-color, #dee2e6));
	}

	:global([data-bs-theme='dark']) .chapter-header.favourite {
		background: color-mix(in srgb, #c8a400 5%, transparent);
		border-color: color-mix(in srgb, #c8a400 20%, var(--bs-border-color, #dee2e6));
	}

	:global([data-bs-theme='dark']) .chapter-header.favourite:hover {
		background: color-mix(in srgb, #c8a400 9%, transparent);
		border-color: color-mix(in srgb, #c8a400 28%, var(--bs-border-color, #dee2e6));
	}

	.chapter-header:first-child {
		margin-top: 0;
	}

	.chapter-star {
		flex-shrink: 0;
	}

	/* Card grid */
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 12px;
		margin-bottom: 2rem;
	}

	.card-grid.mixed-grid {
		grid-auto-rows: 60px;
	}

	.recipe-card.span-two {
		grid-row: span 2;
		position: relative;
	}

	.card-img-wrap.stretch-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		aspect-ratio: unset;
	}

	.recipe-card.span-two .card-body {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent);
		backdrop-filter: blur(4px);
	}

	.card-body {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 8px 10px;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 4px;
		min-height: 52px;
		background: color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent);
		backdrop-filter: blur(4px);
		transition: background 0.18s ease;
	}

	.recipe-card:hover .card-body {
		background: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 18%,
			color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent)
		);
	}

	.recipe-card.compact {
		flex-direction: row;
		align-items: center;
		padding: 0 10px;
	}

	.recipe-card.compact .card-body {
		position: static;
		background: transparent;
		backdrop-filter: none;
		min-height: unset;
		padding: 8px 0;
		flex: 1;
	}

	.recipe-card.compact:hover .card-body {
		background: transparent;
	}

	.recipe-card.compact .card-title {
		font-size: 0.88rem;
	}

	@media screen and (min-width: 768px) {
		.card-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
		.card-grid.mixed-grid {
			grid-auto-rows: 65px;
		}
	}

	@media screen and (min-width: 1200px) {
		.card-grid {
			grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		}
		.card-grid.mixed-grid {
			grid-auto-rows: 70px;
		}
	}

	.recipe-card {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--bs-border-color, #dee2e6);
		border-radius: 10px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition:
			background-color 0.18s ease,
			border-color 0.18s ease;
		background: var(--bs-body-bg, white);
		position: relative;
	}

	.recipe-card.favourite {
		border-color: color-mix(
			in srgb,
			var(--bs-warning, #ffc107) 30%,
			var(--bs-border-color, #dee2e6)
		);
		background: color-mix(in srgb, var(--bs-warning, #ffc107) 4%, var(--bs-body-bg, white));
	}

	.recipe-card.favourite:hover {
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		);
	}

	.recipe-card:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		);
		color: inherit;
		text-decoration: none;
	}

	.recipe-card.favourite {
		background: color-mix(in srgb, #c8a400 10%, transparent);
		border-color: color-mix(in srgb, #c8a400 40%, var(--bs-border-color, #dee2e6));
	}

	.recipe-card.favourite:hover {
		background: color-mix(in srgb, #c8a400 18%, transparent);
		border-color: color-mix(in srgb, #c8a400 55%, var(--bs-border-color, #dee2e6));
	}

	.recipe-card.favourite .card-body {
		background: color-mix(
			in srgb,
			#c8a400 15%,
			color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent)
		);
	}

	.recipe-card.favourite:hover .card-body {
		background: color-mix(
			in srgb,
			#c8a400 28%,
			color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent)
		);
	}

	.recipe-card.compact.favourite .card-body,
	.recipe-card.compact.favourite:hover .card-body {
		background: transparent;
	}

	:global([data-bs-theme='dark']) .recipe-card.favourite {
		background: color-mix(in srgb, #c8a400 5%, transparent);
		border-color: color-mix(in srgb, #c8a400 20%, var(--bs-border-color, #dee2e6));
	}

	:global([data-bs-theme='dark']) .recipe-card.favourite:hover {
		background: color-mix(in srgb, #c8a400 9%, transparent);
		border-color: color-mix(in srgb, #c8a400 28%, var(--bs-border-color, #dee2e6));
	}

	:global([data-bs-theme='dark']) .recipe-card.favourite .card-body {
		background: color-mix(
			in srgb,
			#c8a400 8%,
			color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent)
		);
	}

	:global([data-bs-theme='dark']) .recipe-card.favourite:hover .card-body {
		background: color-mix(
			in srgb,
			#c8a400 14%,
			color-mix(in srgb, var(--bs-body-bg, white) 85%, transparent)
		);
	}

	:global([data-bs-theme='dark']) .recipe-card.compact.favourite .card-body,
	:global([data-bs-theme='dark']) .recipe-card.compact.favourite:hover .card-body {
		background: transparent;
	}

	.card-img-wrap {
		width: 100%;
		aspect-ratio: 4 / 3;
		overflow: hidden;
		background: var(--bs-secondary-bg, #f0f0f0);
	}

	.card-img-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.recipe-card:hover .card-img-wrap img {
		transform: scale(1.12);
	}

	.card-img-placeholder {
		width: 100%;
		aspect-ratio: 4 / 3;
		background: var(--bs-secondary-bg, #f0f0f0);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2.5rem;
		color: var(--bs-secondary, #adb5bd);
	}

	.card-title {
		font-size: 0.85rem;
		font-weight: 500;
		line-height: 1.3;
	}

	.card-star {
		flex-shrink: 0;
		font-size: 0.9rem;
	}

	/* List view */
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

	:global(.contents .nav-link) {
		width: 100%;
		border-radius: 6px;
		padding: 4px 8px !important;
		transition: background-color 0.15s ease;
	}

	:global(.contents .nav-link:hover) {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
	}

	/* Override the shared layout rule that tints only the first text block */
	:global(.contents .nav-link:hover > div) {
		background: transparent;
	}
</style>
