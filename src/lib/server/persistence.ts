import { randomUUID } from 'crypto';
import { basename, dirname, join } from 'path';
import { copyFile, mkdir, open, readdir, readFile, rename, unlink } from 'fs/promises';
import * as yaml from 'js-yaml';

/*
 * The one way a YAML document under data/ is written. Every save goes through
 * a per-file critical section, an atomic replace, a timestamped backup and a
 * server-managed `revision` counter that clients echo back so two tabs cannot
 * silently overwrite each other.
 *
 * Adapter-node serves concurrent requests in one process, which the lock
 * covers. Deployments with several server processes need a cross-process lock
 * in front of these endpoints.
 */

const BACKUP_KEEP = 10;

function backupDirectory(file: string) {
	return join(dirname(file), 'backups');
}

function backupStem(file: string) {
	return basename(file).replace(/\.ya?ml$/, '');
}

const locks = new Map<string, Promise<void>>();

async function withFileLock<T>(file: string, operation: () => Promise<T>): Promise<T> {
	const previous = locks.get(file) ?? Promise.resolve();
	let release!: () => void;
	const current = new Promise<void>((resolve) => (release = resolve));
	locks.set(file, current);
	await previous;
	try {
		return await operation();
	} finally {
		release();
		if (locks.get(file) === current) locks.delete(file);
	}
}

/** The document's revision, 0 for a missing file. Malformed YAML and I/O failures throw. */
export async function currentRevision(file: string): Promise<number> {
	try {
		const data = await readFile(file, 'utf8');
		const parsed = data.trim() ? (yaml.load(data) as Record<string, unknown>) : undefined;
		const revision = parsed?.revision;
		return typeof revision === 'number' && Number.isInteger(revision) ? revision : 0;
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return 0;
		throw error;
	}
}

/**
 * Copies the current document aside before it is replaced. The name carries
 * the revision being replaced, which is unique per document, so two saves in
 * the same millisecond cannot share a backup. A missing source (first save)
 * needs no backup; any other failure aborts the save, since a save that
 * cannot be undone is worse than one that has to be retried.
 */
async function backupCurrentFile(file: string, revision: number) {
	const directory = backupDirectory(file);
	try {
		await mkdir(directory, { recursive: true });
		await copyFile(file, join(directory, `${backupStem(file)}-${Date.now()}-r${revision}.yaml`));
	} catch (error) {
		if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return;
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Could not back up ${file} before saving: ${detail}`, { cause: error });
	}
}

const BACKUP_NAME = /^(.+)-(\d+)(?:-r\d+)?\.yaml$/;

async function pruneBackups(file: string) {
	const directory = backupDirectory(file);
	const stem = backupStem(file);
	try {
		const backups = (await readdir(directory))
			.map((name) => ({ name, match: BACKUP_NAME.exec(name) }))
			.filter(({ match }) => match?.[1] === stem)
			.map(({ name, match }) => ({ name, at: Number(match![2]) }))
			.sort((a, b) => b.at - a.at || b.name.localeCompare(a.name));
		await Promise.all(backups.slice(BACKUP_KEEP).map(({ name }) => unlink(join(directory, name))));
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

export interface SaveRequest {
	file: string;
	/** The document body; keys it shares with `head` or `revision` never win. */
	body: Record<string, unknown>;
	/** The revision the client loaded; undefined skips the conflict check. */
	revision?: number;
	force?: boolean;
	/** Extra server-managed keys written before the body, e.g. a schema version. */
	head?: Record<string, unknown>;
}

export type SaveResult =
	{ conflict: true; revision: number } | { conflict: false; revision: number };

/**
 * Replaces `file` with `body` unless the client's revision is stale. The next
 * revision number is written into the document and returned.
 */
export async function saveYamlDocument(request: SaveRequest): Promise<SaveResult> {
	return withFileLock(request.file, async () => {
		const revision = await currentRevision(request.file);
		if (request.revision !== undefined && request.force !== true && request.revision !== revision) {
			return { conflict: true as const, revision };
		}
		const head: Record<string, unknown> = { revision: revision + 1, ...(request.head ?? {}) };
		head.revision = revision + 1;
		const body = { ...request.body };
		for (const key of Object.keys(head)) delete body[key];
		const data = yaml.dump({ ...head, ...body });
		await backupCurrentFile(request.file, revision);
		await atomicWriteFile(request.file, data);
		await pruneBackups(request.file);
		return { conflict: false as const, revision: revision + 1 };
	});
}
