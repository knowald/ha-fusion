<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { hearthEditMode } from '../../store';
	import type { IframeWidget } from './descriptor';

	let { widget }: { widget: IframeWidget } = $props();
</script>

<iframe
	src={widget.url}
	title={$lang('hearth_widget_iframe_name')}
	style:height="{widget.height ?? 150}px"
	style:pointer-events={$hearthEditMode ? 'none' : undefined}
></iframe>

<style>
	iframe {
		display: block;
		width: 100%;
		border: 0;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
	}
</style>
