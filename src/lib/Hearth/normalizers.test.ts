import { describe, expect, it } from 'vitest';
import { normalizeEmbedUrl, normalizeWholeNumber } from './normalizers';

describe('normalizeEmbedUrl', () => {
	it('keeps http(s) addresses and same-host paths', () => {
		expect(normalizeEmbedUrl(' https://example.com/a?b=1 ')).toBe('https://example.com/a?b=1');
		expect(normalizeEmbedUrl('http://192.168.1.2:8123/x')).toBe('http://192.168.1.2:8123/x');
		expect(normalizeEmbedUrl('/local/page.html')).toBe('/local/page.html');
	});

	it('drops other schemes and protocol-relative addresses', () => {
		for (const url of [
			'javascript:alert(1)',
			'data:text/html,hi',
			'file:///etc/passwd',
			'//evil',
			'',
			3
		]) {
			expect(normalizeEmbedUrl(url)).toBeUndefined();
		}
	});
});

describe('normalizeWholeNumber', () => {
	it('rounds finite numbers at or above the minimum and drops the rest', () => {
		expect(normalizeWholeNumber(12.4, 0)).toBe(12);
		expect(normalizeWholeNumber(0, 0)).toBe(0);
		expect(normalizeWholeNumber(0, 1)).toBeUndefined();
		for (const raw of [-1, NaN, Infinity, -Infinity, '12', null, [], {}]) {
			expect(normalizeWholeNumber(raw, 0)).toBeUndefined();
		}
	});
});
