import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compile, preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/*
 * Compiles every component in the rework layers without the project-wide
 * a11y warning suppression, so a new inaccessible control fails CI. The
 * original dashboard under src/lib/legacy keeps its suppression until it is
 * deleted.
 */

const ROOTS = ['src/lib/Hearth', 'src/lib/ui', 'src/routes/hearth'];

async function* svelteFiles(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* svelteFiles(path);
		else if (entry.name.endsWith('.svelte')) yield path;
	}
}

let failures = 0;
let count = 0;
for (const root of ROOTS) {
	for await (const filename of svelteFiles(root)) {
		count += 1;
		const source = await readFile(filename, 'utf8');
		const processed = await preprocess(source, vitePreprocess(), { filename });
		const result = compile(processed.code, { filename, generate: false });
		for (const warning of result.warnings.filter(({ code }) => code.startsWith('a11y'))) {
			failures += 1;
			const location = warning.start ? `:${warning.start.line}:${warning.start.column + 1}` : '';
			console.error(`${filename}${location} ${warning.code}: ${warning.message}`);
		}
	}
}

if (failures) {
	console.error(`Accessibility check failed with ${failures} diagnostic(s) in ${count} files.`);
	process.exitCode = 1;
} else {
	console.log(`Accessibility check passed for ${count} components.`);
}
