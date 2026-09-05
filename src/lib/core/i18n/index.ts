import { derived, writable } from 'svelte/store';

export interface Translations {
	[key: string]: string;
}

export const translation = writable<Translations>({});
export const selectedLanguage = writable<string>();

/** Looks a key up in the active locale, then English, then returns the key itself. */
export const lang = derived(
	translation,
	(obj: Translations & { _default?: Record<string, string> }) => (key: string) =>
		obj[key] || obj._default?.[key] || key
);
