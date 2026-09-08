import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

/*
 * Counts the distinct literal values Hearth and ui styles use per property
 * family: colours, font sizes, spacing, radii, z-index and icon sizes. The
 * counts are the progress metric of the visual review; `--json` prints the
 * full value-to-files map for the token migration.
 */

const ROOT = resolve(import.meta.dirname, '..');
const DIRS = ['src/lib/Hearth', 'src/lib/ui'].map((dir) => join(ROOT, dir));
const json = process.argv.includes('--json');

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else if (/\.(svelte|css)$/.test(entry.name)) yield path;
	}
}

function styleText(source, file) {
	if (file.endsWith('.css')) return source;
	return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
		.map((match) => match[1])
		.join('\n');
}

const FAMILIES = {
	colour: /(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g,
	'font-size': /font-size:\s*([0-9.]+(?:px|rem|em))/g,
	spacing: /(?:padding|margin|gap|inset|top|right|bottom|left)[a-z-]*:\s*([^;}]+)[;}]/g,
	radius: /border-radius:\s*([^;}]+)[;}]/g,
	'z-index': /z-index:\s*(-?\d+)/g,
	transition: /(?:transition|animation)[a-z-]*:\s*([^;}]+)[;}]/g
};

const found = Object.fromEntries(Object.keys(FAMILIES).map((key) => [key, new Map()]));
const iconSizes = new Map();

function note(map, value, file) {
	if (!map.has(value)) map.set(value, new Set());
	map.get(value).add(file);
}

for (const dir of DIRS) {
	for await (const absolute of walk(dir)) {
		const file = relative(ROOT, absolute);
		const source = await readFile(absolute, 'utf8');
		const css = styleText(source, file);
		for (const [family, pattern] of Object.entries(FAMILIES)) {
			for (const match of css.matchAll(pattern)) {
				const raw = match[1].trim();
				if (family === 'spacing') {
					for (const px of raw.match(/\b\d+(?:\.\d+)?px\b/g) ?? []) note(found[family], px, file);
				} else if (family === 'radius') {
					if (!raw.startsWith('var(')) note(found[family], raw, file);
				} else {
					note(found[family], raw, file);
				}
			}
		}
		for (const match of source.matchAll(/size=\{(\d+)\}/g)) note(iconSizes, match[1], file);
	}
}

found['icon-size'] = iconSizes;

if (json) {
	const out = {};
	for (const [family, map] of Object.entries(found)) {
		out[family] = Object.fromEntries([...map].map(([value, files]) => [value, [...files].sort()]));
	}
	console.log(JSON.stringify(out, null, 2));
} else {
	console.log('family        distinct  values (most used first)');
	for (const [family, map] of Object.entries(found)) {
		const sorted = [...map].sort((a, b) => b[1].size - a[1].size);
		const preview = sorted
			.slice(0, 12)
			.map(([value, files]) => `${value}(${files.size})`)
			.join(' ');
		console.log(`${family.padEnd(13)} ${String(map.size).padStart(8)}  ${preview}`);
	}
}
