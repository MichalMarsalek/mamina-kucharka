import { parseNestedText } from "$lib/nestedText";

export const ssr = false;
export const prerender = true;

export async function load({ fetch }: any) {
	const data = parseNestedText(await (await fetch('/recepty.nt')).text());
	function addKeys(x: any) {
		if (Array.isArray(x)) {
			for(const v of x) addKeys(v)
		}
		if (typeof x === "object"){
			if("Nadpis" in x) x.key = x.Nadpis.replaceAll(' ', '-');
			for(const v of Object.values(x)) addKeys(v);
		}
	}
	addKeys(data);
	return data;
}
