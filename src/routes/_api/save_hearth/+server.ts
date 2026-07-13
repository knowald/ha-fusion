import { copyFile, mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import { json, error } from '@sveltejs/kit';
import * as yaml from 'js-yaml';
import type { RequestHandler } from './$types';

const CONFIG_PATH = './data/hearth.yaml';
const BACKUP_DIR = './data/backups';
const BACKUP_KEEP = 10;

async function currentRevision(): Promise<number> {
	try {
		const data = await readFile(CONFIG_PATH, 'utf8');
		const parsed = data.trim() ? (yaml.load(data) as Record<string, unknown>) : undefined;
		const revision = parsed?.revision;
		return typeof revision === 'number' && Number.isInteger(revision) ? revision : 0;
	} catch {
		// missing or unreadable file counts as a fresh start
		return 0;
	}
}

async function backupCurrentFile() {
	try {
		await mkdir(BACKUP_DIR, { recursive: true });
		await copyFile(CONFIG_PATH, `${BACKUP_DIR}/hearth-${Date.now()}.yaml`);
	} catch {
		// nothing to back up on first save
	}
}

async function pruneBackups() {
	try {
		const backups = (await readdir(BACKUP_DIR))
			.filter((name) => /^hearth-\d+\.yaml$/.test(name))
			.sort((a, b) => parseInt(b.slice(7)) - parseInt(a.slice(7)));
		await Promise.all(backups.slice(BACKUP_KEEP).map((name) => unlink(`${BACKUP_DIR}/${name}`)));
	} catch {
		// pruning is best-effort
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body !== 'object') error(400, 'invalid body');

	// new shape is { revision, config }; legacy clients post the config object
	// directly, which skips the conflict check
	const isRevisionedShape = 'config' in body;
	const config = isRevisionedShape ? body.config : body;
	const revision = await currentRevision();

	if (isRevisionedShape && body.revision !== revision) {
		return json({ revision }, { status: 409 });
	}

	// the revision key is server-managed; a client-supplied one must not win
	const configBody = { ...config };
	delete configBody.revision;

	let data;
	try {
		data = yaml.dump({ revision: revision + 1, ...configBody });
	} catch (err: any) {
		error(500, err.message);
	}

	await backupCurrentFile();

	try {
		await writeFile(CONFIG_PATH, data);
	} catch (err: any) {
		error(500, err.message);
	}

	await pruneBackups();
	return json({ revision: revision + 1 });
};
