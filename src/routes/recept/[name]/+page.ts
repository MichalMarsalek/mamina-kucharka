export const ssr = false;

export async function load({ params, parent }: any) {
	const name = params.name.replaceAll('-', ' ');
	const { recipes } = await parent();
	const recipe = recipes.find((x: any) => x.Recept === name);
	const index = recipes.findIndex((x: any) => x.Recept === name) ?? -1;
	const next = recipes[(index + 1) % recipes.length].Recept;
	return { name, recipe, next };
}
