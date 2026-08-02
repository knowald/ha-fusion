import { readFile } from 'node:fs/promises';
import { compile, preprocess } from 'svelte/compiler';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// These are Hearth's primary keyboard surfaces. Compile them without the
// project-wide warning suppression so new inaccessible controls fail CI even
// while the legacy dashboard continues its existing migration separately.
const files = [
	'src/lib/Hearth/HearthDashboard.svelte',
	'src/lib/Hearth/SearchOverlay.svelte',
	'src/lib/Hearth/NavWidget.svelte',
	'src/lib/Hearth/SetupWizard.svelte',
	'src/lib/Hearth/CalendarWidget.svelte',
	'src/lib/Hearth/Screensaver.svelte',
	'src/lib/Hearth/edit/EditSheet.svelte',
	'src/routes/hearth/+page.svelte'
];

const guardedWarnings = new Set([
	'a11y_autofocus',
	'a11y_click_events_have_key_events',
	'a11y_consider_explicit_label',
	'a11y_no_noninteractive_tabindex',
	'a11y_no_static_element_interactions'
]);

let failures = 0;
for (const filename of files) {
	const source = await readFile(filename, 'utf8');
	const processed = await preprocess(source, vitePreprocess(), { filename });
	const result = compile(processed.code, { filename, generate: false });
	for (const warning of result.warnings.filter(({ code }) => guardedWarnings.has(code))) {
		failures += 1;
		const location = warning.start ? `:${warning.start.line}:${warning.start.column + 1}` : '';
		console.error(`${filename}${location} ${warning.code}: ${warning.message}`);
	}
}

if (failures) {
	console.error(`Hearth accessibility check failed with ${failures} diagnostic(s).`);
	process.exitCode = 1;
} else {
	console.log(`Hearth accessibility check passed for ${files.length} primary surfaces.`);
}
