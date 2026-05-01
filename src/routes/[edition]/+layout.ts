import { parseContent, parsePhotoOffsets, type Content } from '$lib/content';

export const ssr = false;

export async function load({ fetch, params }: any) {
	const raw = await (await fetch(`/recepty_${params.edition}.nt`)).text();
	const content = parseContent(raw);
	const offsetsRaw = await (await fetch('/offsets.nt')).text();
	content.photoOffsets = parsePhotoOffsets(offsetsRaw);
	return content;
}
