import { parseMfcf } from './mfcf';

export const ssr = false;

export async function load({ fetch }: any) {
	const data = await (await fetch('/recipes.mfcf')).text();
	const recipes = parseMfcf(data) as any;
	for (const recipe of recipes) {
		recipe.key = recipe.Recept.replaceAll(' ', '-');
	}
	return { recipes };
}
