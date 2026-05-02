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
menší/menší/menších
střední/střední/středních
větší/větší/větších
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

// Declension table for ingredients: form_1 / form_2-4 / form_5+
// Single-form entries are implicitly all three forms.
const baseIngredientFormsSource = `
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
	.map((x) => x.trim())
	.filter(Boolean);

// Additional declension rows derived from recipe frequency list.
// Format: form_1 / form_2-4 / form_5+  (same as baseIngredientFormsSource)
const ingredientFormsFrequencySource = `
sůl/soli/solí
pepř/pepře/pepřů
česnek/česneky/česnků
cukr/cukry/cukrů
mouka/mouky/mouk
bujón/bujóny/bujónů
vývar/vývary/vývarů
smetana/smetany/smetany
mléko/mléka/mlék
voda/vody/vod
anglická slanina/anglické slaniny/anglických slanin
kmín/kmíny/kmínů
chilli
oregano/oregana/oregan
tymián/tymiány/tymiánů
brambora/brambory/brambor
majoránka/majoránky/majoránek
baby špenát/baby špenáty/baby špenátů
kečup/kečupy/kečupů
bobkový list/bobkové listy/bobkových listů
tvaroh/tvarohy/tvarohů
pečivo/pečiva/pečiv
bazalka/bazalky/bazalek
petržel/petržele/petrželí
petrželka/petrželky/petrželek
vegeta/vegety/veget
těstovina/těstoviny/těstovin
kukuřičný škrob/kukuřičné škroby/kukuřičných škrobů
ořech/ořechy/ořechů
skořice/skořice/skořic
ocet/octy/octů
pórek/pórky/pórků
celer/celery/celerů
citronová šťáva/citronové šťávy/citronových šťáv
grilovací koření/grilovací koření/grilovacích koření
losos/lososi/lososů
kakao/kakaa/kakaí
zelenina/zeleniny/zelenin
podravka/podravky/podravek
parmazán/parmazány/parmazánů
parmazánový sýr/parmazánové sýry/parmazánových sýrů
kuřecí/kuřecí/kuřecích
hovězí zadní/hovězí zadní/hovězích zadních
vepřová pečeně/vepřové pečeně/vepřových pečení
vepřové kotlety/vepřové kotlety/vepřových kotlet
vajíčko/vajíčka/vajíček
rajčatový protlak/rajčatové protlaky/rajčatových protlaků
rajský protlak/rajské protlaky/rajských protlaků
bylinky/bylinky/bylinek
masox/masoky/masoxů
maso/masa/mas
hovězí/hovězí/hovězích
masový vývar/masové vývary/masových vývarů
strouhanka/strouhanky/strouhanek
rajčátko/rajčátka/rajčátek
kukuřičný škrob/kukuřičné škroby/kukuřičných škrobů
listové těsto/listová těsta/listových těst
toustový chléb/toustové chleby/toustových chlebů
chléb/chleby/chlebů
vývar/vývary/vývarů
nové koření/nová koření/nových koření
petrželová nať/petrželové natě/petrželových natí
zázvor/zázvory/zázvorů
muškátový oříšek/muškátové oříšky/muškátových oříšků
rukola/rukoly/rukol
víno/vína/vín
kopr/kopry/koprů
pomerančová kůra/pomerančové kůry/pomerančových kůr
kuchárek/kucháreky/kucháreků
kukuřičné zrno/kukuřičná zrna/kukuřičných zrn
pepř/pepře/pepřů
kysané zelí/kysaná zelí/kysaných zelí
hovězí/hovězí/hovězích
medvědí česnek/medvědí česneky/medvědích česnků
čedar/čedary/čedarů
granko
tvaroh/tvarohy/tvarohů
hřib/hřiby/hřibů
rýže/rýže/rýží
zelenina/zeleniny/zelenin
tofu
halušky/halušky/haluštěk
sójová omáčka/sójové omáčky/sójových omáček
tamari omáčka/tamari omáčky/tamari omáček
česnekové sójová omáčka/česnekové sójové omáčky/česnekových sójových omáček
vepřová krkovice/vepřové krkovice/vepřových krkovic
vepřové/vepřového/vepřových
rozmarýn/rozmarýny/rozmarýnů
gnocchi
kokosový olej/kokosové oleje/kokosových olejů
krevetka/krevety/krevet
mango/manga/mang
hrozinka/hrozinky/hrozinek
jahoda/jahody/jahod
ovoce/ovoce/ovoce
kokosové mléko/kokosová mléka/kokosových mlék
dýňové semínko/dýňová semínka/dýňových semínek
slunečnicové semínko/slunečnicová semínka/slunečnicových semínek
zázvor/zázvory/zázvorů
kopr/kopry/koprů
masový vývar/masové vývary/masových vývarů
citronová kůra/citronové kůry/citronových kůr
hladká mouka/hladké mouky/hladkých mouk
mangold/mangoidy/mangoldů
hlíva ústřičná/hlívy ústřičné/hlív ústřičných
šalvěj/šalvěje/šalvějí
ananasový kompot/ananasové kompoty/ananasových kompotů
mleté maso/mletá masa/mletých mas
solamyl/solamyly/solamylů
kurkuma/kurkumy/kurkum
koriandr/koriandry/koriandru
worcester/worcestery/worcesterů
máslové těsto/máslová těsta/máslových těst
krůtí/krůtí/krůtích
šalotka/šalotky/šalotek
makarón/makaróny/makarónů
vodka/vodky/vodek
ryba/ryby/ryb
kuřecí řízek/kuřecí řízky/kuřecích řízků
hovězí zadní/hovězí zadní/hovězích zadních
strouhanky/strouhanky/strouhanek
hovězí kližka/hovězí kližky/hovězích kližek
rýžová nudle/rýžové nudle/rýžových nudlí
hovězí vývar/hovězí vývary/hovězích vývarů
smetana/smetany/smetany
vepřová panenka/vepřové panenky/vepřových panenek
fazolové lusky/fazolové lusky/fazolových lusků
toustové chleby/toustové chleby/toustových chlebů
avokádo/avokáda/avokád
bílek/bílky/bílků
dětská krupička/dětské krupičky/dětských kupiček
mozzarella/mozzarelly/mozzarell
šunka/šunky/šunek
hermelín/hermelíny/hermelínů
camembert/camemberty/camembertů
brie
houskový knedlík/houskové knedlíky/houskových knedlíků
salát ledový/saláty ledové/salátů ledových
ředkvička/ředkvičky/ředkviček
oliva/olivy/oliv
nať/natě/natí
lučina/lučiny/lučin
křen/křeny/křenů
limetka/limetky/limetek
koňak/koňaky/koňaků
meruňkový džem/meruňkové džemy/meruňkových džemů
jablko/jablka/jablek
sezamové semínko/sezamová semínka/sezamových semínek
kiwi/kiwi/kiwi
ananas/ananasy/ananasů
meruňka/meruňky/meruněk
hroznové víno/hroznová vína/hroznových vín
meloun/melouny/melounů
meduňka/meduňky/meduněk
máta/máty/mát
čokoládové srdíčko/čokoládová srdíčka/čokoládových srdíček
bezlepková sušenka/bezlepkové sušenky/bezlepkových sušenek
mascarpone/mascarpone/mascarpone
malina/maliny/malin
želatina/želatiny/želatin
hořká čokoláda/hořké čokolády/hořkých čokolád
mandlová moučka/mandlové moučky/mandlových mouček
tmavá čokoláda/tmavé čokolády/tmavých čokolád
pomazánkové máslo/pomazánková másla/pomazánkových másel
rozinka/rozinky/rozinek
soda/sody/sod
prášek do perníku/prášky do perníku/prášků do perníku
perníkové koření/perníková koření/perníkových koření
vajíčko/vajíčka/vajíček
pomerančový džus/pomerančové džusy/pomerančových džusů
vanilkový pudink/vanilkové pudinky/vanilkových pudinků
tvarohové těsto/tvarohová těsta/tvarohových těst
tvarohy/tvarohy/tvarohů
margot
kypřící prášek/kypřící prášky/kypřících prášků
vanilka/vanilky/vanil
bezlepková směs/bezlepkové směsi/bezlepkových směsí
rýžová mouka/rýžové mouky/rýžových mouk
banán/banány/banánů
prášek do pečiva/prášky do pečiva/prášků do pečiva
`
	.trim()
	.split('\n')
	.map((x) => x.trim())
	.filter(Boolean);

export const ingredientForms = [
	...new Set([...baseIngredientFormsSource, ...ingredientFormsFrequencySource])
].map((x) =>
	x.includes('/') ? x.split('/').map((x) => x.trim()) : [x.trim(), x.trim(), x.trim()]
);

const normalizedIngredientForms = ingredientForms.map((forms) => {
	const first = forms[0] ?? '';
	const second = forms[1] ?? first;
	const third = forms[2] ?? second;
	return [first, second, third] as const;
});

const exactIngredientForms = new Set(
	normalizedIngredientForms
		.flat()
		.map((form) => form.toLowerCase())
		.filter(Boolean)
);

const ingredientVariantsToBase = new Map<string, string>();
for (const forms of normalizedIngredientForms) {
	const base = forms[0].toLowerCase();
	for (const form of forms) {
		const variant = form.toLowerCase();
		if (!ingredientVariantsToBase.has(variant)) {
			ingredientVariantsToBase.set(variant, base);
		}
	}
}

const ingredientBaseForms = [
	...new Set(normalizedIngredientForms.map((forms) => forms[0].toLowerCase()))
]
	.filter(Boolean)
	.sort((a, b) => b.length - a.length);

const ingredientVariantEntriesByLength = [...ingredientVariantsToBase.entries()].sort(
	(a, b) => b[0].length - a[0].length
);

export function hasIngredientDeclensionEntry(ingredient: string): boolean {
	return exactIngredientForms.has(ingredient.trim().toLowerCase());
}

function applyCasePattern(source: string, replacement: string): string {
	if (source === source.toUpperCase()) return replacement.toUpperCase();
	if (source === source.toLowerCase()) return replacement.toLowerCase();

	const sourceWords = source.split(/\s+/);
	const replacementWords = replacement.split(/\s+/);
	if (sourceWords.length === replacementWords.length) {
		const maybeTitle = replacementWords.map((word, idx) => {
			const sourceWord = sourceWords[idx] ?? '';
			if (sourceWord.length === 0 || word.length === 0) return word;
			const startsUpper = sourceWord[0] === sourceWord[0].toUpperCase();
			if (!startsUpper) return word;
			return `${word[0].toUpperCase()}${word.slice(1)}`;
		});
		return maybeTitle.join(' ');
	}

	return replacement;
}

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
	const trimmedOriginal = ingredient.trim();
	const trimmed = trimmedOriginal.toLowerCase();
	const origIndex = amountToFormIndex(Math.abs(originalAmount));
	const newIndex = amountToFormIndex(Math.abs(newAmount));

	const forms = lookupIngredientForms(trimmed, origIndex);
	if (forms) return applyCasePattern(trimmedOriginal, forms[newIndex]);

	// Multiword fallback: decline each space-separated part individually
	const parts = trimmed.split(/\s+/);
	const originalParts = trimmedOriginal.split(/\s+/);
	if (parts.length > 1) {
		const declinedParts = parts.map((part, idx) => {
			const partForms = lookupIngredientForms(part, origIndex);
			if (!partForms) return undefined;
			const originalPart = originalParts[idx] ?? part;
			return applyCasePattern(originalPart, partForms[newIndex]);
		});
		if (declinedParts.every((p) => p !== undefined)) {
			return (declinedParts as string[]).join(' ');
		}
	}
	return ingredient;
}

export function getIngredientsInText(text: string) {
	const textLower = text.toLowerCase();
	return ingredientBaseForms.filter((base) => {
		const chars = [...base];
		const minPrefixLength = Math.max(1, Math.ceil(chars.length / 2));
		const prefix = chars.slice(0, minPrefixLength).join('');
		return textLower.includes(prefix);
	});
}

export function normalizeIngredient(ingredient: string): string {
	const ingredientLower = ingredient.trim().toLowerCase();
	const exactBase = ingredientVariantsToBase.get(ingredientLower);
	if (exactBase) return exactBase;

	for (const [variant, base] of ingredientVariantEntriesByLength) {
		if (ingredientLower.includes(variant)) {
			return base;
		}
	}

	return ingredientLower;
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

function parseQuantitiesInUnquotedText(text: string): IngredientPiece[] {
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

function parseProseAndQuantities(text: string): IngredientPiece[] {
	if (text.length === 0) return [];
	const parts: IngredientPiece[] = [];
	const quotedRegex = /"([^"]*)"|'([^']*)'|„([^“]*)“/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = quotedRegex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			parts.push(...parseQuantitiesInUnquotedText(text.slice(lastIndex, match.index)));
		}

		const quotedContent = match[1] ?? match[2] ?? match[3] ?? '';
		if (quotedContent.length > 0) {
			parts.push({ content: quotedContent, kind: 'prose' });
		}

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) {
		parts.push(...parseQuantitiesInUnquotedText(text.slice(lastIndex)));
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
