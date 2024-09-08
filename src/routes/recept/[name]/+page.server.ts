export const ssr = false;

import { parseNestedText } from '$lib/nestedText';
import type { EntryGenerator } from './$types';
import dataNt from '../../../../static/recepty.nt?raw'

export const entries: EntryGenerator = async () => {
	const data = parseNestedText(dataNt);
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
	return data.Kapitoly.flatMap(x => x.Recepty.flatMap(x => x.key)).map(x => ({name: x}))
};