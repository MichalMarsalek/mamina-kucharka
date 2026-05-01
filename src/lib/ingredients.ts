export const units = `
l/l/l
ml/ml/ml
g/g/g
kg/kg/kg
dkg/dkg/dkg
stroužek/stroužky/stroužků
lžíce/lžíce/lžic
lžička/lžičky/lžiček
kelímek/kelímky/kelímků
špetka/špetky/špetek
plechovka/plechovky/plechovek
plátek/plátky/plátků
malý/malé/malých
velký/velké/velkých
malá/malé/malých
velká/velké/velkých
malé/malá/malých
velké/velká/velkých
střední/střední/středních
kus/kus/kusů
hrnek/hrnky/hrnků
kostka/kostky/kostek
hrst/hrsti/hrstí
plná lžička/plné lžičky/plných lžiček
kousek/kousky/kousků
kulička/kuličky/kuliček
balení/balení/balení
`.split('\n').map((x) => x.split('/').map(x => x.trim()));

export const ingredients = `
sůl/sol
pepř
cibule/cibul
česnek
olej
máslo/másl
vývar
brambor/brambora
vejce/vajec/vajíčk/žlout
voda
bujón
sýr
maso
smetana/smetan
paprika/paprik
parmazán
slanina/slanin
rajče/rajč
polévka
olivový olej
hovězí/hověz
brokolice
kmín
rýže/rýž
baby špenát
cukr
tymián
oregano/oregan
chilli
mrkev/mrkve
mouka/mouk
kukuřičný škrob/kukuřičného škrob
špenát
kuřecí/kuře
vepřové/vepřov
šunka/šunk
bazalka/bazalk
těstoviny/těstovin
pečivo/pečiv
majonéza/majonéz
čedar
kečup
bobkový list/bobkové listy
nové koření/nového koření
skořice/skořic
nudle
čočka/čočk
Vegeta/Veget/Podravk
ocet/oct
hrášek/hráš
petržel
toust
cizrna/cizrn
Tamari omáčka/Tamari omáčky
kari
rajský protlak/rajského protlaku
celer
zelenina
fazole/fazol
cuketa/cuket
houby/hříb/hřib/hub/žampion
majoránka/majorán
zázvor
pomeranč
chřest
muškátový oříšek/muškátového oříšku/muškátový květ/muškátového květu
chřest
kedluben/kedlub
batát
slunečnicová semínka/slunečnicových semínek
rukola/rukol
červené víno/červeného vína
worcester
dýňová semínka/dýňových semínek
okurka/okurky/okurek
kopr
květák
kukuřice/kukuřic
mléko/mlék
červená řepa/červené řepy
tvaroh
ořechy/ořech
mozzarella
med
králičí/králík
koriandr
Granko
dýně/dýňová/dýňové
citron
Niva
žampiony/žampion
hořčice
tofu
rozmarýn
losos
víno/vín
lilek/lilku
bulgur
halušky/haluš/Haluš
kysané zelí/kysaného zelí
sójová omáčka/sójové omáčky
špagety|špaget
hlíva ústřičná/hlívy ústřičné
strouhanka/strouhan
grilovací koření/grilovacího koření
krůtí/krůt
chléb/chleba
pórek/pór
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
