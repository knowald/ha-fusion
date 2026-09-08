/*
 * Markdown from Home Assistant (template results, persistent notifications)
 * is authored by integrations and automations, not by this dashboard, so it
 * is sanitized before it reaches {@html}. Both libraries load on demand; most
 * dashboards never render Markdown.
 */

type Render = (source: string) => string;

let renderer: Promise<Render> | undefined;

export function loadMarkdownRenderer(): Promise<Render> {
	renderer ??= Promise.all([import('marked'), import('dompurify')]).then(
		([{ marked }, { default: DOMPurify }]) => {
			DOMPurify.addHook('afterSanitizeAttributes', (node) => {
				if (node.tagName === 'A' && node.hasAttribute('href')) {
					node.setAttribute('rel', 'noopener noreferrer');
				}
			});
			return (source) =>
				DOMPurify.sanitize(marked.parse(source, { async: false }), {
					USE_PROFILES: { html: true },
					ADD_ATTR: ['target']
				});
		}
	);
	return renderer;
}
