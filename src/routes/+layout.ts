import { parseContent } from '$lib/content';
import editions from '$lib/editions';

export const ssr = false;

export async function load({ fetch }: { fetch: typeof window.fetch }) {
	const photoSlugSets = await Promise.all(
		Object.keys(editions).map(async (edition) => {
			const raw = await (await fetch(`/recepty_${edition}.nt`)).text();
			const content = parseContent(raw);
			return content.pages.flatMap((page) => ('photos' in page && page.photos ? page.photos : [])).map((x) => x[1]);
		})
	);

	return {
		photoSlugs: [...new Set(photoSlugSets.flat())]
	};
}