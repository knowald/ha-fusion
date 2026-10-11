import { lstat, mkdir, readdir, readFile, unlink, writeFile } from 'fs/promises';
import { json, error } from '@sveltejs/kit';
import * as yaml from 'js-yaml';
import { slugify } from '$lib/Hearth/config';
import type { RequestHandler } from './$types';

const THEMES_DIR = './data/hearth-themes';
const ID_PATTERN = /^[a-z0-9-]{1,50}$/;

interface SavedThemeFile {
	name: string;
	theme: Record<string, string>;
}

function themeId(name: string): string {
	return slugify(name).slice(0, 50);
}

// reads and writes must not follow symlinks a local attacker may have planted
// in the themes directory - only plain files are acceptable targets
async function isRegularFileOrMissing(path: string): Promise<boolean> {
	try {
		return (await lstat(path)).isFile();
	} catch {
		return true;
	}
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	let files: string[];
	try {
		files = await readdir(THEMES_DIR);
	} catch {
		// no saved themes yet
		return json([]);
	}

	const themes = await Promise.all(
		files
			.filter((file) => file.endsWith('.yaml'))
			.map(async (file) => {
				try {
					if (!(await lstat(`${THEMES_DIR}/${file}`)).isFile()) return null;
					const data = await readFile(`${THEMES_DIR}/${file}`, 'utf8');
					const parsed = yaml.load(data) as SavedThemeFile;
					if (!parsed || typeof parsed.name !== 'string' || typeof parsed.theme !== 'object') {
						return null;
					}
					return { id: file.slice(0, -'.yaml'.length), name: parsed.name, theme: parsed.theme };
				} catch {
					return null;
				}
			})
	);

	setHeaders({ 'Cache-Control': 'max-age=0' });
	return json(themes.filter(Boolean));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body.name !== 'string' || typeof body.theme !== 'object' || !body.theme) {
		error(400, 'invalid body');
	}

	const id = themeId(body.name);
	if (!ID_PATTERN.test(id)) error(400, 'invalid theme name');

	let data;
	try {
		data = yaml.dump({ name: body.name, theme: body.theme });
	} catch (err: any) {
		error(500, err.message);
	}

	const path = `${THEMES_DIR}/${id}.yaml`;
	try {
		await mkdir(THEMES_DIR, { recursive: true });
		if (!(await isRegularFileOrMissing(path))) error(400, 'invalid theme target');
		await writeFile(path, data);
	} catch (err: any) {
		if (err?.status) throw err;
		error(500, err.message);
	}

	return json({ id, name: body.name, theme: body.theme });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body || typeof body.id !== 'string') error(400, 'invalid body');

	if (!ID_PATTERN.test(body.id)) error(400, 'invalid theme id');

	try {
		await unlink(`${THEMES_DIR}/${body.id}.yaml`);
	} catch (err: any) {
		if (err.code === 'ENOENT') error(404, 'theme not found');
		error(500, err.message);
	}

	return json({ id: body.id });
};
