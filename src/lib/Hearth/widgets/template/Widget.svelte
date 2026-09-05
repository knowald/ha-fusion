<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { connected, connection } from '$lib/core/ha/connection';
	import type { TemplateWidget } from './descriptor';

	let { widget }: { widget: TemplateWidget } = $props();

	let html = $state('');
	let error = $state<string | null>(null);

	// Home Assistant pushes a new render whenever a referenced state changes
	$effect(() => {
		const conn = $connection;
		const template = widget.template;
		if (!template || !$connected || !conn) return;
		let unsubscribe: (() => void) | undefined;
		let cancelled = false;
		conn
			.subscribeMessage(
				async (response: { result?: string }) => {
					if (typeof response?.result === 'string') {
						const { marked } = await import('marked');
						html = marked.parse(response.result) as string;
						error = null;
					}
				},
				{ type: 'render_template', template }
			)
			.then((stop) => {
				if (cancelled) stop();
				else unsubscribe = stop;
			})
			.catch((failure: { message?: string }) => {
				error = failure?.message ?? 'template_error';
			});
		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	});
</script>

<div class="template">
	{#if error}
		<div class="error">{$lang('hearth_template_error')}: {error}</div>
	{:else}
		{@html html}
	{/if}
</div>

<style>
	.template {
		padding: 8px 0;
		font-size: 14px;
		color: var(--h-text-3);
		overflow-wrap: anywhere;
	}

	.template :global(p) {
		margin: 0 0 6px;
	}

	.error {
		color: var(--h-bad-text);
		font-size: 12px;
	}
</style>
