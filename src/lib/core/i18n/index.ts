import { derived, writable } from 'svelte/store';

export interface Translations {
	[key: string]: string;
}

export const translation = writable<Translations>({});
export const selectedLanguage = writable<string>();

/**
 * Substitutes {name} placeholders in translated copy. Plain string
 * replacement would read "$&" in a value as a pattern; this does not.
 */
export function fill(text: string, values: Record<string, string | number>): string {
	return Object.entries(values).reduce(
		(out, [key, value]) => out.split(`{${key}}`).join(String(value)),
		text
	);
}

/** Looks a key up in the active locale, then English, then returns the key itself. */
export const lang = derived(
	translation,
	(obj: Translations & { _default?: Record<string, string> }) => (key: string) =>
		obj[key] || obj._default?.[key] || key
);
