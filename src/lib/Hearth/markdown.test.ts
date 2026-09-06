import { describe, expect, it } from 'vitest';
import { loadMarkdownRenderer } from './markdown';

describe('markdown renderer', () => {
	it('renders Markdown and strips scripts, event handlers and unsafe links', async () => {
		const render = await loadMarkdownRenderer();
		const html = render(
			'**Door** open <script>alert(1)</script><img src=x onerror="alert(1)">' +
				' [x](javascript:alert(1)) [ok](https://example.com)'
		);
		expect(html).toContain('<strong>Door</strong>');
		expect(html).not.toContain('<script');
		expect(html).not.toContain('onerror');
		expect(html).not.toContain('javascript:');
		expect(html).toContain('href="https://example.com"');
		expect(html).toContain('rel="noopener noreferrer"');
	});
});
