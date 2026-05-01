import { parseContent } from '$lib/content';

export const ssr = false;

export async function load({ fetch }: any) {
	const raw = await (await fetch('/recepty_1.nt')).text();
	const content = parseContent(raw);
	return content;
}
