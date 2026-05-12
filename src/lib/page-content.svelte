<script lang="ts">
	import { browser, dev } from '$app/environment';
	import {
		isChapter,
		isIngredientsField,
		isRecipe,
		isStringArrayField,
		type Page
	} from '$lib/content';
	import { Col, Image, Row } from '@sveltestrap/sveltestrap';
	import { SvelteSet } from 'svelte/reactivity';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import SvelteMarkdown from 'svelte-markdown';
	import AnchorRenderer from '$lib/anchor-renderer.svelte';
	import FavouriteStar from '$lib/favourite-star.svelte';
	import devmode from '$lib/devmode.svelte';
	import {
		declineUnit,
		declineIngredient,
		normalizeIngredient,
		type IngredientPiece
	} from '$lib/ingredients';

	interface Props {
		page?: Page;
		edition?: string;
		lowRes?: boolean;
		getPhotoOffset?: (photoSlug: string) => number;
	}

	let { page, edition = '', lowRes = false, getPhotoOffset }: Props = $props();
	let ingredientDebugMode = $derived(devmode.active);

	function photoOffset(photoSlug: string): number {
		return getPhotoOffset?.(photoSlug) ?? 0;
	}

	const FRACTION_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 16];

	const UNICODE_FRACTIONS: Record<string, string> = {
		'1/2': '½',
		'1/3': '⅓',
		'2/3': '⅔',
		'1/4': '¼',
		'3/4': '¾',
		'1/5': '⅕',
		'2/5': '⅖',
		'3/5': '⅗',
		'4/5': '⅘',
		'1/6': '⅙',
		'5/6': '⅚',
		'1/8': '⅛',
		'3/8': '⅜',
		'5/8': '⅝',
		'7/8': '⅞'
	};

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

		const fracStr = `${simpNum}/${simpDen}`;
		const unicodeFrac = UNICODE_FRACTIONS[fracStr] ?? fracStr;
		if (whole === 0) return unicodeFrac;
		return `${whole}\u2009${unicodeFrac}`;
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

	function parseQuantityBounds(quantity: string): {
		lower: number;
		upper: number;
		hasRange: boolean;
		unit?: string;
	} | null {
		const match = quantity
			.trim()
			.match(
				/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?))?(?:\s+(\S+(?:\s+\S+)*))?$/u
			);
		if (!match) return null;

		const lower = parseNumericToken(match[1]);
		if (lower === null) return null;

		const upperRaw = match[2] ?? match[1];
		const upper = parseNumericToken(upperRaw);
		if (upper === null) return null;

		const unit = match[3]?.trim();
		return { lower, upper, hasRange: match[2] !== undefined, unit };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const markdownRenderers = { link: AnchorRenderer as any };

	// Interactive recipe state
	let checkedIngredients = new SvelteSet<string>();
	let completedSteps = new SvelteSet<string>();
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

	function ingredientKey(fieldIndex: number, itemIndex: number) {
		return `${fieldIndex}-${itemIndex}`;
	}

	function stepKey(fieldIndex: number, stepIndex: number) {
		return `${fieldIndex}-${stepIndex}`;
	}

	function toggleIngredient(key: string) {
		if (!checkedIngredients.delete(key)) checkedIngredients.add(key);
	}

	function toggleStep(key: string) {
		if (!completedSteps.delete(key)) completedSteps.add(key);
	}

	function scaleQuantity(
		rawQuantity: string,
		multiplier: number,
		animated = false,
		targetMultiplier = multiplier
	): string {
		const formatValue = (original: number, scaledCurrent: number, scaledTarget: number) => {
			if (animated && original > 5) {
				return formatAnimated(scaledCurrent);
			}
			return formatScaled(scaledTarget);
		};

		const parsed = parseQuantityBounds(rawQuantity);
		if (parsed?.unit) {
			const scaledLowerCurrent = parsed.lower * multiplier;
			const scaledLowerTarget = parsed.lower * targetMultiplier;
			const scaledUpperCurrent = parsed.upper * multiplier;
			const scaledUpperTarget = parsed.upper * targetMultiplier;

			const lowerText = formatValue(parsed.lower, scaledLowerCurrent, scaledLowerTarget);
			const upperText = formatValue(parsed.upper, scaledUpperCurrent, scaledUpperTarget);
			const numberText = parsed.hasRange ? `${lowerText}-${upperText}` : lowerText;

			// For ranges, pick declension form by upper bound.
			const formOriginalAmount = parsed.upper;
			const formNewAmount =
				animated && parsed.upper > 5 ? Math.round(scaledUpperCurrent) : scaledUpperTarget;
			const declinedUnit =
				declineUnit(parsed.unit, formOriginalAmount, formNewAmount) ?? parsed.unit;

			return `${numberText} ${declinedUnit}`;
		}

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
			if (targetMultiplier === 1) return result;
			const scaledTarget = targetMultiplier;
			const displayAmount = scaledTarget;
			const declinedUnit = declineUnit(result.trim(), 1, displayAmount);
			if (declinedUnit === undefined) return result;
			const numberText = formatScaled(scaledTarget);
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
		if (piece.quantity) {
			const parsedQuantity = parseQuantityBounds(piece.quantity);
			const isUnitless = parsedQuantity && !parsedQuantity.unit;
			if (isUnitless && parsedQuantity !== null) {
				// For ranges, pick declension form by upper bound.
				const originalAmount = parsedQuantity.upper;
				const newAmount = parsedQuantity.upper * targetMultiplier;
				ingredientText = declineIngredient(piece.content, originalAmount, newAmount);
			}
		}
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
	let firstIngredientFieldIndex = $derived(
		page ? page.fields.findIndex((field) => isIngredientsField(field)) : -1
	);
	let firstStepsFieldIndex = $derived(
		page
			? page.fields.findIndex((field) => field.kind === 'steps' && isStringArrayField(field))
			: -1
	);

	let totalStepsCount = $derived(
		page
			? page.fields.reduce(
					(total, field) =>
						total + (field.kind === 'steps' && isStringArrayField(field) ? field.values.length : 0),
					0
				)
			: 0
	);

	let completedStepsCountAll = $derived.by(() => {
		if (!page) return 0;
		let completed = 0;
		for (let fieldIndex = 0; fieldIndex < page.fields.length; fieldIndex++) {
			const field = page.fields[fieldIndex];
			if (field.kind !== 'steps' || !isStringArrayField(field)) continue;
			for (let stepIndex = 0; stepIndex < field.values.length; stepIndex++) {
				if (completedSteps.has(stepKey(fieldIndex, stepIndex))) {
					completed++;
				}
			}
		}
		return completed;
	});

	let stepProgressAll = $derived(
		totalStepsCount > 0 ? Math.round((completedStepsCountAll / totalStepsCount) * 100) : 0
	);

	function clearIngredientsForField(fieldIndex: number, lineCount: number) {
		for (let i = 0; i < lineCount; i++) {
			checkedIngredients.delete(ingredientKey(fieldIndex, i));
		}
	}

	function checkedIngredientCount(fieldIndex: number, lineCount: number) {
		let count = 0;
		for (let i = 0; i < lineCount; i++) {
			if (checkedIngredients.has(ingredientKey(fieldIndex, i))) {
				count++;
			}
		}
		return count;
	}

	function clearStepsForField(fieldIndex: number, stepCount: number) {
		for (let i = 0; i < stepCount; i++) {
			completedSteps.delete(stepKey(fieldIndex, i));
		}
	}

	function clearAllSteps() {
		if (!page) return;
		for (let fieldIndex = 0; fieldIndex < page.fields.length; fieldIndex++) {
			const field = page.fields[fieldIndex];
			if (field.kind !== 'steps' || !isStringArrayField(field)) continue;
			clearStepsForField(fieldIndex, field.values.length);
		}
	}

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
				{#if page.photos?.length > 0}
					<Col xs="12" lg="6">
						<div class="photos">
							{#each page.photos as [photoName, photoSlug] (photoSlug)}
								<div class="photo" style="--photo-offset: {photoOffset(photoSlug)};">
									<Image
										fluid
										class="base-photo"
										src="/foto1/{photoSlug}.webp"
										alt={photoName ?? page.title}
										style="object-position: center calc(50% + var(--photo-offset, 0) * 1%);"
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
											style="object-position: center calc(50% + var(--photo-offset, 0) * 1%);"
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
									{#if recipe?.tags?.length}{#each recipe.tags as tag (tag)}<span
												class="badge text-bg-primary recipe-tag">{tag}</span
											>{/each}{/if}
								</div>
								<div class="star"><FavouriteStar slug={page.slug} large /></div>
							</h1>
							{#if page.page}<div class="page-ref">📖 str.&nbsp;{page.page}</div>{/if}

							{#each page.fields as field, fieldIndex (`${field.kind}-${field.name}-${fieldIndex}`)}
								{#if isIngredientsField(field)}
									{@const selected = checkedIngredientCount(fieldIndex, field.values.length)}
									{@const isFirstIngredientField = fieldIndex === firstIngredientFieldIndex}
									<div class="section-header">
										<h2 style="min-width: 6rem">
											{#if isFirstIngredientField && field.name === 'Ingredience' && recipePortions}
												Na {recipePortions === 0.5 ? '½' : recipePortions}
												{recipePortions === 1 ? 'porci' : recipePortions < 5 ? 'porce' : 'porcí'}:
											{:else}
												{field.name}:
											{/if}
										</h2>
										{#if isFirstIngredientField}
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
										{/if}
										{#if selected > 0}
											<button
												class="clear-btn"
												onclick={() => clearIngredientsForField(fieldIndex, field.values.length)}
												title="Zrušit zaškrtnutí">Zrušit výběr</button
											>
										{/if}
									</div>
									<ul class="ingredient-list">
										{#each field.values as item, i (i)}
											{@const key = ingredientKey(fieldIndex, i)}
											<li>
												<button
													type="button"
													class="ingredient-item"
													class:checked={checkedIngredients.has(key)}
													title={ingredientDebugMode ? ingredientLineTitle(item) : undefined}
													onclick={() => toggleIngredient(key)}
												>
													<span class="check-icon">{checkedIngredients.has(key) ? '✓' : '○'}</span>
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
									{#if field.values.length > 0 && selected === field.values.length}
										<div class="all-ready" in:fly={{ y: 8, duration: 300 }}>
											Všechny ingredience připraveny! 🎉
										</div>
									{/if}
								{:else if field.kind === 'steps' && isStringArrayField(field)}
									{@const isFirstStepsField = fieldIndex === firstStepsFieldIndex}
									<div class="section-header">
										<h2>{field.name}:</h2>
										{#if isFirstStepsField && completedStepsCountAll > 0}
											<div class="step-progress-wrap">
												<div class="step-progress-bar">
													<div class="step-progress-fill" style:width="{stepProgressAll}%"></div>
												</div>
												<span class="step-count">{completedStepsCountAll}/{totalStepsCount}</span>
											</div>
										{/if}
										{#if isFirstStepsField && completedStepsCountAll > 0}
											<button
												class="clear-btn"
												onclick={clearAllSteps}
												title="Zrušit zaškrtnutí kroků">Zrušit</button
											>
										{/if}
									</div>
									<ol class="step-list">
										{#each field.values as item, i (i)}
											{@const key = stepKey(fieldIndex, i)}
											<li>
												<button
													type="button"
													class="step-item"
													class:completed={completedSteps.has(key)}
													onclick={() => toggleStep(key)}
												>
													<span class="step-icon">❯</span>
													<span class="step-text">{item}</span>
												</button>
											</li>
										{/each}
									</ol>
									{#if isFirstStepsField && stepProgressAll === 100 && totalStepsCount > 0}
										<div class="all-ready" in:fly={{ y: 8, duration: 300 }}>Dobrou chuť! 🍴</div>
									{/if}
								{:else if field.kind === 'intro'}
									<div class="intro-field">
										{#if field.name && field.name !== 'Intro'}
											<div class="intro-label">{field.name}</div>
										{/if}
										{#if typeof field.values === 'string'}
											<p class="intro-text">{field.values}</p>
										{:else if isStringArrayField(field)}
											{#each field.values as value, j (`${value}-${j}`)}
												<p class="intro-text">{value}</p>
											{/each}
										{/if}
									</div>
								{:else if field.kind === 'link'}
									<div class="link-field">
										<div class="link-label">{field.name}</div>
										{#if typeof field.values === 'string'}
											<SvelteMarkdown
												source={field.values as string}
												renderers={markdownRenderers}
											/>
										{:else if isStringArrayField(field)}
											<ul class="link-list">
												{#each field.values as value, j (`${value}-${j}`)}
													<li><SvelteMarkdown source={value} renderers={markdownRenderers} /></li>
												{/each}
											</ul>
										{/if}
									</div>
								{:else if field.kind === 'note'}
									<div class="note-box">
										{#if field.name}
											<div class="note-header">
												<span class="note-icon">💡</span>
												<strong>{field.name}</strong>
											</div>
										{/if}
										{#if typeof field.values === 'string'}
											<p class="note-content">{field.values}</p>
										{:else if isStringArrayField(field)}
											<ul class="note-content">
												{#each field.values as value, j (`${value}-${j}`)}
													<li><SvelteMarkdown source={value} renderers={markdownRenderers} /></li>
												{/each}
											</ul>
										{/if}
									</div>
								{:else if field.kind === 'markdown'}
									{#if field.name && field.name !== 'Markdown'}<h2>{field.name}:</h2>{/if}
									<SvelteMarkdown source={field.values as string} renderers={markdownRenderers} />
								{:else if typeof field.values === 'string'}
									<p class="field-inline">
										{#if field.name}<strong>{field.name}:</strong>{/if}
										{field.values}
									</p>
								{:else if isStringArrayField(field)}
									{#if field.name}<h2>{field.name}:</h2>{/if}
									<ul class="plain-list">
										{#each field.values as value, j (`${value}-${j}`)}
											<li>
												<SvelteMarkdown source={value} renderers={markdownRenderers} />
											</li>
										{/each}
									</ul>
								{/if}
							{/each}
							{#if page.photos?.length > 1 && !lowRes}
								<div class="mobile-extra-photos">
									{#each page.photos.slice(1) as [photoName, photoSlug] (photoSlug)}
										<div class="photo" style="--photo-offset: {photoOffset(photoSlug)};">
											<Image
												fluid
												class="base-photo"
												src="/foto1/{photoSlug}.webp"
												alt={photoName ?? page.title}
												style="object-position: center calc(50% + var(--photo-offset, 0) * 1%);"
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
													style="object-position: center calc(50% + var(--photo-offset, 0) * 1%);"
												/>
											{/if}
											{#if photoName}
												<p class="photo-caption">{photoName}</p>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
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
	.recipe-tag {
		margin-left: 0.35rem;
		vertical-align: middle;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.page-ref {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-bottom: 0.6rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.8rem;
		color: var(--bs-secondary, #6c757d);
		border: 1px solid var(--bs-border-color, #dee2e6);
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
		.photos .photo:not(:first-child) {
			display: none;
		}
		.photo {
			height: 30vh;
		}
		main {
			min-height: calc(100vh - 10px);
		}
	}

	.mobile-extra-photos {
		display: none;
	}

	@media screen and (max-width: 576px) and (orientation: portrait) {
		.mobile-extra-photos {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin-top: 1rem;
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

	/* Link field */
	.link-field {
		text-align: right;
		margin-bottom: 0.75rem;
	}

	.link-label {
		font-size: 0.85rem;
		color: var(--bs-secondary, #6c757d);
		margin-bottom: 0.15rem;
	}

	.link-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* Plain field list */
	.plain-list li {
		margin-bottom: 0.1rem;
	}

	.plain-list li :global(p) {
		margin: 0;
	}

	/* Intro field */
	.intro-field {
		text-align: center;
		margin-bottom: 1rem;
	}

	@media screen and (min-width: 992px) {
		.intro-field {
			max-width: 85%;
			margin-left: auto;
			margin-right: auto;
		}
	}

	.intro-label {
		font-style: italic;
		color: var(--bs-secondary, #6c757d);
		font-size: 0.85rem;
		margin-bottom: 0.15rem;
	}

	.intro-text {
		font-style: italic;
		margin: 0;
	}

	/* Note box */
	.note-box {
		background: var(--bs-warning-bg-subtle, #fff3cd);
		border-left: 3px solid var(--bs-warning, #ffc107);
		border-radius: 6px;
		padding: 0.6rem 0.9rem;
		margin-bottom: 1rem;
	}

	.note-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.25rem;
	}

	.note-icon {
		font-size: 0.9rem;
	}

	.note-content {
		margin: 0;
	}

	.note-box ul.note-content {
		padding-left: 1.2rem;
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
