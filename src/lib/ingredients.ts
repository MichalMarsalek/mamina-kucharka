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

export function parseIngredientItem(text: string): (string | [string])[] {
	const parts: (string | [string])[] = [];
	const regex = /\[([^\]]*)\]/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		const [fullMatch, innerText] = match;
		const start = match.index;
		if (start > lastIndex) {
			parts.push(text.slice(lastIndex, start));
		}
		parts.push([innerText]);
		lastIndex = start + fullMatch.length;
	}

	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts;
}
