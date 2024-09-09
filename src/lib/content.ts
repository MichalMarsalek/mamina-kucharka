import { parseNestedText } from "./nestedText"

export interface Content {
    rootPages: Page[]
    pages: Page[]
}

export interface Page {
    parent?: Chapter
    slug: string
    title: string
    subtitle?: string
    photoCount?: number
    page: number
    customFields: CustomField[]
}

export interface Chapter extends Page {
    pages: Page[]
}

export interface Recipe extends Page {
    parent: Chapter
    portions?: number
    tags: string[]
    ingredients: string[]
    steps: string[]
}

export interface CustomField {
    name: string;
    values: string[]
}

export function isChapter(x: Page): x is Chapter {
    return "pages" in x && x.pages !== undefined
}
export function isRecipe(x: Page): x is Recipe {
    return "ingredients" in x && x.ingredients !== undefined && "steps" in x && x.steps !== undefined
}

export function parseContent(nestedText: string): Content {
    const raw = parseNestedText(nestedText);
    const rootPages: Page[] = raw.Kapitoly.map(getPage)
    function flatten(x: Page): Page[] {
        return isChapter(x) ? [x, ...x.pages.flatMap(flatten)] : [x]
    }
    const pages = rootPages.flatMap(flatten);
    pages.sort((a,b) => a.page - b.page);
    return {rootPages, pages }
}

function getString(x: unknown): string | undefined {
    if (x == null) return undefined
    if (typeof x !== "string") throw new Error("Not a string.")
    return x;
}
function getArray(x: unknown): unknown[] | undefined {
    if (x == null) return undefined
    if (!Array.isArray(x)) throw new Error("Not an array.")
    return x;
}
function getObject(x: unknown): Record<string,unknown> | undefined {
    if (x == null) return undefined;
    if (typeof x !== "object") throw new Error("Not an object.")
    return x as Record<string,unknown>;
}
function getNumber(x: unknown): number | undefined {
    const res = Number(getString(x));
    return isNaN(res) ? undefined : res
}

function getPage(x: unknown): Page {
    const y = getObject(x)
    if (y === undefined) throw new Error("Not page.");
    const res: Page = {
        slug: "",
        title: getString(y.Nadpis),
        subtitle: getString(y.Podtitul),
        photoCount: getNumber(y.Fotek),
        page: getNumber(y.Strana),
        tags: typeof y.Typ === "string" ? y.Typ.split(",") : getArray(y.Typ)?.map(getString),
        customFields: [],
        portions: getNumber(y.Porce),
        ingredients: getArray(y.Ingredience)?.map(getString),
        steps: getArray(y.Postup)?.map(getString),
        pages: getArray(y.Kapitoly ?? y.Recepty)?.map(getPage),
    }
    if (!res.title) console.log("missing title", {res})
    for(const [k,v] of Object.entries(y)) {
        if (!["Nadpis", "Podtitul", "Fotek", "Strana", "Porce", "Ingredience", "Postup", "Kapitoly", "Recepty", "Typ"].includes(k)){
            res.customFields.push({name: k, values: (typeof v === "string" ? [v] : getArray(v)?.map(x => getString(x)!) ?? [])})
        }
    }
    if (isChapter(res)) for(const child of res.pages){
        child.parent = res;
    }
    res.slug = res.title!.replaceAll(" ", "-")
    return res;
}