import type { EntityGroupSummary } from '$lib/core/ha/entities';

export interface GroupSummaryText {
	/** "2 on · 3 off", or the group size when nothing counts. */
	text: string;
	/** The active half alone, for the popover header; null when nothing is active. */
	badge: string | null;
	activeLabel: string;
}

/** Words a counted group in the user's language. */
export function formatGroupSummary(
	summary: EntityGroupSummary,
	translate: (key: string) => string
): GroupSummaryText {
	const word = (key: string) => translate(key).toLowerCase();
	if (!summary.countable) {
		const size = `${summary.total} ${word(summary.total === 1 ? 'entity' : 'entities')}`;
		return { text: size, badge: null, activeLabel: size };
	}
	const activeLabel = `${summary.active} ${word(summary.activeWord)}`;
	const parts = [
		...(summary.active ? [activeLabel] : []),
		...(summary.inactive ? [`${summary.inactive} ${word(summary.inactiveWord)}`] : [])
	];
	// nothing countable yet: still say it in the group's own words
	return {
		text: parts.length ? parts.join(' \u00b7 ') : activeLabel,
		badge: summary.active ? activeLabel : null,
		activeLabel
	};
}
