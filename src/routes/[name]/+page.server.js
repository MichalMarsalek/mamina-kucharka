import { redirect } from '@sveltejs/kit';
import { defaultEdition } from '$lib/editions';

export function load({ params }) {
	redirect(308, `/${defaultEdition}/${encodeURIComponent(params.name)}`);
}
