/*
 * Flags user-facing text written directly into a Svelte template instead of
 * going through $lang(). Applies to text nodes and to the attributes that
 * render as copy (label, title, aria-label and friends). Placeholders are
 * exempt: they show example values, not copy.
 */

const COPY_ATTRIBUTES = new Set([
	'label',
	'title',
	'aria-label',
	'confirmLabel',
	'removeLabel',
	'text',
	'name',
	'sub'
]);

// attributes whose string values are identifiers, never copy
const IDENTIFIER_ELEMENTS = new Set(['Icon', 'svelte:element', 'input', 'meta', 'link']);

// two letters in a row is the smallest thing that reads as a word; symbols,
// units and numbers pass
const WORD = /[A-Za-z]{2,}/;

// units and symbols that are the same in every language
const UNITS = new Set(['kWh', 'Wh', 'px', 'ppm', 'dB', 'ms', 'min', 'km', 'kg']);

function isCopy(text) {
	const trimmed = text.replace(/\s+/g, ' ').trim();
	if (!WORD.test(trimmed)) return false;
	if (UNITS.has(trimmed)) return false;
	// technical tokens: entity ids, css values, urls, single lowercase tokens
	if (/^[a-z0-9_.:/#%*-]+$/.test(trimmed)) return false;
	return true;
}

export default {
	meta: {
		type: 'problem',
		docs: { description: 'user-facing text must go through $lang()' },
		schema: []
	},
	create(context) {
		return {
			SvelteText(node) {
				for (let parent = node.parent; parent; parent = parent.parent) {
					if (parent.type === 'SvelteStyleElement' || parent.type === 'SvelteScriptElement') return;
				}
				if (!isCopy(node.value)) return;
				context.report({ node, message: `Bare text "${node.value.trim()}": use $lang()` });
			},
			SvelteAttribute(node) {
				const key = node.key?.name;
				if (!COPY_ATTRIBUTES.has(key)) return;
				const parentName = node.parent?.parent?.name?.name ?? node.parent?.parent?.name;
				if (key === 'name' && parentName !== undefined && parentName !== 'TextField') return;
				if (IDENTIFIER_ELEMENTS.has(parentName)) return;
				if (node.value.length !== 1) return;
				const value = node.value[0];
				if (value.type !== 'SvelteLiteral') return;
				if (!isCopy(value.value)) return;
				context.report({
					node: value,
					message: `Bare ${key} "${value.value.trim()}": use $lang()`
				});
			}
		};
	}
};
