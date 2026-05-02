export const units = `
ml
l
g
dkg
kg
ks
lžíce/lžíce/lžic
lžička/lžičky/lžiček
plná lžička/plné lžičky/plných lžiček
hrnek/hrnky/hrnků
hrst/hrsti/hrstí
plátek/plátky/plátků
krajíc/krajíce/krajíců
kousek/kousky/kousků
kulička/kuličky/kuliček
kostka/kostky/kostek
stroužek/stroužky/stroužků
špetka/špetky/špetek
kelímek/kelímky/kelímků
plechovka/plechovky/plechovek
balení/balení/balení
balíček/balíčky/balíčků
svazek/svazky/svazků
kus/kus/kusů
malý/malé/malých
velký/velké/velkých
malá/malé/malých
velká/velké/velkých
malé/malá/malých
velké/velká/velkých
střední/střední/středních
`
	.trim()
	.split('\n')
	.map((x) =>
		x.includes('/') ? x.split('/').map((x) => x.trim()) : [x.trim(), x.trim(), x.trim()]
	);

export type IngredientPieceKind = 'quantity' | 'ingredient' | 'prose';

export interface IngredientPiece {
	content: string;
	kind: IngredientPieceKind;
	quantity?: string;
}

export const ingredients = `
sůl/soli
pepř/pepře
cibule/cibuli
cibulka/cibulky
česnek/česneku
medvědí česnek/medvědího česneku
máslo/másla/pomazánkové máslo
olej/oleje/oleji
olivový olej
kokosový olej/kokosového oleje
vejce/vajec/vajíčko/vajíčka
žloutek/žloutky
cukr/cukru/skořicový cukr
mouka/mouky/moukou/mouku
rýžová mouka/rýžovou mouku
bujón/bujónu
masox/masoxu
vývar/vývaru/masový vývar/masového vývaru/hovězího vývaru
smetana/smetany/šlehačka/šlehačky
mléko/mléka
kokosové mléko/kokosového mléka
brambory/brambor/bramborům/bramborový/bramborového/bramborové
paprika/papriky/papriku
chilli/chilli omáčky
rajče/rajčata/rajčat/rajčátka/rajčátek
rajčatový protlak/rajčatového protlaku/rajčatového/rajský protlak/rajského protlaku
brokolice
špenát/špenátu/baby špenát/baby špenátu
kukuřice
kukuřičný škrob/kukuřičného škrobu/solamyl/solamylu
rýže/rýži/rýžovou
bulgur
čočka/čočky
fazole/fazolí/fazolky/fazolových lusků
cizrna/cizrny
hrášek/hrášku
kedluben/kedlubny/kedlubnovou natí
květák/květáku
cuketa/cukety
dýně
batát/batáty/batátů
červená řepa/červené řepy
lilek
mrkev/mrkve
pórek/pórku
celer/celeru
pastinák
chřest/chřestu
okurka/okurky
citron/citronu/citronová šťáva/citronová kůra
pomeranč/pomeranče/pomerančová kůra/pomerančového džusu
ocet/octa/octu
víno/vína/červené víno/červeného vína
kečup/kečupu
hořčice
majonéza/majonézy
worcester/worcesteru
sójová omáčka/sójové omáčky/tamari omáčky/česnekové sójové omáčky
zázvor/zázvoru
kmín/kmínu/kmínem
oregano/oregana
tymián/tymiánu
majoránka/majoránky
bazalka/bazalky/bazalkových lístků
petržel/petržele/petrželka/petrželky/petrželová nať/nať
kopr/kopru
pažitka
rozmarýn/rozmarýnu
koriandr/koriandru
bobkový list/bobkové listy
nové koření/nového koření
kari
skořice
muškátový oříšek/muškátového oříšku/muškátového květu
med/medu/medem
ořechy/ořechů
slunečnicová semínka
dýňová semínka
pečivo/pečiva
toustový chléb/toustový chleba/toustového chleba/toustové chleby/tousty
chléb/chleba
strouhanka/strouhanky
nudle/rýžové nudle/rýžových nudlí
těstoviny/těstovin/špagety/špaget
halušky
tofu
tvaroh/tvarohu/tvarohy/tvarohový kelímek/tvarohové těsto/tvarohových ovocných knedlíků
sýr/sýra/sýru
parmazán/parmazánu/parmazánový sýr/parmazánového sýru/parmazánového sýra/strouhaný parmazán/strouhaného parmazánového sýru/sýr parmazánového typu/sýru parmazánového typu/sýr parmazánového
čedar/sýr čedar/sýru čedar
mozzarella
niva
šunka/šunky/šunku
slanina/slaniny/anglické slaniny
losos/lososa
kuřecí/kuřecího/kuřecích/kuře/kuřecí řízky/kuřecí prsa
krůtí/krůtího
hovězí/hovězího/hovězím/hovězí maso/hovězí zadní/hovězího zadního/hovězí kližky/hovězího na guláš
vepřové/vepřového/vepřová pečeně/vepřová krkovice/vepřová panenka/vepřové kotlety
králičí stehna
maso
žampiony/žampionů/žampionu
hřiby/hříbky/hříbků/hřibů
hlíva ústřičná/hlívy ústřičné
houby/hub
bylinky/bylinek/libeček/meduňky
vegeta/vegety
podravka/podravky
kuchárek
grilovací koření
marmeláda/marmelád
voda
granko
`
	.trim()
	.split('\n')
	.map((x) => {
		const variants = x.split('/');
		return { name: variants[0], variants };
	});

// Declension table for ingredients: form_1 / form_2-4 / form_5+
// Single-form entries are implicitly all three forms.
export const ingredientForms = `
vejce/vejce/vajec
cibule/cibule/cibulí
cibulka/cibulky/cibulek
česnek/česneky/česnků
medvědí česnek/medvědí česneky/medvědích česnků
máslo/másla/másel
olej/oleje/olejů
kokosový olej/kokosové oleje/kokosových olejů
olivový olej/olivové oleje/olivových olejů
žloutek/žloutky/žloutků
cukr/cukry/cukrů
brambory/brambory/brambor
paprika/papriky/paprik
rajče/rajčata/rajčat
brokolice
špenát/špenáty/špenátů
kukuřice
rýže
bulgur
čočka/čočky/čoček
fazole/fazole/fazolí
cizrna/cizrny/cizren
hrášek/hrášky/hrášků
kedluben/kedlubny/kedlubnů
květák/květáky/květáků
cuketa/cukety/cuket
dýně/dýně/dýní
batát/batáty/batátů
červená řepa/červené řepy/červených řep
lilek/lilek/lilků
mrkev/mrkve/mrkví
pórek/pórky/pórků
celer/celery/celerů
pastinák/pastináky/pastináků
chřest/chřesty/chřestů
okurka/okurky/okurek
citron/citrony/citronů
pomeranč/pomeranče/pomerančů
víno/vína/vín
hořčice
majonéza/majonézy/majonéz
sýr/sýry/sýrů
mozzarella
niva
šunka/šunky/šunek
slanina/slaniny/slanin
losos/lososi/lososi
kuře/kuřata/kuřat
žampion/žampiony/žampionů
hřib/hřiby/hřibů
houby/houby/hub
marmeláda/marmelády/marmelád
`
	.trim()
	.split('\n')
	.map((x) =>
		x.includes('/') ? x.split('/').map((x) => x.trim()) : [x.trim(), x.trim(), x.trim()]
	);

const normalizedIngredientForms = ingredientForms.map((forms) => {
	const first = forms[0] ?? '';
	const second = forms[1] ?? first;
	const third = forms[2] ?? second;
	return [first, second, third] as const;
});

const wordToAllIngredientForms = new Map<string, Array<readonly [string, string, string]>>();
for (const forms of normalizedIngredientForms) {
	for (const variant of forms) {
		const word = variant.toLowerCase();
		let arr = wordToAllIngredientForms.get(word);
		if (!arr) {
			arr = [];
			wordToAllIngredientForms.set(word, arr);
		}
		if (!arr.includes(forms)) arr.push(forms);
	}
}

function lookupIngredientForms(
	word: string,
	origIndex: 0 | 1 | 2
): readonly [string, string, string] | undefined {
	return wordToAllIngredientForms.get(word)?.find((f) => f[origIndex].toLowerCase() === word);
}

export function declineIngredient(
	ingredient: string,
	originalAmount: number,
	newAmount: number
): string {
	if (!Number.isFinite(originalAmount) || !Number.isFinite(newAmount)) return ingredient;
	const trimmed = ingredient.trim().toLowerCase();
	const origIndex = amountToFormIndex(Math.abs(originalAmount));
	const newIndex = amountToFormIndex(Math.abs(newAmount));

	const forms = lookupIngredientForms(trimmed, origIndex);
	if (forms) return forms[newIndex];

	// Multiword fallback: decline each space-separated part individually
	const parts = trimmed.split(/\s+/);
	if (parts.length > 1) {
		const declinedParts = parts.map((part) => {
			const partForms = lookupIngredientForms(part, origIndex);
			return partForms ? partForms[newIndex] : undefined;
		});
		if (declinedParts.every((p) => p !== undefined)) {
			return (declinedParts as string[]).join(' ');
		}
	}
	return ingredient;
}

export function getIngredientsInText(text: string) {
	text = text.toLowerCase();
	const res = ingredients
		.filter((x) => x.variants.some((variant) => text.includes(variant)))
		.map((x) => x.name);
	return res;
}

export function normalizeIngredient(ingredient: string): string {
	ingredient = ingredient.toLowerCase();
	for (const { name, variants } of ingredients) {
		if (variants.some((variant) => ingredient.includes(variant))) {
			return name;
		}
	}
	return ingredient;
}

const normalizedUnits = [
	...new Set(
		units
			.flat()
			.map((unit) => unit.toLowerCase())
			.filter(Boolean)
	)
].sort((a, b) => b.length - a.length);

const normalizedUnitForms = units.map((unitForms) => {
	const first = unitForms[0] ?? '';
	const second = unitForms[1] ?? first;
	const third = unitForms[2] ?? second;
	return [first, second, third] as const;
});

function amountToFormIndex(absAmount: number): 0 | 1 | 2 {
	if (absAmount === 1) return 0;
	if (absAmount === 2 || absAmount === 3 || absAmount === 4) return 1;
	return 2;
}

// Maps each word variant -> all form triples that contain it (at any position)
const wordToAllForms = new Map<string, Array<readonly [string, string, string]>>();
for (const forms of normalizedUnitForms) {
	for (const variant of forms) {
		const word = variant.toLowerCase();
		let arr = wordToAllForms.get(word);
		if (!arr) {
			arr = [];
			wordToAllForms.set(word, arr);
		}
		if (!arr.includes(forms)) arr.push(forms);
	}
}

function lookupForms(
	word: string,
	origIndex: 0 | 1 | 2
): readonly [string, string, string] | undefined {
	return wordToAllForms.get(word)?.find((f) => f[origIndex].toLowerCase() === word);
}

export function declineUnit(
	unit: string,
	originalAmount: number,
	newAmount: number
): string | undefined {
	if (!Number.isFinite(originalAmount) || !Number.isFinite(newAmount)) return undefined;
	const trimmed = unit.trim().toLowerCase();
	const origIndex = amountToFormIndex(Math.abs(originalAmount));
	const newIndex = amountToFormIndex(Math.abs(newAmount));

	// Try whole string first (handles single-word and pre-defined multiword like "plná lžička")
	const forms = lookupForms(trimmed, origIndex);
	if (forms) return forms[newIndex];

	// Multiword fallback: decline each space-separated part individually
	const parts = trimmed.split(/\s+/);
	if (parts.length > 1) {
		const declinedParts = parts.map((part) => {
			const partForms = lookupForms(part, origIndex);
			return partForms ? partForms[newIndex] : undefined;
		});
		if (declinedParts.every((p) => p !== undefined)) {
			return (declinedParts as string[]).join(' ');
		}
	}
	return undefined;
}

const escapedUnits = normalizedUnits.map((unit) => unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const singleUnitToken = `(?:${escapedUnits.join('|')})`;
const unitToken = `(?:${singleUnitToken}(?:\\s+${singleUnitToken})*)`;
const numberToken = String.raw`(?:\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)`;
const numberRangeToken = String.raw`${numberToken}(?:\s*-\s*${numberToken})?`;
const numberWithUnitToken = String.raw`${numberRangeToken}\s*${unitToken}`;
const numberQuantityToken = String.raw`(?:${numberWithUnitToken}|${numberRangeToken})(?!\s*[%°‰])`;
const quantityRegex = new RegExp(
	`(?<![\\p{L}\\d])(${numberQuantityToken}|${unitToken})(?![\\p{L}\\d])`,
	'giu'
);
const quantityWithUnitRegex = new RegExp(`^(${numberRangeToken})\\s*(${unitToken})$`, 'iu');
const inlineIngredientRegex = /(?:\{([^}]*)\})?\[([^\]]*)\]/g;

function normalizeQuantityText(quantity: string): string {
	const trimmed = quantity.trim();
	const withUnit = trimmed.match(quantityWithUnitRegex);
	if (withUnit) {
		return `${withUnit[1]} ${withUnit[2]}`;
	}
	return trimmed;
}

function parseProseAndQuantities(text: string): IngredientPiece[] {
	if (text.length === 0) return [];
	const parts: IngredientPiece[] = [];
	const regex = new RegExp(quantityRegex.source, quantityRegex.flags);
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		const start = match.index;
		const end = start + match[0].length;
		if (start > lastIndex) {
			parts.push({ content: text.slice(lastIndex, start), kind: 'prose' });
		}
		parts.push({ content: normalizeQuantityText(match[0]), kind: 'quantity' });
		lastIndex = end;
	}

	if (lastIndex < text.length) {
		parts.push({ content: text.slice(lastIndex), kind: 'prose' });
	}

	return parts;
}

function getLastQuantity(parts: IngredientPiece[]): string | undefined {
	for (let i = parts.length - 1; i >= 0; i -= 1) {
		if (parts[i].kind === 'quantity') return parts[i].content;
	}
	return undefined;
}

export function parseIngredientItem(text: string): IngredientPiece[] {
	const parts: IngredientPiece[] = [];
	let lastPrecedingQuantity: string | undefined;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = inlineIngredientRegex.exec(text)) !== null) {
		const [fullMatch, explicitRaw, ingredientRaw] = match;
		const between = text.slice(lastIndex, match.index);
		const ingredient = (ingredientRaw ?? '').trim();
		const explicit = explicitRaw !== undefined;
		const betweenPieces = parseProseAndQuantities(between);
		const inBetweenQuantity = getLastQuantity(betweenPieces);
		if (inBetweenQuantity !== undefined) {
			lastPrecedingQuantity = inBetweenQuantity;
		}

		let quantity: string | undefined;

		if (explicit) {
			quantity = normalizeQuantityText(explicitRaw);
			if (quantity.length === 0) quantity = undefined;
		} else {
			quantity = lastPrecedingQuantity;
		}

		if (betweenPieces.length > 0) {
			parts.push(...betweenPieces);
		}

		if (explicit && quantity !== undefined) {
			parts.push({ content: quantity, kind: 'quantity' });
		}
		parts.push({ content: ingredient, kind: 'ingredient', quantity });

		lastIndex = match.index + fullMatch.length;
	}

	const tailPieces = parseProseAndQuantities(text.slice(lastIndex));
	if (tailPieces.length > 0) {
		parts.push(...tailPieces);
	}

	if (parts.length === 0) {
		parts.push({ content: text, kind: 'prose' });
	}

	return parts;
}
