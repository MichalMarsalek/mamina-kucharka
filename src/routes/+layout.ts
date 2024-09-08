import { parseContent } from "$lib/content";

export const ssr = false;

export async function load({ fetch }: any) {
	const raw = await (await fetch('/recepty.nt')).text()
	const content = parseContent(raw);
	console.log({content})
	return content;
}
