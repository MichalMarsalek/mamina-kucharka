import { parseContent, parsePhotoOffsets, type Content } from '$lib/content';
import { base } from '$app/paths';

export const ssr = false;

export async function load({ fetch, params }: any) {
	const raw = await (await fetch(`${base}/recepty_${params.edition}.nt`)).text();
	const content = parseContent(raw);
	content.photoOffsets = {};

	const offsetsResponse = await fetch(`${base}/offsets.nt`);
	if (offsetsResponse.ok) {
		const offsetsRaw = await offsetsResponse.text();
		if (!offsetsRaw.trimStart().startsWith('<!doctype html') && !offsetsRaw.trimStart().startsWith('<html')) {
			try {
				content.photoOffsets = parsePhotoOffsets(offsetsRaw);
			} catch {
				content.photoOffsets = {};
			}
		}
	}
	return content;
}
