import { parseContent, type Content } from '$lib/content';

export const ssr = false;

export async function load({ fetch, params }: any) {
	const raw = await (await fetch(`/recepty_${params.edition}.nt`)).text();
	const content = parseContent(raw);
	return content;
}
