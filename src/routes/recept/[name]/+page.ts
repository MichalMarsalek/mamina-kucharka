export const ssr = false;

export async function load({ params, parent }: any) {
	const data = await parent();
	const recipe = data.Kapitoly.flatMap(x => x.Recepty).find((x: any) => x.key === params.name);
	console.log({recipe})
	return { recipe };
}
