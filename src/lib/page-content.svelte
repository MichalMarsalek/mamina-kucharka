<script lang="ts">
	import { browser, dev } from '$app/environment';
	import { isChapter, isRecipe, isValuesField, type Page } from '$lib/content';
	import { Col, Image, Row } from '@sveltestrap/sveltestrap';
	import { SvelteSet } from 'svelte/reactivity';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import SvelteMarkdown from 'svelte-markdown';
	import AnchorRenderer from '$lib/anchor-renderer.svelte';
	import FavouriteStar from '$lib/favourite-star.svelte';
	import { declineUnit, normalizeIngredient, type IngredientPiece } from '$lib/ingredients';

	interface Props {
		page?: Page;
		edition?: string;
		lowRes?: boolean;
	}

	let { page, edition = '', lowRes = false }: Props = $props();
	let ingredientDebugMode = $derived(
		dev || (browser && window.location.href.toLowerCase().includes('localhost'))
	);

	const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 16];

	function gcd(a: number, b: number): number {
		return b === 0 ? a : gcd(b, a % b);
	}

	function formatDecimal(value: number): string {
		if (Number.isInteger(value)) return String(value);
		const s = value.toFixed(2).replace('.', ',');
		if (s.endsWith(',00')) return s.slice(0, -3);
		if (s.endsWith('0')) return s.slice(0, -1);
		return s;
	}

	function formatFraction(value: number): string {
		const whole = Math.floor(value);
		const frac = value - whole;
		if (Math.abs(frac) < 1e-8) return String(whole);

		let bestNum = 0;
		let bestDen = 1;
		let bestDiff = Infinity;

		for (const den of FRACTION_DENOMINATORS) {
			const num = Math.round(frac * den);
			const diff = Math.abs(frac - num / den);
			if (diff < bestDiff) {
				bestDiff = diff;
				bestNum = num;
				bestDen = den;
			}
		}

		if (bestDiff > 1e-6 || bestNum === 0) return formatDecimal(value);

		const d = gcd(bestNum, bestDen);
		const simpNum = bestNum / d;
		const simpDen = bestDen / d;

		if (whole === 0) return `${simpNum}/${simpDen}`;
		return `${whole} ${simpNum}/${simpDen}`;
	}

	function formatScaled(value: number): string {
		return value < 1 ? formatFraction(value) : formatDecimal(value);
	}

	function formatAnimated(value: number): string {
		return String(Math.round(value));
	}

	function parseNumericToken(token: string): number | null {
		const trimmed = token.trim();
		const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
		if (fraction) {
			const numerator = Number(fraction[1]);
			const denominator = Number(fraction[2]);
			if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0)
				return null;
			return numerator / denominator;
		}
		const decimal = Number(trimmed.replace(',', '.'));
		return Number.isFinite(decimal) ? decimal : null;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const markdownRenderers = { link: AnchorRenderer as any };

	// Interactive recipe state
	let checkedIngredients = new SvelteSet<number>();
	let completedSteps = new SvelteSet<number>();
	let portionMultiplier = $state(1);
	const animatedPortionMultiplier = tweened(1, { duration: 750, easing: cubicOut });
	let isPortionAnimating = $state(false);
	let recipePortions = $derived(
		page && isRecipe(page) && page.portions ? page.portions * portionMultiplier : null
	);

	$effect(() => {
		// Reset when page changes
		void page?.slug;
		checkedIngredients.clear();
		completedSteps.clear();
		portionMultiplier = 1;
		isPortionAnimating = false;
		void animatedPortionMultiplier.set(1, { duration: 0 });
	});

	function toggleIngredient(i: number) {
		if (!checkedIngredients.delete(i)) checkedIngredients.add(i);
	}

	function toggleStep(i: number) {
		if (!completedSteps.delete(i)) completedSteps.add(i);
	}

	function scaleQuantity(
		rawQuantity: string,
		multiplier: number,
		animated = false,
		targetMultiplier = multiplier
	): string {
		if (!animated && multiplier === 1) return rawQuantity;

		const numberWithUnit = rawQuantity.trim().match(/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)\s+(\S+)$/u);
		if (numberWithUnit) {
			const original = parseNumericToken(numberWithUnit[1]);
			if (original !== null) {
				const scaledCurrent = original * multiplier;
				const scaledTarget = original * targetMultiplier;
				const displayAmount = animated && original > 5 ? Math.round(scaledCurrent) : scaledTarget;
				const formattedNumber =
					animated && original > 5 ? formatAnimated(scaledCurrent) : formatScaled(scaledTarget);
				const unit = numberWithUnit[2];
				const declinedUnit = declineUnit(unit, displayAmount) ?? unit;
				return `${formattedNumber} ${declinedUnit}`;
			}
		}

		const formatValue = (original: number, scaledCurrent: number, scaledTarget: number) => {
			if (animated && original > 5) {
				return formatAnimated(scaledCurrent);
			}
			return formatScaled(scaledTarget);
		};

		const fractionTokens: string[] = [];
		let result = rawQuantity.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (_, n, d) => {
			const num = Number(n);
			const den = Number(d);
			if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return `${n}/${d}`;
			const original = num / den;
			const scaledCurrent = original * multiplier;
			const scaledTarget = original * targetMultiplier;
			const token = `__FRACTION_${'x'.repeat(fractionTokens.length + 1)}__`;
			fractionTokens.push(formatValue(original, scaledCurrent, scaledTarget));
			return token;
		});

		result = result.replace(/\d+(?:[.,]\d+)?/g, (match) => {
			const num = parseFloat(match.replace(',', '.'));
			const scaledCurrent = num * multiplier;
			const scaledTarget = num * targetMultiplier;
			return formatValue(num, scaledCurrent, scaledTarget);
		});

		result = result.replace(/__FRACTION_(x+)__/g, (_, xs) => fractionTokens[xs.length - 1] ?? _);

		if (!/^(?:\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)/.test(rawQuantity.trim())) {
			const scaledTarget = targetMultiplier;
			const displayAmount = scaledTarget;
			const numberText = formatScaled(scaledTarget);
			const declinedUnit = declineUnit(result.trim(), displayAmount) ?? result;
			return `${numberText} ${declinedUnit}`;
		}

		return result;
	}

	function renderPiece(
		line: IngredientPiece[],
		piece: IngredientPiece,
		index: number,
		multiplier: number,
		animated = false,
		targetMultiplier = multiplier
	): string {
		if (piece.kind === 'prose') {
			return piece.content;
		}

		if (piece.kind === 'quantity') {
			return scaleQuantity(piece.content, multiplier, animated, targetMultiplier);
		}

		let ingredientText = piece.content;
		const prevPiece = line[index - 1];
		if (
			prevPiece?.kind === 'quantity' &&
			ingredientText.length > 0 &&
			!/^\s/.test(ingredientText)
		) {
			ingredientText = ` ${ingredientText}`;
		}
		return ingredientText;
	}

	function ingredientLineTitle(line: IngredientPiece[]): string {
		if (ingredientDebugMode) {
			return JSON.stringify(line);
		}
		const normalized = [
			...new Set(
				line
					.filter((piece) => piece.kind === 'ingredient')
					.map((piece) => normalizeIngredient(piece.content))
			)
		];
		return normalized.join(', ');
	}

	function isLink(x: string) {
		try {
			const url = new URL(x);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch {
			return false;
		}
	}

	function onTitleClick() {
		if (!page) {
			return;
		}
		const url = `https://recepty.radka.maršálková.eu/${edition}/${page.slug}${window.location.search}`;
		navigator.clipboard.writeText(url);
	}

	let pageRecipe = $derived(page && isRecipe(page) ? page : null);

	let allIngredientsChecked = $derived(
		pageRecipe && pageRecipe.ingredients.length > 0
			? checkedIngredients.size === pageRecipe.ingredients.length
			: false
	);

	let stepProgress = $derived(
		pageRecipe && pageRecipe.steps.length > 0
			? Math.round((completedSteps.size / pageRecipe.steps.length) * 100)
			: 0
	);

	function adjustPortion(delta: number) {
		const next = portionMultiplier + delta;
		if (next < 0.5 || next > 10 || next === portionMultiplier) return;

		isPortionAnimating = true;
		portionMultiplier = next;
		void animatedPortionMultiplier.set(next).then(() => {
			if (portionMultiplier === next) {
				isPortionAnimating = false;
			}
		});
	}
</script>

{#key page?.slug}
	<main>
		<Row>
			{#if page}
				{@const recipe = isRecipe(page) ? page : null}
				{#if recipe && recipe.photos.length > 0}
					<Col xs="12" lg="6">
						<div class="photos">
							{#each recipe.photos as [photoName, photoSlug] (photoSlug)}
								<div class="photo">
									<Image
										fluid
										class="base-photo"
										src="/foto1/{photoSlug}.webp"
										alt={photoName ?? page.title}
									/>
									{#if !lowRes}
										<Image
											fluid
											class="highres-photo"
											src="/foto/{photoSlug}.webp"
											alt=""
											aria-hidden="true"
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if photoName}
										<p class="photo-caption">{photoName}</p>
									{/if}
								</div>
							{/each}
						</div>
					</Col>
				{/if}
				<Col>
					<div
						out:fade={{ duration: 150 }}
						in:fade={{ delay: 150 }}
						class:chapter={isChapter(page)}
					>
						<div>
							<div class="snap-recipe-title"></div>
							<h1 class="d-flex justify-content-between align-items-start">
								<div class="header">
									<span
										class="title"
										onclick={onTitleClick}
										role="button"
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && onTitleClick()}
										style:cursor="copy"
										title="Kliknutím zkopírujete odkaz na tuto stránku"
									>
										{page.title}
									</span>
									{#if page.subtitle}<br />{page.subtitle}{/if}
									{#if recipe}{#each recipe.tags as tag (tag)}
											<span class="badge badge-primary">{tag}</span>
										{/each}{/if}
								</div>
								<div class="star"><FavouriteStar slug={page.slug} large /></div>
							</h1>
							{#if page.page}<div class="mb-2 page-ref">str. {page.page}</div>{/if}

							{#if recipe && recipe.ingredients.length > 0}
								<div class="section-header">
									<h2 style="min-width: 6rem">
										{#if recipePortions}
											Na {recipePortions === 0.5 ? '½' : recipePortions}
											{recipePortions === 1 ? 'porci' : recipePortions < 5 ? 'porce' : 'porcí'}:
										{:else}
											Ingredience:
										{/if}
									</h2>
									<div class="portion-scaler">
										<button
											class="scaler-btn"
											onclick={() => adjustPortion(portionMultiplier > 1 ? -1 : -0.5)}
											disabled={portionMultiplier <= 0.5 || recipePortions === 1}>−</button
										>
										<span class="multiplier-badge">
											{portionMultiplier === 0.5 ? '×½' : `×${portionMultiplier}`}
										</span>
										<button
											class="scaler-btn"
											onclick={() => adjustPortion(portionMultiplier < 1 ? 0.5 : 1)}
											disabled={portionMultiplier >= 5}>+</button
										>
										{#if portionMultiplier !== 1}
											<button
												class="reset-btn"
												onclick={() => adjustPortion(1 - portionMultiplier)}
												title="Resetovat">↺</button
											>
										{/if}
									</div>
									{#if checkedIngredients.size > 0}
										<button
											class="clear-btn"
											onclick={() => checkedIngredients.clear()}
											title="Zrušit zaškrtnutí">Zrušit výběr</button
										>
									{/if}
								</div>
								<ul class="ingredient-list">
									{#each recipe.ingredients as item, i (i)}
										<li>
											<button
												type="button"
												class="ingredient-item"
												class:checked={checkedIngredients.has(i)}
												title={ingredientDebugMode ? ingredientLineTitle(item) : undefined}
												onclick={() => toggleIngredient(i)}
											>
												<span class="check-icon">{checkedIngredients.has(i) ? '✓' : '○'}</span>
												<span class="ingredient-text">
													{#each item as piece, pieceIndex (`${i}-${pieceIndex}`)}
														<span
															class="ingredient-piece"
															class:debug-piece={ingredientDebugMode}
															class:quantity-piece={ingredientDebugMode &&
																piece.kind === 'quantity'}
															class:ingredient-piece-kind={ingredientDebugMode &&
																piece.kind === 'ingredient'}
															class:prose-piece={ingredientDebugMode && piece.kind === 'prose'}
															>{renderPiece(
																item,
																piece,
																pieceIndex,
																$animatedPortionMultiplier,
																isPortionAnimating,
																portionMultiplier
															)}</span
														>
													{/each}
												</span>
											</button>
										</li>
									{/each}
								</ul>
								{#if allIngredientsChecked}
									<div class="all-ready" in:fly={{ y: 8, duration: 300 }}>
										Všechny ingredience připraveny! 🎉
									</div>
								{/if}
							{/if}

							{#if recipe}
								<div class="section-header">
									<h2>Postup:</h2>
									{#if completedSteps.size > 0}
										<div class="step-progress-wrap">
											<div class="step-progress-bar">
												<div class="step-progress-fill" style:width="{stepProgress}%"></div>
											</div>
											<span class="step-count">{completedSteps.size}/{recipe.steps.length}</span>
										</div>
									{/if}
									{#if completedSteps.size > 0}
										<button
											class="clear-btn"
											onclick={() => completedSteps.clear()}
											title="Zrušit zaškrtnutí kroků">Zrušit</button
										>
									{/if}
								</div>
								<ol class="step-list">
									{#each recipe.steps as item, i (i)}
										<li>
											<button
												type="button"
												class="step-item"
												class:completed={completedSteps.has(i)}
												onclick={() => toggleStep(i)}
											>
												<span class="step-icon">❯</span>
												<span class="step-text">{item}</span>
											</button>
										</li>
									{/each}
								</ol>
								{#if stepProgress == 100}
									<div class="all-ready" in:fly={{ y: 8, duration: 300 }}>Dobrou chuť! 🍴</div>
								{/if}
							{/if}

							{#each page.customFields as field, i (`${field.name ?? ''}-${i}`)}
								{#if field.name}
									<h2>{field.name}:</h2>
								{/if}
								{#if isValuesField(field)}
									<ul>
										{#each field.values as value, j (`${value}-${j}`)}
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
									<SvelteMarkdown source={field.markdown} renderers={markdownRenderers} />
								{/if}
							{/each}
						</div>
					</div>
				</Col>
			{:else}
				Tento recept tady bohužel nemáme.
			{/if}
		</Row>
	</main>
{/key}

<style>
	h1 .badge {
		font-size: initial;
	}

	h2 {
		font-size: 1rem;
	}

	/* Photos */
	.photos {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.photo {
		position: relative;
		overflow: hidden;
		border-radius: 8px;
		transition: box-shadow 0.2s ease;
		margin: 0;
		background: transparent;
		width: 100%;
		display: block;
	}

	:global(.base-photo) {
		display: block;
		width: 100%;
	}

	:global(.highres-photo) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.photo:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.photo:focus-visible {
		outline: 2px solid var(--bs-primary, #0d6efd);
		outline-offset: 2px;
	}

	@media screen and (max-width: 992px) {
		.photo {
			max-height: 30vh;
		}
		.photo :global(img) {
			max-height: 30vh;
			object-fit: cover;
			width: 100%;
		}
	}

	@media screen and (max-width: 576px) and (orientation: portrait) {
		.photo:not(:first-child) {
			display: none;
		}
		.photo {
			height: 30vh;
		}
		main {
			min-height: calc(100vh - 10px);
		}
	}

	.header {
		max-width: calc(100% - 30px);
	}

	.header .title {
		text-transform: uppercase;
	}

	/* Section headers */
	.section-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
		margin-bottom: 0.3rem;
	}

	.section-header h2 {
		margin: 0;
	}

	/* Portion scaler */
	.portion-scaler {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.scaler-btn {
		width: 26px;
		height: 26px;
		border: 1px solid var(--bs-border-color, #dee2e6);
		background: var(--bs-body-bg, white);
		color: var(--bs-body-color, #212529);
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition:
			background 0.15s,
			transform 0.1s,
			color 0.15s;
	}

	.scaler-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 28%, var(--bs-body-bg, white));
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 55%,
			var(--bs-border-color, #dee2e6)
		);
		color: var(--bs-body-color, #212529);
	}

	.scaler-btn:active:not(:disabled) {
		transform: scale(0.88);
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 45%, var(--bs-body-bg, white));
	}

	.scaler-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.multiplier-badge {
		font-size: 0.75rem;
		padding: 1px 7px;
		background: var(--bs-secondary-bg, #e9ecef);
		border-radius: 10px;
		font-weight: 600;
		min-width: 32px;
		text-align: center;
	}

	.reset-btn,
	.clear-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--bs-secondary, #6c757d);
		padding: 0 3px;
		font-size: 0.8rem;
		transition: color 0.15s;
	}

	.reset-btn {
		font-size: 1rem;
		transition:
			color 0.15s,
			transform 0.2s;
	}

	.reset-btn:hover {
		color: var(--bs-body-color, #212529);
		transform: rotate(-180deg);
	}

	.clear-btn:hover {
		color: var(--bs-body-color, #212529);
		text-decoration: underline;
	}

	/* Ingredient list */
	.ingredient-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem 0;
	}

	.ingredient-item {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		width: 100%;
		padding: 3px 6px;
		border: none;
		background: transparent;
		text-align: left;
		font: inherit;
		border-radius: 6px;
		cursor: pointer;
		transition:
			background 0.12s,
			opacity 0.15s;
		-webkit-user-select: none;
		user-select: none;
	}

	.ingredient-item:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
	}

	.ingredient-item.checked .ingredient-text {
		text-decoration: line-through;
		opacity: 0.4;
	}

	.ingredient-item.checked .check-icon {
		color: var(--bs-primary, #0d6efd);
	}

	.check-icon {
		font-size: 0.75rem;
		width: 1rem;
		text-align: center;
		color: var(--bs-secondary, #6c757d);
		flex-shrink: 0;
		transition: color 0.12s;
	}

	.ingredient-text {
		transition:
			text-decoration 0.12s,
			opacity 0.12s;
	}

	.ingredient-piece.debug-piece {
		padding: 0 2px;
		border-radius: 3px;
	}

	.ingredient-piece.quantity-piece {
		background: color-mix(in srgb, #0d6efd 24%, transparent);
		color: #084298;
	}

	.ingredient-piece.ingredient-piece-kind {
		background: color-mix(in srgb, #198754 20%, transparent);
		color: #0f5132;
	}

	.all-ready {
		padding: 8px 12px;
		background: var(--bs-primary-bg-subtle, #cfe2ff);
		color: var(--bs-primary-text-emphasis, #052c65);
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	/* Step progress */
	.step-progress-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 80px;
		max-width: 160px;
	}

	.step-progress-bar {
		flex: 1;
		height: 5px;
		background: var(--bs-secondary-bg, #e9ecef);
		border-radius: 3px;
		overflow: hidden;
	}

	.step-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--bs-primary, #0d6efd), #6ea8fe);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.step-count {
		font-size: 0.72rem;
		color: var(--bs-secondary, #6c757d);
		white-space: nowrap;
	}

	/* Step list */
	.step-list {
		list-style: none;
		padding: 0;
		margin-bottom: 1rem;
	}

	.step-item {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		width: 100%;
		padding: 3px 6px;
		border: none;
		background: transparent;
		text-align: left;
		font: inherit;
		border-radius: 6px;
		cursor: pointer;
		transition:
			background 0.12s,
			opacity 0.15s;
		margin-bottom: 0.35rem;
		-webkit-user-select: none;
		user-select: none;
	}

	.step-item:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
	}

	.step-item.completed .step-text {
		text-decoration: line-through;
		opacity: 0.4;
	}

	.step-item.completed .step-icon {
		color: var(--bs-primary, #0d6efd);
	}

	.step-icon {
		font-size: 0.8rem;
		width: 1rem;
		text-align: center;
		color: var(--bs-secondary, #6c757d);
		flex-shrink: 0;
		transition: color 0.12s;
	}

	.step-text {
		transition:
			opacity 0.15s,
			text-decoration 0.12s;
	}

	:global(figcaption),
	.photo-caption {
		display: flex;
		justify-content: center;
		font-style: italic;
		margin: 0;
	}

	:global(.right) {
		text-align: right;
		width: 100%;
		margin-bottom: 20px;
	}

	:global(.center) {
		text-align: center;
		width: 100%;
		margin-bottom: 20px;
	}

	.chapter {
		text-align: center;
		display: flex;
		justify-content: center;
		margin-top: 100px;
	}

	.chapter > div {
		min-width: 25vw;
	}

	@media screen and (max-width: 992px) {
		.snap-recipe-title {
			scroll-snap-align: start;
			scroll-snap-stop: always;
		}

		.scaler-btn {
			width: 34px;
			height: 34px;
			font-size: 1.3rem;
		}
	}
</style>
