import { derived, get, writable } from 'svelte/store';
import { base } from '$app/paths';
import { validTimeZone } from './clock';
import type { SliderUpdateMode } from '$lib/core/app/configuration';
import { DEFAULT_HEARTH_CONFIG, type HearthConfig } from './config';

/* configuration */

export const hearthConfig = writable<HearthConfig>(structuredClone(DEFAULT_HEARTH_CONFIG));

// Non-null when the source file exists but could not be parsed/read. Editing
// stays locked so fallback rendering can never overwrite that source.
export const hearthLoadError = writable<string | null>(null);

// True only when the server found no usable source document. The dashboard
// can offer discovery automatically without confusing parse/I/O failures with
// a first run.
export const hearthNeedsSetup = writable(false);

// server-managed save counter for conflict detection between tabs
export const hearthRevision = writable(0);

const undoStack: HearthConfig[] = [];
const redoStack: HearthConfig[] = [];

export const canUndo = writable(false);
export const canRedo = writable(false);

function syncHistoryFlags() {
	canUndo.set(undoStack.length > 0);
	canRedo.set(redoStack.length > 0);
}

export function updateConfig(mutate: (config: HearthConfig) => void) {
	hearthConfig.update((config) => {
		undoStack.push(config);
		if (undoStack.length > 50) undoStack.shift();
		redoStack.length = 0;
		const next = structuredClone(config);
		mutate(next);
		return next;
	});
	syncHistoryFlags();
}

export function undoConfig() {
	const previous = undoStack.pop();
	if (!previous) return;
	redoStack.push(get(hearthConfig));
	hearthConfig.set(previous);
	syncHistoryFlags();
}

export function redoConfig() {
	const next = redoStack.pop();
	if (!next) return;
	undoStack.push(get(hearthConfig));
	hearthConfig.set(next);
	syncHistoryFlags();
}

/* edit mode */

export const hearthEditMode = writable(false);

// edit mode arranges layout; taps there must never fire real device commands

export type Editor =
	| { kind: 'room'; id: string | null }
	// Existing cards are addressed by their globally unique id. Column/stack
	// identify only the insertion destination for a new card.
	| { kind: 'card'; roomId: string; id: string | null; column?: number; stackId?: string }
	| { kind: 'stack'; roomId: string; column: number; index: number }
	| { kind: 'railWidget'; index: number | null }
	| { kind: 'theme' }
	| { kind: 'settings' }
	| { kind: 'appSettings' }
	| { kind: 'customCss' }
	| { kind: 'code' };

export const editor = writable<Editor | null>(null);

// The dashboard previews this slot while the theme editor is open.
export const editedThemeSlot = writable<'day' | 'night'>('day');

let editSnapshot: HearthConfig | null = null;

export function enterEditMode() {
	editSnapshot = structuredClone(get(hearthConfig));
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	hearthEditMode.set(true);
}

export function cancelEdit() {
	if (editSnapshot) hearthConfig.set(editSnapshot);
	editSnapshot = null;
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	editor.set(null);
	hearthEditMode.set(false);
}

export const saveState = writable<'idle' | 'saved' | 'conflict' | 'error'>('idle');
/** Why the last save failed, from the server when it said. */
export const saveFailure = writable<string | null>(null);
let savedToastTimer: ReturnType<typeof setTimeout>;

/** Save and surface the outcome through saveState instead of throwing. */
export async function saveWithFeedback(force = false): Promise<void> {
	saveState.set('idle');
	saveFailure.set(null);
	try {
		await saveEdit(force);
	} catch (error) {
		console.error(error);
		saveFailure.set(error instanceof Error ? error.message : String(error));
		saveState.set('error');
	}
}

let saveInFlight: Promise<boolean> | null = null;

/** Returns false on a revision conflict (another tab saved first). */
export function saveEdit(force = false): Promise<boolean> {
	// a second save while one is in flight would race its feedback and could
	// clear history for edits it never sent, so it shares the first request
	if (!saveInFlight) {
		saveInFlight = performSave(force).finally(() => {
			saveInFlight = null;
		});
	}
	return saveInFlight;
}

async function performSave(force: boolean): Promise<boolean> {
	const loadError = get(hearthLoadError);
	if (loadError) {
		saveState.set('error');
		throw new Error(`Cannot save an unreadable Hearth configuration: ${loadError}`);
	}
	const config = get(hearthConfig);
	const response = await fetch(`${base}/_api/save_hearth`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ revision: get(hearthRevision), config, force })
	});
	if (response.status === 409) {
		// keep the stale revision: a plain retry must conflict again, only the
		// explicit overwrite (force) may replace the other tab's save
		saveState.set('conflict');
		return false;
	}
	if (!response.ok) {
		saveState.set('error');
		const detail = (await response.text().catch(() => '')).trim();
		throw new Error(detail || `save failed with status ${response.status}`);
	}
	const { revision } = await response.json();
	hearthRevision.set(revision);
	saveState.set('saved');
	clearTimeout(savedToastTimer);
	savedToastTimer = setTimeout(() => saveState.set('idle'), 2500);
	if (get(hearthConfig) !== config) {
		// edits landed while the request was in flight; they are still unsaved,
		// so the editor stays open with its history and Cancel now returns to
		// what was just saved
		editSnapshot = config;
		return true;
	}
	editSnapshot = null;
	undoStack.length = 0;
	redoStack.length = 0;
	syncHistoryFlags();
	editor.set(null);
	hearthEditMode.set(false);
	return true;
}

/**
 * The zone times are shown in: the rail clock's configured zone when it has
 * one, else the browser's. Every surface that formats a wall-clock time
 * (clock, screensaver, calendar) reads it here.
 */
export const displayTimeZone = derived(hearthConfig, ($config) =>
	validTimeZone($config.rail.find((widget) => widget.type === 'clock')?.timezone)
);

/* navigation & popups */

export const currentRoom = writable<string>('home');

export type Popup = {
	kind: 'light' | 'blind' | 'fan' | 'media' | 'sensor' | 'detail';
	entity: string;
	name: string;
	sliderUpdates?: SliderUpdateMode;
};

export const popup = writable<Popup | null>(null);

export interface RequestedConfirmation {
	title: string;
	message: string;
	confirmLabel: string;
	action: () => void;
}

export const requestedConfirmation = writable<RequestedConfirmation | null>(null);

export function requestConfirmation(request: RequestedConfirmation) {
	requestedConfirmation.set(request);
}

export function dismissConfirmation() {
	requestedConfirmation.set(null);
}

export function confirmRequestedAction() {
	const request = get(requestedConfirmation);
	requestedConfirmation.set(null);
	request?.action();
}

export function closePopup() {
	popup.set(null);
}
