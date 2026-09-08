import { writable } from 'svelte/store';

/** True while a CodeEditor autocompletion list is open; Escape then belongs to it. */
export const autocompleteOpen = writable(false);

/** Text a host wants inserted at the CodeEditor cursor; '__clear__' empties the document. */
export const pasteContent = writable<string | undefined>();
