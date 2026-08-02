export type ClockHourFormat = 'auto' | '12' | '24';

/** Returns an IANA time-zone name only when Intl can actually format it. */
export function validTimeZone(value?: string): string | undefined {
	const candidate = value?.trim();
	if (!candidate) return undefined;
	try {
		new Intl.DateTimeFormat('en', { timeZone: candidate }).format();
		return candidate;
	} catch {
		return undefined;
	}
}

export function clockTimeOptions(
	timeZone: string | undefined,
	hourFormat: ClockHourFormat = 'auto',
	showSeconds = false
): Intl.DateTimeFormatOptions {
	return {
		hour: '2-digit',
		minute: '2-digit',
		...(showSeconds ? { second: '2-digit' as const } : {}),
		...(hourFormat === '12' ? { hour12: true } : hourFormat === '24' ? { hour12: false } : {}),
		...(timeZone ? { timeZone } : {})
	};
}

export function hourInTimeZone(date: Date, locale: string, timeZone?: string): number {
	const part = new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		hourCycle: 'h23',
		...(timeZone ? { timeZone } : {})
	})
		.formatToParts(date)
		.find(({ type }) => type === 'hour')?.value;
	return part === undefined ? date.getHours() : Number(part);
}
