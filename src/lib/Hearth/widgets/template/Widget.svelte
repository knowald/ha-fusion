<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { connected } from '$lib/core/ha/connection';
	import { subscribeTemplate } from '$lib/core/ha/history';
	import { loadMarkdownRenderer } from '../../markdown';
	import type { TemplateWidget } from './descriptor';

	let { widget }: { widget: TemplateWidget } = $props();

	let html = $state('');
	let error = $state<string | null>(null);

	// Home Assistant pushes a new render whenever a referenced state changes
	$effect(() => {
		const template = widget.template;
		if (!template || !$connected) return;
		let unsubscribe: (() => void) | undefined;
		let cancelled = false;
		subscribeTemplate(template, async (result) => {
			const render = await loadMarkdownRenderer();
			if (cancelled) return;
			html = render(result);
			error = null;
		})
			.then((stop) => {
				if (cancelled) stop();
				else unsubscribe = stop;
			})
			.catch((failure: { message?: string }) => {
				if (!cancelled) error = failure?.message ?? 'template_error';
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
		font-size: var(--h-type-body);
		color: var(--h-text-3);
		overflow-wrap: anywhere;
	}

	.template :global(p) {
		margin: 0 0 6px;
	}

	.error {
		color: var(--h-bad-text);
		font-size: var(--h-type-small);
	}
</style>
