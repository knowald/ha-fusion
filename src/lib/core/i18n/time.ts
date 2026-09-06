/** Anchored ISO timestamp check: YYYY-MM-DDTHH:MM:SS and parseable. */
export function isTimestamp(state: string): boolean {
	const format = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
	return format.test(state) && !isNaN(new Date(state).getTime());
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['second', 60],
	['minute', 60],
	['hour', 24],
	['day', 30],
	['month', 12],
	['year', Infinity]
];

/** An ISO timestamp as "3 hours ago" in the given locale. */
export function relativeTime(timestamp: string, languageCode: string | undefined): string {
	const date = new Date(timestamp);
	if (isNaN(date.getTime())) {
		console.error(`Invalid timestamp: ${timestamp}`);
		return timestamp;
	}
	const formatter = new Intl.RelativeTimeFormat(languageCode, { numeric: 'auto' });
	const diff = (date.getTime() - Date.now()) / 1000;
	let magnitude = Math.abs(diff);
	let index = 0;
	for (; index < UNITS.length - 1; index++) {
		if (magnitude < UNITS[index][1]) break;
		magnitude /= UNITS[index][1];
	}
	return formatter.format(Math.round(magnitude) * (diff < 0 ? -1 : 1), UNITS[index][0]);
}
