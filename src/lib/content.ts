import { normalizeIngredient, parseIngredientItem, type IngredientPiece } from './ingredients';
import { parseNestedText } from './nestedText';

export interface Content {
	rootPages: Page[];
	pages: Page[];
	photoOffsets: Record<string, number>;
}

export interface Page {
	parent?: Chapter;
	slug: string;
	title: string;
	subtitle?: string;
	page: number;
	number?: string;
	photos: [string | undefined, string][];
	fields: Field[];
}

export interface Chapter extends Page {
	pages: Page[];
}

export interface Recipe extends Page {
	parent: Chapter;
	portions?: number;
	tags: string[];
	normalizedIngredients: string[];
}

export interface Field {
	name: string;
	kind: 'intro' | 'ingredients' | 'steps' | 'note' | 'markdown' | 'link' | 'plain';
	values: string | string[] | IngredientPiece[][];
}

type FieldKind = Field['kind'];

export function isChapter(x: Page): x is Chapter {
	return 'pages' in x && x.pages !== undefined;
}
export function isRecipe(x: Page): x is Recipe {
	return 'normalizedIngredients' in x && 'tags' in x;
}
export function isStringArrayField(x: Field): x is Field & { values: string[] } {
	return Array.isArray(x.values) && x.values.every((value) => typeof value === 'string');
}
export function isIngredientsField(x: Field): x is {
	name: string;
	kind: 'ingredients';
	values: IngredientPiece[][];
} {
	return (
		x.kind === 'ingredients' &&
		Array.isArray(x.values) &&
		x.values.every(
			(line) =>
				Array.isArray(line) &&
				line.every((piece) => typeof piece === 'object' && 'content' in piece && 'kind' in piece)
		)
	);
}

export function isStepsField(x: Field) {
	return (
		x.kind === 'steps' &&
		Array.isArray(x.values) &&
		x.values.every((step) => typeof step === 'string')
	);
}

export function parseContent(nestedText: string): Content {
	const raw = parseNestedText(nestedText);
	const rootPages: Page[] = raw['Stránky'].map(getPage);
	function flatten(x: Page): Page[] {
		return isChapter(x) ? [x, ...x.pages.flatMap(flatten)] : [x];
	}
	const pages = rootPages.flatMap(flatten);
	pages.sort((a, b) => a.page - b.page);
	return { rootPages, pages, photoOffsets: {} };
}

export function parsePhotoOffsets(nestedText: string): Record<string, number> {
	if (nestedText.trim() === '') {
		return {};
	}

	const parsed = parseNestedText(nestedText);
	if (parsed == null) {
		return {};
	}
	if (typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Expected offsets.nt to contain a dictionary of slug -> number.');
	}

	const offsets: Record<string, number> = {};
	for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
		if (typeof value !== 'string' && typeof value !== 'number') {
			continue;
		}
		const parsedValue = Number(value);
		if (!Number.isFinite(parsedValue) || parsedValue === 0) {
			continue;
		}
		const clampedValue = Math.max(-50, Math.min(50, parsedValue));
		if (clampedValue === 0) {
			continue;
		}
		offsets[slug] = clampedValue;
	}

	return offsets;
}

function getString(x: unknown): string | undefined {
	if (x == null) return undefined;
	if (typeof x !== 'string') throw new Error('Not a string.');
	return x;
}
function getAsStringArray(x: unknown): string[] | undefined {
	if (x == null) return undefined;
	if (typeof x === 'string') return [x];
	if (Array.isArray(x) && x.every((x) => typeof x === 'string')) return x;
	throw new Error('Not a string array.');
}
function getArray(x: unknown): unknown[] | undefined {
	if (x == null) return undefined;
	if (!Array.isArray(x)) throw new Error('Not an array.');
	return x;
}
function getObject(x: unknown): Record<string, unknown> | undefined {
	if (x == null) return undefined;
	if (typeof x !== 'object') throw new Error('Not an object.');
	return x as Record<string, unknown>;
}
function getNumber(x: unknown): number | undefined {
	const res = Number(getString(x));
	return isNaN(res) ? undefined : res;
}

function getStringArray(x: unknown): string[] | undefined {
	const arr = getArray(x);
	if (arr == null) return undefined;
	return arr.map((item) => {
		const value = getString(item);
		if (value == null) throw new Error('Expected string value.');
		return value;
	});
}

export function slugify(x: string) {
	return x.replaceAll(/[^\s\p{L}\d-]/gu, '').replaceAll(/\s+/g, '-');
}

function parsePhotos(x: unknown): [string | undefined, string][] {
	if (x == null) return [];
	if (typeof x === 'object' && !Array.isArray(x)) {
		return Object.entries(x)
			.filter((entry): entry is [string, string] => typeof entry[1] === 'string')
			.map(([name, file]) => [name, slugify(file)]);
	}
	return (getAsStringArray(x) ?? []).map((file) => [undefined, slugify(file)]);
}

const keyToKind: Record<string, FieldKind> = {
	Intro: 'intro',
	Ingredience: 'ingredients',
	Postup: 'steps',
	Poznámka: 'note',
	Poznámky: 'note',
	Tip: 'note',
	Markdown: 'markdown',
	Odkaz: 'link',
	Odkazy: 'link'
};

function parseFieldDescriptor(key: string): { kind: FieldKind; name: string } {
	if (key in keyToKind) {
		return { kind: keyToKind[key], name: key };
	}

	const match = key.match(/^(Intro|Ingredience|Postup|Poznámka|Markdown)\((.*)\)$/u);
	if (match) {
		return {
			kind: keyToKind[match[1]],
			name: match[2]
		};
	}

	return { kind: 'plain', name: key };
}

function extractMarkdownString(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'object' && value != null && 'Markdown' in value) {
		return getString((value as Record<string, unknown>).Markdown) ?? '';
	}
	return '';
}

function parseField(key: string, value: unknown): Field {
	const descriptor = parseFieldDescriptor(key);

	if (descriptor.kind === 'ingredients') {
		const lines = getAsStringArray(value) ?? [];
		return {
			name: descriptor.name,
			kind: descriptor.kind,
			values: lines.map((line) => parseIngredientItem(line))
		};
	}

	if (descriptor.kind === 'steps') {
		return {
			name: descriptor.name,
			kind: descriptor.kind,
			values: getAsStringArray(value) ?? []
		};
	}

	if (descriptor.kind === 'markdown') {
		return {
			name: descriptor.name,
			kind: descriptor.kind,
			values: extractMarkdownString(value)
		};
	}

	if (typeof value === 'object' && value != null && 'Markdown' in value) {
		return {
			name: descriptor.name,
			kind: descriptor.kind,
			values: extractMarkdownString(value)
		};
	}

	if (typeof value === 'string') {
		return { name: descriptor.name, kind: descriptor.kind, values: value };
	}

	return {
		name: descriptor.name,
		kind: descriptor.kind,
		values: getArray(value)?.map((item) => getString(item) ?? '') ?? []
	};
}

function getPage(x: unknown): Page {
	const y = getObject(x);
	if (y === undefined) throw new Error('Not page.');

	const ignoredFieldKeys = new Set([
		'Nadpis',
		'Podnadpis',
		'Foto',
		'Strana',
		'Porce',
		'Stránky',
		'Typ',
		'Číslo'
	]);

	const fields = Object.entries(y)
		.filter(([key]) => !ignoredFieldKeys.has(key))
		.map(([key, value]) => parseField(key, value));

	const pages = getArray(y['Stránky'])?.map(getPage);
	const tagsRaw = typeof y.Typ === 'string' ? y.Typ.split(',') : getStringArray(y.Typ);
	const tags = (tagsRaw ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);
	const portions = getNumber(y.Porce);

	const normalizedIngredients = fields
		.filter(isIngredientsField)
		.flatMap((field) => field.values)
		.flatMap((line) => line)
		.filter((piece) => piece.kind === 'ingredient')
		.map((piece) => normalizeIngredient(piece.content));

	const hasRecipeData =
		tags.length > 0 ||
		portions !== undefined ||
		normalizedIngredients.length > 0 ||
		fields.some((field) => field.kind === 'steps');

	const base: Page = {
		slug: '',
		title: getString(y.Nadpis) ?? '',
		subtitle: getString(y.Podnadpis),
		photos: parsePhotos(y.Foto),
		page: getNumber(y.Strana) ?? 0,
		fields,
		number: getString(y['Číslo'])
	};

	let res: Page = hasRecipeData
		? ({
				...base,
				tags,
				portions,
				normalizedIngredients
			} as Recipe)
		: base;

	if (pages !== undefined) {
		res = {
			...res,
			pages
		} as Chapter;
	}

	if (isChapter(res)) {
		for (const child of res.pages) {
			child.parent = res;
		}
	}

	res.slug = slugify(res.title);
	return res;
}
