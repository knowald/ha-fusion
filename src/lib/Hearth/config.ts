import type {
	HearthConfig,
	HearthRoom,
	OverviewCard,
	OverviewItem,
	OverviewStack,
	VisibilityCondition
} from './types';

export type * from './types';

export function isStack(item: OverviewItem): item is OverviewStack {
	return 'kind' in item && item.kind === 'stack';
}

/** Mutable list containing an id-addressed card or stack. */
export function findOverviewItemList(
	config: HearthConfig,
	id: string,
	roomId?: string
): OverviewItem[] | undefined {
	for (const room of config.rooms) {
		if (roomId && room.id !== roomId) continue;
		for (const column of room.cards) {
			if (column.some((item) => item.id === id)) return column;
			for (const item of column) {
				if (isStack(item) && item.cards.some((card) => card.id === id)) return item.cards;
			}
		}
	}
	return undefined;
}

export function findOverviewCard(
	config: HearthConfig,
	id: string,
	roomId?: string
): OverviewCard | undefined {
	const item = findOverviewItemList(config, id, roomId)?.find((entry) => entry.id === id);
	return item && !isStack(item) ? item : undefined;
}

/** Expands the same simple `*` glob used by Fusion's legacy entities object. */
export function wildcardEntityIds(pattern: string | undefined, entityIds: string[]): string[] {
	if (!pattern?.trim()) return [];
	const source = pattern
		.trim()
		.split('*')
		.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('.*');
	const regex = new RegExp(`^${source}$`);
	return entityIds.filter((entityId) => regex.test(entityId)).sort();
}

/** Card types that take a share of the leftover height unless told otherwise. */
export const DEFAULT_HEARTH_CONFIG: HearthConfig = {
	// sun.sun is part of a standard Home Assistant installation; without a
	// configured night theme this switch is inert.
	day_night: { entity: 'sun.sun' },
	rail: [
		{ id: 'clock', type: 'clock' },
		{ id: 'nav', type: 'nav' },
		{ id: 'spacer', type: 'spacer' }
	],
	rooms: [
		{
			id: 'home',
			name: 'Home',
			icon: 'home',
			hide_header: true,
			cards: [[]]
		}
	]
};

function normalizeVisibilityCondition(raw: any): VisibilityCondition | null {
	if (!raw || typeof raw !== 'object') return null;
	if (Array.isArray(raw.or)) {
		const nested = raw.or
			.map(normalizeVisibilityCondition)
			.filter(
				(condition: VisibilityCondition | null): condition is VisibilityCondition =>
					condition !== null
			);
		return nested.length ? { or: nested } : null;
	}
	if (typeof raw.media === 'string' && raw.media.trim()) {
		return { media: raw.media };
	}
	if (typeof raw.entity === 'string' && raw.entity.trim()) {
		const condition: VisibilityCondition = { entity: raw.entity };
		if (typeof raw.state === 'string' && raw.state !== '') condition.state = raw.state;
		if (typeof raw.state_not === 'string' && raw.state_not !== '')
			condition.state_not = raw.state_not;
		if (typeof raw.above === 'number' && Number.isFinite(raw.above)) condition.above = raw.above;
		if (typeof raw.below === 'number' && Number.isFinite(raw.below)) condition.below = raw.below;
		return condition;
	}
	return null;
}

/** Drops the field entirely rather than keeping an empty array. */
export function normalizeVisibility(raw: unknown): VisibilityCondition[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const conditions = raw
		.map(normalizeVisibilityCondition)
		.filter((condition): condition is VisibilityCondition => condition !== null);
	return conditions.length ? conditions : undefined;
}

/**
 * Reshapes card columns to `count`: overflow columns merge into the last kept
 * one, missing columns are added empty. Cards are never dropped.
 */
export function resizeCardColumns(columns: OverviewItem[][], count: number): OverviewItem[][] {
	const next: OverviewItem[][] = Array.from({ length: count }, (_, index) => [
		...(columns[index] ?? [])
	]);
	for (const overflow of columns.slice(count)) next[count - 1].push(...overflow);
	return next;
}

export function slugify(name: string) {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'item'
	);
}

/** Uppercases the first letter, e.g. for lowercase translation values. */
export function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function uniqueId(base: string, taken: string[]) {
	let id = base;
	let counter = 2;
	while (taken.includes(id)) id = `${base}-${counter++}`;
	return id;
}

function overviewItemIds(item: OverviewItem): string[] {
	return isStack(item) ? [item.id, ...item.cards.flatMap(overviewItemIds)] : [item.id];
}

/** Every card id on every page, for generating a fresh unique one. */
export function takenCardIds(config: HearthConfig): string[] {
	return config.rooms.flatMap((room) => (room.cards ?? []).flat().flatMap(overviewItemIds));
}

export function overviewItemTypeKey(item: OverviewItem): string {
	return isStack(item) ? 'stack' : item.type;
}

/**
 * Deep clone with a fresh id for the item and, if it's a stack, every child -
 * so an Alt-drag duplicate never collides with an existing id anywhere in the
 * config. Mutates `taken` as it goes so nested clones stay unique against
 * each other too.
 */
export function cloneOverviewItem<T extends OverviewItem>(item: T, taken: string[]): T {
	const cloned = structuredClone(item);
	const assignIds = (node: OverviewItem) => {
		node.id = uniqueId(slugify(overviewItemTypeKey(node)), taken);
		taken.push(node.id);
		if (isStack(node)) node.cards.forEach(assignIds);
	};
	assignIds(cloned);
	return cloned;
}

export function moveItem<T>(list: T[], index: number, delta: number) {
	const target = index + delta;
	if (index < 0 || target < 0 || target >= list.length) return;
	const [item] = list.splice(index, 1);
	list.splice(target, 0, item);
}

export const PRESS_RIPPLE = {
	color: 'rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)))'
};

/** Initializes a page's card columns (matching its column count) on first use. */
export function ensureRoomCardColumns(room: HearthRoom): OverviewItem[][] {
	if (!room.cards?.length) {
		room.cards = Array.from({ length: room.columns ?? 1 }, (): OverviewItem[] => []);
	}
	return room.cards;
}
