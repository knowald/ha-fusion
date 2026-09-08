import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

/*
 * Style token guard for Hearth and ui. Fails on literal colours, font sizes,
 * radii, z-index values and transition durations that bypass the tokens in
 * core/theme, and on spacing values off the even-pixel scale. A declaration may
 * opt out with a same-line comment: `/* literal ok: <reason> *\/`. Run in CI
 * next to the boundary check.
 */

const ROOT = resolve(import.meta.dirname, '..');
const ROOTS = ['src/lib/Hearth', 'src/lib/ui', 'src/routes/+page.svelte'].map((path) =>
	join(ROOT, path)
);

const SPACE_SCALE = new Set([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40]);
const SPACING_PROPERTY =
	/^(padding|margin|gap|row-gap|column-gap|inset|top|right|bottom|left)(-[a-z]+)?$/;
const EXEMPT = /literal ok:/;

async function* walk(path) {
	if ((await stat(path)).isFile()) {
		if (/\.(svelte|css)$/.test(path)) yield path;
		return;
	}
	for (const entry of await readdir(path, { withFileTypes: true })) {
		yield* walk(join(path, entry.name));
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

// removes every var(...) and calc(...) call, including nested fallbacks,
// which a single regex cannot balance
function withoutFunctions(value) {
	let out = '';
	let depth = 0;
	for (let i = 0; i < value.length; i += 1) {
		if (depth === 0) {
			const call = /^(var|calc)\(/.exec(value.slice(i));
			if (call) {
				depth = 1;
				i += call[0].length - 1;
				continue;
			}
			out += value[i];
		} else if (value[i] === '(') depth += 1;
		else if (value[i] === ')') depth -= 1;
	}
	return out;
}

function check(file, source, block) {
	// one declaration per match: `property: value;` possibly spanning lines
	for (const declaration of block.text.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)) {
		const [whole, property, rawValue] = declaration;
		const restOfLine = block.text.slice(declaration.index + whole.length).split('\n')[0];
		if (EXEMPT.test(whole) || EXEMPT.test(restOfLine)) continue;
		const value = rawValue.trim();
		const at = block.offset + declaration.index;
		const line = lineOf(source, at);
		const fail = (reason) =>
			failures.push(`${file}:${line} ${property}: ${value.split('\n')[0]} - ${reason}`);

		if (
			/(#[0-9a-fA-F]{3,8}\b|\brgba?\((?!var)[^)]*\)|\bhsla?\()/.test(value) &&
			property !== 'font-variation-settings'
		) {
			fail('colour literal; use a --h-* token');
		}
		if (property === 'font-size' && !/^var\(--h-type-/.test(value) && value !== 'inherit') {
			fail('font size off the type scale; use var(--h-type-*)');
		}
		if (property === 'border-radius') {
			const bare = withoutFunctions(value)
				.replace(/50%|inherit|0/g, '')
				.trim();
			if (bare) fail('radius literal; use a --h-radius-* token');
		}
		if (property === 'z-index' && !/^var\(|^calc\(var\(|^auto$|^0$|^-1$/.test(value)) {
			fail('z-index literal; use a --h-layer-* token');
		}
		if (
			(property === 'transition' || property === 'transition-duration') &&
			/\b\d+m?s\b/.test(value)
		) {
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

for (const root of ROOTS) {
	for await (const absolute of walk(root)) {
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
