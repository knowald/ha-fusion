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

	// the loaded document carries the revision it was read at; a client that
	// echoes it gets conflict detection, an older client keeps last-writer-wins
	const { revision, ...document } = body;
	try {
		const result = await saveYamlDocument({
			file: 'data/configuration.yaml',
			body: document,
			revision: Number.isInteger(revision) && revision >= 0 ? revision : undefined
		});
		if (result.conflict) {
			return new Response(JSON.stringify({ error: 'conflict', revision: result.revision }), {
				status: 409
			});
		}
		return json({ action: 'saved', revision: result.revision });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message ?? 'save failed' }), {
			status: 500
		});
	}
};
