import { describe, expect, it } from 'vitest';
import { normalizeEmbedUrl } from './normalizers';

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
