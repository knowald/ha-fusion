import { readdir, readFile } from 'node:fs/promises';
import { join, posix, relative, resolve } from 'node:path';

/*
 * Import boundary check. Layers are matched by path prefix and may only import
 * from the layers listed in `allowed` (plus themselves, node_modules and
 * SvelteKit virtual modules). `legacy` is reachable from other layers only
 * through `src/lib/legacy/bridge`, which is the one place a legacy dependency
 * is declared. Covers static imports, re-exports and dynamic import() in .ts,
 * .js and .svelte files.
 */

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

const LAYERS = [
	{
		name: 'legacy',
		match: ['src/lib/legacy/', 'src/routes/+page.svelte', 'src/routes/+page.server.ts'],
		allowed: ['core', 'ui', 'shared']
	},
	{
		name: 'hearth',
		match: [
			'src/lib/Hearth/',
			'src/routes/hearth/',
			'src/routes/_api/hearth_themes/',
			'src/routes/_api/save_hearth/'
		],
		allowed: ['core', 'ui', 'shared', 'bridge']
	},
	{ name: 'ui', match: ['src/lib/ui/'], allowed: ['core', 'shared'] },
	{ name: 'core', match: ['src/lib/core/'], allowed: ['shared'] },
	// unlayered code from before the rework; shrinks as phases 1 and 2 land
	{ name: 'shared', match: ['src/lib/', 'src/routes/', 'src/'], allowed: ['core', 'ui', 'bridge'] }
];

const BRIDGE_PREFIX = 'src/lib/legacy/bridge/';

function layerOf(file) {
	if (file.startsWith(BRIDGE_PREFIX)) return 'bridge';
	return LAYERS.find((layer) => layer.match.some((prefix) => file.startsWith(prefix)))?.name;
}

function allowedFrom(layer) {
	if (layer === 'bridge') return new Set(['bridge', 'legacy', 'core', 'ui', 'shared']);
	const definition = LAYERS.find((entry) => entry.name === layer);
	return new Set([layer, ...(definition?.allowed ?? [])]);
}

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else if (/\.(ts|js|svelte)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) yield path;
	}
}

const IMPORT_PATTERN =
	/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*['"]([^'"]+)['"]/g;

function resolveTarget(fromFile, specifier) {
	if (specifier.startsWith('$lib/')) return posix.join('src/lib', specifier.slice(5));
	if (specifier.startsWith('./') || specifier.startsWith('../')) {
		return posix.normalize(posix.join(posix.dirname(fromFile), specifier));
	}
	return null;
}

let failures = 0;
for await (const absolute of walk(SRC)) {
	const file = relative(ROOT, absolute).split('\\').join('/');
	const layer = layerOf(file);
	if (!layer) continue;
	const allowed = allowedFrom(layer);
	const source = await readFile(absolute, 'utf8');
	for (const match of source.matchAll(IMPORT_PATTERN)) {
		const specifier = match[1] ?? match[2] ?? match[3];
		const target = resolveTarget(file, specifier);
		if (!target) continue;
		const targetLayer = layerOf(target);
		if (!targetLayer || allowed.has(targetLayer)) continue;
		failures += 1;
		const line = source.slice(0, match.index).split('\n').length;
		console.error(`${file}:${line} ${layer} may not import ${targetLayer} (${specifier})`);
	}
}

if (failures) {
	console.error(`Boundary check failed with ${failures} violation(s).`);
	process.exitCode = 1;
} else {
	console.log('Boundary check passed.');
}
