import type { Content } from '$lib/content';
import { redirect } from '@sveltejs/kit';
import didYouMean from 'didyoumean';

export const ssr = false;

export async function load({ params, parent }: any) {
	const data: Content = await parent();
	const page = data.pages.find((x: any) => x.slug === params.name);
	if (page == null) {
		const closestSlug = didYouMean(
			params.name,
			data.pages.map((x) => x.slug)
		);
		if (closestSlug != null) {
			redirect(308, `/${params.edition}/${encodeURIComponent(closestSlug)}`);
		}
	}
	return { page };
}
