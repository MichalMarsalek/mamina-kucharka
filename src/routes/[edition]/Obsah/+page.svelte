<script lang="ts">
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { Input, Nav, NavItem, NavLink } from '@sveltestrap/sveltestrap';
	import { isChapter, isRecipe, type Chapter, type Content, type Page } from '$lib/content';
	import { getIngredientsInText } from '$lib/ingredients';
	import FavouriteStar from '$lib/favourite-star.svelte';
	import favourites from '$lib/favourites.svelte';
	import PhotoTooltip from '$lib/photo-tooltip.svelte';
	import devmode from '$lib/devmode.svelte';

	interface Props {
		data: Content;
	}

	let { data }: Props = $props();
	let pages = $derived(data.pages);
	let incomingPhotoOffsets = $derived(data.photoOffsets);
	let photoOffsets = $state<Record<string, number>>({});
	$effect(() => {
		photoOffsets = { ...incomingPhotoOffsets };
	});
	let activeDrag = $state<{
		slug: string;
		pointerId: number;
		startY: number;
		startOffset: number;
		height: number;
		hasMoved: boolean;
	} | null>(null);

	let search = $state('');
	let searchIngredients = $derived(getIngredientsInText(search));

	let favouritesOnly = $state(browser && localStorage.getItem('favouritesOnly') == 'true');
	$effect(() => {
		if (browser) localStorage.setItem('favouritesOnly', favouritesOnly ? 'true' : 'false');
	});

	const savedTocView = browser ? localStorage.getItem('tocView') : null;
	let viewMode = $state<'list' | 'cards'>(
		savedTocView === 'list' || savedTocView === 'cards' ? savedTocView : 'cards'
	);
	$effect(() => {
		if (browser) localStorage.setItem('tocView', viewMode);
	});

	// Snapshot of favourites for filtering — updated only when filter triggers change,
	// not when individual favourites are toggled, so removing a favourite while
	// favouritesOnly is on doesn't immediately hide the item.
	let favouritesSnapshot = $state(new Set<string>([...favourites]));
	$effect(() => {
		void search;
		void viewMode;
		void favouritesOnly;
		favouritesSnapshot = untrack(() => new Set([...favourites]));
	});

	function filterPages(pages: Page[], parentFavourite = false): Page[] {
		return pages
			.map((x) =>
				isChapter(x) ? { ...x, pages: filterPages(x.pages, favouritesSnapshot.has(x.slug)) } : x
			)
			.filter(
				(x) =>
					((!favouritesOnly || parentFavourite || favouritesSnapshot.has(x.slug)) &&
						(search === '' || isPageMatch(x))) ||
					(isChapter(x) && x.pages.length > 0)
			);
	}

	function isPageMatch(page: Page) {
		if (search === '') return true;
		const searchLower = search.toLowerCase();

		if (page.title.toLowerCase().includes(searchLower)) return true;
		if (page.subtitle?.toLowerCase().includes(searchLower)) return true;

		if (!isRecipe(page)) return false;

		const matchingIngredients = page.normalizedIngredients.filter((x) =>
			searchIngredients.includes(x)
		);

		return matchingIngredients.length * 2 > searchIngredients.length;
	}

	let filteredPages = $derived(filterPages(data.rootPages));
	let listItemCount = $derived(
		filteredPages.reduce((n, p) => n + 1 + (isChapter(p) ? p.pages.length : 0), 0)
	);

	let filteredPagesWithRootPagesInVirtualChapters = $derived.by(() => {
		const result: (Chapter | { pages: Page[] })[] = [];
		for (const page of filteredPages) {
			if (isChapter(page)) {
				result.push(page);
			} else {
				if (result.length === 0 || 'title' in result[result.length - 1]) {
					result.push({ pages: [page] });
				} else {
					result[result.length - 1].pages.push(page);
				}
			}
		}
		return result;
	});

	function mostlyPhotoless(cards: Page[]): boolean {
		const withPhoto = cards.filter((p) => isRecipe(p) && p.photos.length > 0).length;
		return withPhoto < cards.length / 2;
	}

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent);
	}

	function previewUrl(page: Page): string | undefined {
		if (!isRecipe(page) || !page.preview) return undefined;
		return `/foto1/${page.preview}.webp`;
	}

	function photoOffset(photoSlug: string): number {
		return photoOffsets[photoSlug] ?? 0;
	}

	function previewOffset(page: Page): number {
		if (!isRecipe(page) || !page.preview) return 0;
		return photoOffset(page.preview);
	}

	function setPhotoOffset(photoSlug: string, offset: number) {
		const clamped = Math.max(-50, Math.min(50, offset));
		const rounded = Math.round(clamped * 100) / 100;
		const next = { ...photoOffsets };
		if (rounded === 0) {
			delete next[photoSlug];
		} else {
			next[photoSlug] = rounded;
		}
		photoOffsets = next;
	}

	function formatOffsetsNt() {
		const entries = Object.entries(photoOffsets)
			.filter(([, offset]) => offset !== 0)
			.sort(([a], [b]) => a.localeCompare(b, 'cs'));
		return entries
			.map(([slug, offset]) => {
				const formatted = Number.isInteger(offset) ? `${offset}` : `${offset}`.replace(/\.0+$/, '');
				return `${slug}: ${formatted}`;
			})
			.join('\n');
	}

	async function copyOffsetsNtToClipboard() {
		if (!browser || !('clipboard' in navigator)) return;
		await navigator.clipboard.writeText(formatOffsetsNt());
	}

	function startGridPhotoDrag(e: PointerEvent, photoSlug?: string) {
		if (!devmode.active || !photoSlug) return;
		if (e.button !== 0) return;
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const height = rect.height || 1;
		target.setPointerCapture(e.pointerId);
		activeDrag = {
			slug: photoSlug,
			pointerId: e.pointerId,
			startY: e.clientY,
			startOffset: photoOffset(photoSlug),
			height,
			hasMoved: false
		};
		e.preventDefault();
	}

	function moveGridPhotoDrag(e: PointerEvent) {
		if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
		const delta = e.clientY - activeDrag.startY;
		if (Math.abs(delta) >= 1) {
			activeDrag = { ...activeDrag, hasMoved: true };
		}
		const deltaPercent = (delta / activeDrag.height) * 100;
		setPhotoOffset(activeDrag.slug, activeDrag.startOffset - deltaPercent);
		e.preventDefault();
	}

	function endGridPhotoDrag(e: PointerEvent) {
		if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
		if (activeDrag.hasMoved) {
			void copyOffsetsNtToClipboard();
		}
		activeDrag = null;
		e.preventDefault();
	}

	function endGridPhotoDragFromCapture() {
		if (!activeDrag) return;
		if (activeDrag.hasMoved) {
			void copyOffsetsNtToClipboard();
		}
		activeDrag = null;
	}

	function except(a: string[], b: string[]) {
		return a.filter((x) => !b.includes(x));
	}

	function sortForGrid(pages: Page[], mixed: boolean): Page[] {
		if (!mixed) return pages;
		const hasPhoto = (p: Page) => isRecipe(p) && p.photos.length > 0;
		return [...pages].sort((a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)));
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
	autofocus={window.matchMedia('(pointer: fine)').matches}
	class="mb-3"
/>
{#if devmode.active && searchIngredients.length > 0}
	<p class="mb-2 text-muted small">Rozpoznané ingredience: {searchIngredients.join('; ')}</p>
{/if}
<div class="desktop-favourites d-none d-sm-block mb-3">
	<Input bind:checked={favouritesOnly} type="switch" label="Pouze oblíbené" class="mb-0" />
</div>

{#if viewMode === 'cards'}
	{#each filteredPagesWithRootPagesInVirtualChapters as page}
		{#if 'title' in page}
			<a href={page.slug} class="chapter-header" class:favourite={favourites.has(page.slug)}>
				<span>{page.title}</span>
				<span class="chapter-star"><FavouriteStar slug={page.slug} /></span>
			</a>
		{/if}
		{@const groupMostlyPhotoless = mostlyPhotoless(page.pages)}
		<div class="card-grid" class:mixed-grid={groupMostlyPhotoless}>
			{#each sortForGrid(page.pages, groupMostlyPhotoless) as item (item.slug)}
				{@const hasPhoto = !!item.preview}
				{@const photoSlug = hasPhoto ? item.preview : undefined}
				{@const compact = groupMostlyPhotoless && !hasPhoto}
				{@const spanTwo = groupMostlyPhotoless && hasPhoto}
				<a
					href={devmode.active ? undefined : item.slug}
					class="recipe-card"
					class:favourite={favourites.has(item.slug)}
					class:compact
					class:span-two={spanTwo}
				>
					{#if hasPhoto}
						<div
							class="card-img-wrap"
							class:stretch-img={spanTwo}
							class:dragging={activeDrag?.slug === photoSlug}
							class:dev-draggable={devmode.active}
							role="presentation"
							style="--photo-offset: {photoSlug ? photoOffset(photoSlug) : 0}"
							onpointerdown={(e) => startGridPhotoDrag(e, photoSlug)}
							onpointermove={moveGridPhotoDrag}
							onpointerup={endGridPhotoDrag}
							onpointercancel={endGridPhotoDrag}
							onlostpointercapture={endGridPhotoDragFromCapture}
						>
							<img
								src="/foto1/{item.preview}.webp"
								alt={item.title}
								loading="lazy"
								draggable="false"
							/>
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
	<div class="contents" class:single-col={listItemCount < 15}>
		<Nav class="flex-column">
			{#each filteredPages as page, i (`${page.slug}-${i}`)}
				<PhotoTooltip photoUrl={previewUrl(page)} offsetY={previewOffset(page)} side="left">
					<NavItem>
						<NavLink href={page.slug} class="d-flex gap-3" style="margin-top: {level(page) * -5}px">
							<div class="d-flex gap-2">
								<span class="star"><FavouriteStar slug={page.slug} /></span>
								<span class="page" style="padding-left: {level(page) * 15}px">
									{#if page.number}<span>{page.number}.&nbsp;</span>{/if}{page.title}
								</span>
							</div>
							<div>
								{#if page.page}<span class="d-none d-sm-inline">str.&nbsp;</span>{page.page}{/if}
							</div>
						</NavLink>
					</NavItem>
				</PhotoTooltip>
				{#if isChapter(page)}
					{#each page.pages as subPage, j (`${subPage.slug}-${j}`)}
						<PhotoTooltip
							photoUrl={previewUrl(subPage)}
							offsetY={previewOffset(subPage)}
							side="left"
						>
							<NavItem>
								<NavLink
									href={subPage.slug}
									class="d-flex gap-3"
									style="margin-top: {level(subPage) * -5}px"
								>
									<div class="d-flex gap-2">
										<span class="star"><FavouriteStar slug={subPage.slug} /></span>
										<span class="page" style="padding-left: {level(subPage) * 15}px">
											{#if subPage.number}<span>{subPage.number}.&nbsp;</span>{/if}{subPage.title}
										</span>
									</div>
									<div>
										{#if subPage.page}<span class="d-none d-sm-inline">str.&nbsp;</span
											>{subPage.page}{/if}
									</div>
								</NavLink>
							</NavItem>
						</PhotoTooltip>
					{/each}
				{/if}
			{:else}
				Žádné recepty
			{/each}
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

	.mobile-favourites :global(.form-check-input),
	.mobile-favourites :global(.form-check-label),
	.desktop-favourites :global(.form-check-input),
	.desktop-favourites :global(.form-check-label) {
		cursor: pointer;
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
		background: color-mix(in srgb, var(--bs-body-bg, white) 65%, transparent);
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
		background: color-mix(in srgb, var(--bs-body-bg, white) 65%, transparent);
		backdrop-filter: blur(4px);
		transition: background 0.18s ease;
	}

	.recipe-card:hover .card-body {
		background: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 18%,
			color-mix(in srgb, var(--bs-body-bg, white) 65%, transparent)
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
		object-position: center calc(50% + var(--photo-offset, 0) * 1%);
		transition: transform 0.3s ease;
	}

	.card-img-wrap.dev-draggable {
		cursor: ns-resize;
	}

	.card-img-wrap.dragging {
		outline: 2px dashed color-mix(in srgb, var(--bs-primary, #0d6efd) 75%, transparent);
		outline-offset: -2px;
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
		.contents:not(.single-col) {
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
