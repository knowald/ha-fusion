import { json, error } from '@sveltejs/kit';
import { saveYamlDocument } from '$lib/server/persistence';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body !== 'object' || Array.isArray(body)) error(400, 'invalid body');

	try {
		const result = await saveYamlDocument({ file: './data/dashboard.yaml', body });
		return json({ message: 'saved', revision: result.revision });
	} catch (err: any) {
		error(500, err?.message ?? 'save failed');
	}
};
