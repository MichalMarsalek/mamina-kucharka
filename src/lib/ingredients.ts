const ingredients = `
sůl/sol
pepř
cibul|e
česnek
olej
másl|o
vývar
brambor|a
vejce/vajec/vajíčk/žlout
vod|a
bujón
sýr
mas|o
smetan|a
paprik|a
parmazán
slanin|a
rajč|e
polévka
olivový olej
hověz|í
brokolice
kmín
rýž|e
baby špenát
cukr
tymián
oregan|o
chilli
mrk|ev
mouk|a
kukuřičný škrob/kukuřičného škrob
špenát
kuřec|í
vepřov|é
šunk|a
bazalk|a
těstovin|y
pečiv|o
majonéz|a
čedar
kečup
bobkový list/bobkové listy
nové koření/nového koření
skořic|e
nudle
čočk|a
Veget|a/Podravk
ocet/oct
hráš|ek
petržel
toust
cizrn|a
Tamari omáčka/Tamari omáčky
kari
rajský protlak/rajského protlaku
celer
zelenina
fazol|e
cuket|a
houb|y/hříb/hřib/hub/žampion
majorán|ka
zázvor
pomeranč
chřest
muškátový oříšek/muškátového oříšku/muškátový květ/muškátového květu
chřest
kedlub|en
batát|y
slunečnicová semínka/slunečnicových semínek
rukol|a
červené víno/červeného vína
worcester
dýňová semínka/dýňových semínek
okurka/okurky/okurek
kopr
květák
kukuřic|e
mlék|o
červená řepa/červené řepy
tvaroh
ořech|y
mozzarella
med
králičí/králík
koriandr
Granko
dýně
citron
Niva
žampion|y
hořčice
tofu
rozmarýn
losos
vín|o
lilek/lilku
bulgur
haluš|ky/Haluš
kysané zelí/kysaného zelí
sójová omáčka/sójové omáčky
špaget|y
hlíva ústřičná/hlívy ústřičné
strouhan|ka
grilovací koření/grilovacího koření
krůt|í
`.trim().split("\n").map(x => {
    let variants = x.split("/")
    const name = variants[0].replaceAll("|", "")
    variants = variants.map(x => x.split("|")[0])
    return {name, variants}
})

export function getIngredientsInText(text: string) {
    return ingredients.filter(x => x.variants.some(variant => text.includes(variant))).map(x => x.name)
}