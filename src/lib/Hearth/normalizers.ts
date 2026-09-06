import type { EntityRef, SceneRef, VacuumModeRef, VerdictBands } from './types';
import { uniqueId } from './config';

/*
 * Field-level normalizers that card and widget descriptors compose. Nothing
 * here knows about card types, so descriptors can import it without a cycle.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** A fill weight; anything unusable means "use the type's default". */
export function normalizeFill(raw: unknown): number | undefined {
	return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0
		? Math.min(12, Math.round(raw * 10) / 10)
		: undefined;
}

/** A card or widget height in px; anything unusable means "size to content". */
export function normalizeHeight(raw: unknown): number | undefined {
	return typeof raw === 'number' && Number.isFinite(raw) && raw >= 40 ? Math.round(raw) : undefined;
}

export function normalizeVerdict(raw: unknown): false | VerdictBands | undefined {
	if (raw === false) return false;
	if (
		isRecord(raw) &&
		typeof raw.good === 'number' &&
		typeof raw.fair === 'number' &&
		raw.good < raw.fair
	) {
		return {
			good: raw.good,
			fair: raw.fair,
			max: typeof raw.max === 'number' && raw.max > raw.fair ? raw.max : undefined
		};
	}
	return undefined;
}

export function normalizeEntityRef(raw: any): EntityRef | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const entity = trimmedOrUndefined(raw.entity);
	if (!entity) return null;
	return {
		...raw,
		entity,
		name: trimmedOrUndefined(raw.name),
		icon: trimmedOrUndefined(raw.icon),
		display: raw?.display === 'stat' || raw?.display === 'tile' ? raw.display : undefined,
		// kept as a tri-state: an explicit false opts one entity out of a
		// card-wide `readonly`
		readonly: typeof raw?.readonly === 'boolean' ? raw.readonly : undefined,
		slider_updates:
			raw?.slider_updates === 'release' || raw?.slider_updates === 'continuous'
				? raw.slider_updates
				: undefined,
		verdict: normalizeVerdict(raw?.verdict)
	};
}

export function trimmedOrUndefined(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * A URL an embed may load: absolute http(s), or a path on this host such as
 * `/local/page.html`. Other schemes (javascript:, data:, file:) are dropped so
 * a YAML edit cannot turn the iframe into a script runner.
 */
export function normalizeEmbedUrl(value: unknown): string | undefined {
	const url = trimmedOrUndefined(value);
	if (!url) return undefined;
	return /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : undefined;
}

export function normalizeSceneRef(raw: any): SceneRef | null {
	const entity = normalizeEntityRef(raw);
	if (!entity) return null;
	// YAML resolves `active_state: on` to a boolean and `active_state: 22` to a
	// number; both are legal HA states once stringified
	const activeState =
		typeof raw?.active_state === 'boolean' || typeof raw?.active_state === 'number'
			? String(raw.active_state)
			: raw?.active_state;
	return {
		...entity,
		caption: trimmedOrUndefined(raw?.caption),
		active_entity: trimmedOrUndefined(raw?.active_entity),
		// an empty state is meaningless, but a whitespace one is a legal HA state
		active_state: typeof activeState === 'string' && activeState !== '' ? activeState : undefined
	};
}

export function normalizeVacuumModeRef(raw: any): VacuumModeRef | null {
	const entity = normalizeEntityRef(raw);
	if (!entity) return null;
	// YAML resolves `duration: 48` to a number, which is still a usable caption
	const duration = typeof raw?.duration === 'number' ? String(raw.duration) : raw?.duration;
	return {
		...entity,
		detail: trimmedOrUndefined(raw?.detail),
		duration: trimmedOrUndefined(duration),
		default: raw?.default === true ? true : undefined
	};
}

export function reserveId(raw: unknown, fallback: string, taken: string[]): string {
	const id = uniqueId(trimmedOrUndefined(raw) ?? fallback, taken);
	taken.push(id);
	return id;
}
