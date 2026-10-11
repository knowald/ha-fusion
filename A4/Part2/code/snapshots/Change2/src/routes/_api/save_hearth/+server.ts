import { randomUUID } from 'crypto';
import { dirname } from 'path';
import { copyFile, mkdir, open, readdir, readFile, rename, unlink } from 'fs/promises';
import { json, error } from '@sveltejs/kit';
import * as yaml from 'js-yaml';
import type { RequestHandler } from './$types';

const CONFIG_PATH = './data/hearth.yaml';
const BACKUP_DIR = './data/backups';
const BACKUP_KEEP = 10;

// Adapter-node serves concurrent requests in one process. Keep the revision
// check and replacement in a single critical section so two callers cannot
// both accept the same revision. Deployments with multiple server processes
// must additionally provide a cross-process lock around this endpoint.
let saveTail = Promise.resolve();

async function withSaveLock<T>(operation: () => Promise<T>): Promise<T> {
	const previous = saveTail;
	let release!: () => void;
	saveTail = new Promise<void>((resolve) => (release = resolve));
	await previous;
	try {
		return await operation();
	} finally {
		release();
	}
}

async function currentRevision(): Promise<number> {
	try {
		const data = await readFile(CONFIG_PATH, 'utf8');
		const parsed = data.trim() ? (yaml.load(data) as Record<string, unknown>) : undefined;
		const revision = parsed?.revision;
		return typeof revision === 'number' && Number.isInteger(revision) ? revision : 0;
	} catch (error) {
		// Only absence is a fresh start. Malformed YAML and I/O failures must
		// abort the save rather than allowing fallback revision 0 to overwrite it.
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return 0;
		throw error;
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

async function atomicWriteFile(file: string, data: string) {
	const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
	const handle = await open(temporary, 'wx');
	let openHandle = true;
	try {
		await handle.writeFile(data, 'utf8');
		await handle.sync();
		await handle.close();
		openHandle = false;
		await rename(temporary, file);

		// Persist the directory entry as well as the file contents. Some platforms
		// cannot open directories; the atomic rename has still completed there.
		try {
			const directory = await open(dirname(file), 'r');
			try {
				await directory.sync();
			} finally {
				await directory.close();
			}
		} catch {
			// best-effort durability after the atomic replacement
		}
	} catch (error) {
		if (openHandle) await handle.close().catch(() => {});
		await unlink(temporary).catch(() => {});
		throw error;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body !== 'object') error(400, 'invalid body');

	const result = await withSaveLock(async () => {
		// new shape is { revision, config }; legacy clients post the config object
		// directly, which skips the conflict check
		const isRevisionedShape = 'config' in body;
		const config = isRevisionedShape ? body.config : body;
		let revision: number;
		try {
			revision = await currentRevision();
		} catch (readError) {
			const message = readError instanceof Error ? readError.message : 'unknown read error';
			error(500, `Cannot save unreadable Hearth configuration: ${message}`);
		}

		if (isRevisionedShape && body.force !== true && body.revision !== revision) {
			return { conflict: true as const, revision };
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
			await atomicWriteFile(CONFIG_PATH, data);
		} catch (err: any) {
			error(500, err.message);
		}
		return { conflict: false as const, revision: revision + 1 };
	});

	if (result.conflict) return json({ revision: result.revision }, { status: 409 });

	// Retention does not affect the correctness of the saved file, so it does
	// not keep later save requests waiting on filesystem cleanup.
	await pruneBackups();
	return json({ revision: result.revision });
};
