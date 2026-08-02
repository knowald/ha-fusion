import { describe, expect, it } from 'vitest';
import { clockTimeOptions, hourInTimeZone, validTimeZone } from './clock';

describe('Hearth rail clock', () => {
	it('accepts IANA time zones and rejects city labels', () => {
		expect(validTimeZone(' Europe/Warsaw ')).toBe('Europe/Warsaw');
		expect(validTimeZone('Warsaw')).toBeUndefined();
	});

	it('builds explicit hour and seconds preferences', () => {
		expect(clockTimeOptions('Europe/Warsaw', '24', true)).toMatchObject({
			timeZone: 'Europe/Warsaw',
			hour12: false,
			second: '2-digit'
		});
	});

	it('uses the configured time zone for greeting time', () => {
		const instant = new Date('2026-01-01T12:00:00Z');
		expect(hourInTimeZone(instant, 'en', 'America/New_York')).toBe(7);
		expect(hourInTimeZone(instant, 'en', 'Asia/Tokyo')).toBe(21);
	});
});
