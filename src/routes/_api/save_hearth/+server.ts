import { json, error } from '@sveltejs/kit';
import { saveYamlDocument } from '$lib/server/persistence';
import { CONFIG_VERSION } from '$lib/Hearth/migrate';
import type { RequestHandler } from './$types';

const CONFIG_PATH = './data/hearth.yaml';

function isMapping(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!isMapping(body)) error(400, 'invalid body');

	// new shape is { revision, config }; legacy clients post the config object
	// directly, which skips the conflict check
	const isRevisionedShape = 'config' in body;
	const config = isRevisionedShape ? body.config : body;
	if (!isMapping(config)) error(400, 'invalid config');
	const revision = isRevisionedShape ? body.revision : undefined;
	if (revision !== undefined && !(Number.isInteger(revision) && (revision as number) >= 0)) {
		error(400, 'invalid revision');
	}

	let result;
	try {
		result = await saveYamlDocument({
			file: CONFIG_PATH,
			body: config,
			revision: revision as number | undefined,
			force: body.force === true,
			head: { version: CONFIG_VERSION }
		});
	} catch (err: any) {
		// Malformed YAML and I/O failures must abort the save rather than let a
		// fallback revision overwrite the file.
		error(500, `Cannot save Hearth configuration: ${err?.message ?? 'unknown error'}`);
	}

	if (result.conflict) return json({ revision: result.revision }, { status: 409 });
	return json({ revision: result.revision });
};
