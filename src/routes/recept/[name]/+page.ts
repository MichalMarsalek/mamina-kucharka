export const ssr = false;

export async function load({ params, parent }: any) {
	const { recipes } = await parent();
	const recipe = recipes.find((x: any) => x.key === params.name);
	const index = recipes.findIndex((x: any) => x.key === params.name) ?? -1;
	return { name, recipe };
}
