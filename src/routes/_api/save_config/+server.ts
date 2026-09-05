import { json } from '@sveltejs/kit';
import { saveYamlDocument } from '$lib/server/persistence';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return new Response(JSON.stringify({ error: 'Configuration must be a mapping' }), {
			status: 400
		});
	}

	try {
		const result = await saveYamlDocument({ file: 'data/configuration.yaml', body });
		return json({ action: 'saved', revision: result.revision });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message ?? 'save failed' }), {
			status: 500
		});
	}
};
