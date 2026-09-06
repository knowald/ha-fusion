// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveYamlDocument } from './persistence';

let directory: string;
let file: string;

beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), 'hearth-persistence-'));
	file = join(directory, 'hearth.yaml');
});

afterEach(async () => {
	await rm(directory, { recursive: true, force: true });
});

const backups = async () => (await readdir(join(directory, 'backups')).catch(() => [])).sort();

describe('saveYamlDocument', () => {
	it('writes the document with server-owned keys first and no backup on the first save', async () => {
		const result = await saveYamlDocument({
			file,
			body: { rooms: [], version: 99, revision: 5 },
			revision: 0,
			head: { version: 4 }
		});
		expect(result).toEqual({ conflict: false, revision: 1 });
		expect(await readFile(file, 'utf8')).toBe('revision: 1\nversion: 4\nrooms: []\n');
		expect(await backups()).toEqual([]);
	});

	it('backs up the replaced document under a name that carries its revision', async () => {
		await saveYamlDocument({ file, body: { name: 'one' }, revision: 0 });
		await saveYamlDocument({ file, body: { name: 'two' }, revision: 1 });
		const names = await backups();
		expect(names).toHaveLength(1);
		expect(names[0]).toMatch(/^hearth-\d+-r1\.yaml$/);
		expect(await readFile(join(directory, 'backups', names[0]), 'utf8')).toContain('name: one');
	});

	it('serializes concurrent saves so every accepted one leaves its own backup', async () => {
		await saveYamlDocument({ file, body: { name: 'base' }, revision: 0 });
		const results = await Promise.all(
			[1, 2, 3].map((step) =>
				saveYamlDocument({ file, body: { name: `step ${step}` }, force: true })
			)
		);
		expect(results.map(({ revision }) => revision).sort()).toEqual([2, 3, 4]);
		expect((await backups()).map((name) => name.replace(/-\d+-/, '-'))).toEqual([
			'hearth-r1.yaml',
			'hearth-r2.yaml',
			'hearth-r3.yaml'
		]);
	});

	it('keeps the ten newest backups', async () => {
		for (let step = 0; step <= 12; step += 1) {
			await saveYamlDocument({ file, body: { step }, force: true });
		}
		const names = await backups();
		expect(names).toHaveLength(10);
		expect(names.map((name) => name.replace(/^hearth-\d+-/, ''))).not.toContain('r1.yaml');
		expect(names.map((name) => name.replace(/^hearth-\d+-/, ''))).toContain('r12.yaml');
	});

	it('refuses a stale revision and keeps the file as it was', async () => {
		await saveYamlDocument({ file, body: { name: 'one' }, revision: 0 });
		const result = await saveYamlDocument({ file, body: { name: 'stale' }, revision: 0 });
		expect(result).toEqual({ conflict: true, revision: 1 });
		expect(await readFile(file, 'utf8')).toContain('name: one');
	});

	it('aborts the save when the backup cannot be written', async () => {
		await saveYamlDocument({ file, body: { name: 'one' }, revision: 0 });
		// a file where the backup directory should be makes mkdir fail
		await rm(join(directory, 'backups'), { recursive: true, force: true });
		await writeFile(join(directory, 'backups'), 'not a directory');
		await expect(saveYamlDocument({ file, body: { name: 'two' }, revision: 1 })).rejects.toThrow(
			/Could not back up/
		);
		expect(await readFile(file, 'utf8')).toContain('name: one');
	});

	it('refuses to replace a document it cannot read', async () => {
		await writeFile(file, 'rooms: [unterminated');
		await expect(saveYamlDocument({ file, body: { name: 'two' } })).rejects.toThrow();
		expect(await readFile(file, 'utf8')).toBe('rooms: [unterminated');
		expect(await readdir(directory)).toEqual(['hearth.yaml']);
	});
});
