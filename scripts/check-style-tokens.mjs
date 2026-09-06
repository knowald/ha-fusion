import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

/*
 * Style token guard for Hearth and ui. Fails on literal colours, font sizes,
 * radii, z-index values and transition durations that bypass the tokens in
 * core/theme, and on spacing values off the even-pixel scale. A declaration may
 * opt out with a same-line comment: `/* literal ok: <reason> *\/`. Run in CI
 * next to the boundary check.
 */

const ROOT = resolve(import.meta.dirname, '..');
const DIRS = ['src/lib/Hearth', 'src/lib/ui'].map((dir) => join(ROOT, dir));

const SPACE_SCALE = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40]);
const SPACING_PROPERTY = /^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-[a-z]+)?$/;
const EXEMPT = /literal ok:/;

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(path);
		else if (/\.(svelte|css)$/.test(entry.name)) yield path;
	}
}

function styleBlocks(source, file) {
	if (file.endsWith('.css')) return [{ text: source, offset: 0 }];
	return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => ({
		text: match[1],
		offset: match.index + match[0].indexOf(match[1])
	}));
}

function lineOf(source, index) {
	return source.slice(0, index).split('\n').length;
}

const failures = [];

function check(file, source, block) {
	// one declaration per match: `property: value;` possibly spanning lines
	for (const declaration of block.text.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
		const [whole, property, rawValue] = declaration;
		const restOfLine = block.text.slice(declaration.index + whole.length).split('\n')[0];
		if (EXEMPT.test(whole) || EXEMPT.test(restOfLine)) continue;
		const value = rawValue.trim();
		const at = block.offset + declaration.index;
		const line = lineOf(source, at);
		const fail = (reason) => failures.push(`${file}:${line} ${property}: ${value.split('\n')[0]} - ${reason}`);

		if (/(#[0-9a-fA-F]{3,8}\b|\brgba?\((?!var)[^)]*\)|\bhsla?\()/.test(value) && property !== 'font-variation-settings') {
			fail('colour literal; use a --h-* token');
		}
		if (property === 'font-size' && !/^var\(--h-type-/.test(value) && value !== 'inherit') {
			fail('font size off the type scale; use var(--h-type-*)');
		}
		if (property === 'border-radius') {
			const bare = value.replace(/var\([^)]+\)/g, '').replace(/50%|inherit|0/g, '').trim();
			if (bare) fail('radius literal; use a --h-radius-* token');
		}
		if (property === 'z-index' && !/^var\(|^calc\(var\(|^auto$|^0$|^-1$/.test(value)) {
			fail('z-index literal; use a --h-layer-* token');
		}
		if ((property === 'transition' || property === 'transition-duration') && /\b\d+m?s\b/.test(value)) {
			fail('transition duration literal; use var(--h-motion-*)');
		}
		if (SPACING_PROPERTY.test(property)) {
			for (const px of value.matchAll(/(?<![\d.])(-?\d+(?:\.\d+)?)px/g)) {
				const number = Math.abs(Number(px[1]));
				if (!SPACE_SCALE.has(number)) fail(`${px[1]}px is off the spacing scale`);
			}
		}
	}
}

for (const dir of DIRS) {
	for await (const absolute of walk(dir)) {
		const file = relative(ROOT, absolute);
		const source = await readFile(absolute, 'utf8');
		for (const block of styleBlocks(source, file)) check(file, source, block);
	}
}

if (failures.length) {
	console.error(failures.join('\n'));
	console.error(`\nStyle token check failed with ${failures.length} declaration(s).`);
	process.exitCode = 1;
} else {
	console.log('Style token check passed.');
}
