import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';

/*
 * Per-route budget for the client code a page loads eagerly, measured gzipped
 * from the production build. The eager set is the app entry, the root layout
 * node and the route node, plus everything they statically import. Chunks
 * behind dynamic import() (embeds, editors, modals) do not count, which is the
 * point: heavy legacy code must stay behind a dynamic boundary. Run after
 * `pnpm build`.
 */

const ROOT = resolve(import.meta.dirname, '..');
const CLIENT = join(ROOT, 'build/client');
const MANIFEST = join(ROOT, '.svelte-kit/output/client/.vite/manifest.json');
const NODES = join(ROOT, '.svelte-kit/generated/client-optimized/nodes');
const APP_ENTRY = '.svelte-kit/generated/client-optimized/app.js';

// gzipped kilobytes; raise deliberately, never to make a red build green
const BUDGETS = {
	'routes/+page.svelte': { js: 190, css: 24 },
	'routes/classic/+page.svelte': { js: 80, css: 8 }
};

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

async function gzipKb(file) {
	const path = join(CLIENT, file);
	await stat(path);
	return gzipSync(await readFile(path), { level: 6 }).length / 1024;
}

async function routeNodes() {
	const nodes = {};
	for (const name of await readdir(NODES)) {
		const source = await readFile(join(NODES, name), 'utf8');
		const route = source.match(/routes\/[^"']+\.svelte/)?.[0];
		if (route) nodes[route] = `.svelte-kit/generated/client-optimized/nodes/${name}`;
	}
	return nodes;
}

function eagerClosure(keys) {
	const seen = new Set();
	const stack = [...keys];
	while (stack.length) {
		const key = stack.pop();
		if (seen.has(key) || !manifest[key]) continue;
		seen.add(key);
		stack.push(...(manifest[key].imports ?? []));
	}
	return seen;
}

const nodes = await routeNodes();
const layout = nodes['routes/+layout.svelte'];
let failures = 0;

for (const [route, budget] of Object.entries(BUDGETS)) {
	const node = nodes[route];
	if (!node) {
		console.error(`${route}: no client node found in ${NODES}`);
		failures += 1;
		continue;
	}
	const closure = eagerClosure([APP_ENTRY, layout, node].filter(Boolean));
	let js = 0;
	let css = 0;
	for (const key of closure) {
		js += await gzipKb(manifest[key].file);
		for (const sheet of manifest[key].css ?? []) css += await gzipKb(sheet);
	}
	const jsOk = js <= budget.js;
	const cssOk = css <= budget.css;
	const verdict = jsOk && cssOk ? 'ok' : 'OVER BUDGET';
	console.log(
		`${route}: js ${js.toFixed(0)} KB (budget ${budget.js}), css ${css.toFixed(0)} KB (budget ${budget.css}), ${closure.size} chunks: ${verdict}`
	);
	if (!jsOk || !cssOk) failures += 1;
}

if (failures) {
	console.error(`Bundle budget check failed for ${failures} route(s).`);
	process.exitCode = 1;
}
