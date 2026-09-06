import { describe, expect, it } from 'vitest';
import { calendarDaysBetween, dateKey, isTimestamp, parseLocalDate } from './time';

describe('parseLocalDate', () => {
	it('reads a date-only value as local midnight', () => {
		const date = parseLocalDate('2026-03-29');
		expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 29]);
		expect(date.getHours()).toBe(0);
	});

	it('leaves timestamps to the platform parser', () => {
		expect(parseLocalDate('2026-03-29T10:30:00+02:00').getTime()).toBe(
			Date.parse('2026-03-29T10:30:00+02:00')
		);
		expect(Number.isNaN(parseLocalDate('nope').getTime())).toBe(true);
	});
});

describe('dateKey', () => {
	it('names the calendar date in the given zone', () => {
		const date = new Date('2026-03-29T23:30:00Z');
		expect(dateKey(date, 'UTC')).toBe('2026-03-29');
		expect(dateKey(date, 'Europe/Warsaw')).toBe('2026-03-30');
		expect(dateKey(date, 'America/Los_Angeles')).toBe('2026-03-29');
	});
});

describe('calendarDaysBetween', () => {
	it('counts local calendar days, not 24 hour periods', () => {
		expect(calendarDaysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1))).toBe(1);
		expect(calendarDaysBetween(new Date(2026, 0, 2, 0, 1), new Date(2026, 0, 2, 23, 59))).toBe(0);
		expect(calendarDaysBetween(new Date(2026, 0, 5), new Date(2026, 0, 2))).toBe(-3);
	});

	it('is unaffected by a daylight saving change in between', () => {
		expect(calendarDaysBetween(new Date(2026, 2, 28, 12), new Date(2026, 2, 30, 12))).toBe(2);
		expect(calendarDaysBetween(new Date(2026, 9, 24, 12), new Date(2026, 9, 26, 12))).toBe(2);
	});
});

describe('isTimestamp', () => {
	it('accepts anchored ISO timestamps only', () => {
		expect(isTimestamp('2026-03-29T10:30:00+02:00')).toBe(true);
		expect(isTimestamp('2026-03-29')).toBe(false);
	});
});
