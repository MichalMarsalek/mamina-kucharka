<script lang="ts">
	import {
		isIngredientsField,
		isRecipe,
		isStringArrayField,
		type Content,
		type RecipeTag
	} from '$lib/content';
	import { Col, Row } from '@sveltestrap/sveltestrap';
	import devmode from '$lib/devmode.svelte';
	import { hasIngredientDeclensionEntry, type IngredientPiece } from '$lib/ingredients';

	devmode.enable();

	let { data }: { data: Content } = $props();
	let recipes = $derived(data.pages.filter(isRecipe));
	let ingredients = $derived(frequencies(recipes.flatMap((x) => x.normalizedIngredients)));
	let ingredientsWithoutDeclension = $derived(
		frequencies(
			recipes
				.flatMap((recipe) =>
					recipe.fields.filter(isIngredientsField).flatMap((field) => field.values)
				)
				.flatMap((line) => line)
				.filter((piece) => piece.kind === 'ingredient')
				.map((piece) => piece.content.trim())
				.filter((ingredient) => ingredient.length > 0)
				.filter((ingredient) => !hasIngredientDeclensionEntry(ingredient))
		)
	);
	let ingredientRowsWithoutIngredientPieces = $derived(
		recipes.flatMap((recipe) =>
			recipe.fields
				.filter(isIngredientsField)
				.flatMap((field) => field.values)
				.map((line, index) => ({ recipe, index, line }))
				.filter(({ line }) => !line.some((piece) => piece.kind === 'ingredient'))
		)
	);
	let ingredientRowsWithoutIngredientPiecesByRecipe = $derived(
		Object.values(
			Object.groupBy(ingredientRowsWithoutIngredientPieces, ({ recipe }) => recipe.title)
		).filter((rows): rows is NonNullable<typeof rows> => Boolean(rows))
	);
	let tagGroups = $derived.by(() => {
		// Collect all RecipeTag instances across all recipes
		const allTags = recipes.flatMap((r) => r.tags);
		// Group by normalized form (or '__none__' sentinel for unnormalizable)
		const groupMap = new Map<string | undefined, { raws: Map<string, number>; total: number }>();
		for (const tag of allTags) {
			const key = tag.normalized[0];
			let group = groupMap.get(key);
			if (!group) {
				group = { raws: new Map(), total: 0 };
				groupMap.set(key, group);
			}
			group.raws.set(tag.raw, (group.raws.get(tag.raw) ?? 0) + 1);
			group.total++;
		}
		// Sort: groups with a normalized form first (by total desc), then unnormalized
		const withNorm = [...groupMap.entries()]
			.filter(([k]) => k !== undefined)
			.sort((a, b) => b[1].total - a[1].total) as [
			string,
			{ raws: Map<string, number>; total: number }
		][];
		const withoutNorm = groupMap.get(undefined);
		return { withNorm, withoutNorm };
	});
	let customFieldKeys = $derived(
		frequencies(
			data.pages
				.flatMap((p) => p.fields)
				.filter((field) => field.kind === 'plain')
				.filter(isStringArrayField)
				.map((f) => f.name)
		)
	);

	function frequencies(items: string[]) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const resMap = new Map<string, number>();
		for (const item of items) {
			resMap.set(item, (resMap.get(item) ?? 0) + 1);
		}
		const res = [...resMap.entries()];
		res.sort((a, b) => b[1] - a[1]);
		return res;
	}

	function rowText(line: IngredientPiece[]) {
		return line.map((piece) => piece.content).join('');
	}
</script>

<Row class="mb-4">
	<Col>
		<h2>Tags</h2>
		{#if tagGroups.withNorm.length === 0 && !tagGroups.withoutNorm}
			<p>None</p>
		{:else}
			<ul>
				{#each tagGroups.withNorm as [normalized, group]}
					<li>
						<strong>{normalized}</strong> ({group.total}):
						<ul>
							{#each [...group.raws.entries()] as [raw, freq]}
								<li>{raw}: {freq}</li>
							{/each}
						</ul>
					</li>
				{/each}
				{#if tagGroups.withoutNorm}
					<li>
						<strong>(no normalization)</strong> ({tagGroups.withoutNorm.total}):
						<ul>
							{#each [...tagGroups.withoutNorm.raws.entries()].sort((a, b) => b[1] - a[1]) as [raw, freq]}
								<li>{raw}: {freq}</li>
							{/each}
						</ul>
					</li>
				{/if}
			</ul>
		{/if}
	</Col>
</Row>

<Row class="mb-4">
	<Col>
		<h2>Custom field keys</h2>
		{#if customFieldKeys.length === 0}
			<p>None</p>
		{:else}
			<ul>
				{#each customFieldKeys as [key, freq]}
					<li>{key}: {freq}</li>
				{/each}
			</ul>
		{/if}
	</Col>
</Row>

<Row>
	<Col>
		<h2>Ingredients</h2>
		<ul>
			{#each ingredients as [key, freq]}
				<li>{key}: {freq}</li>
			{/each}
		</ul>
	</Col>
	<Col>
		<h2>Missing declension</h2>
		{#if ingredientsWithoutDeclension.length === 0}
			<p>None</p>
		{:else}
			<ul>
				{#each ingredientsWithoutDeclension as [key, freq]}
					<li>{key}: {freq}</li>
				{/each}
			</ul>
		{/if}
	</Col>
	<Col>
		<h2>Rows without ingredient pieces</h2>
		{#if ingredientRowsWithoutIngredientPiecesByRecipe.length === 0}
			<p>None</p>
		{:else}
			<ul>
				{#each ingredientRowsWithoutIngredientPiecesByRecipe as rows}
					<li>
						{rows[0].recipe.title}
						<ul>
							{#each rows as { index, line }}
								<li>[{index + 1}]: {rowText(line)}</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		{/if}
	</Col>
</Row>
