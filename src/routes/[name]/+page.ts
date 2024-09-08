import type { Content } from "$lib/content";

export const ssr = false;

export async function load({ params, parent }: any) {
	const data: Content = await parent();
	const recipe = data.pages.find((x: any) => x.slug === params.name);
	return recipe;
}
