<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import type { IframeWidget } from './descriptor';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<IframeWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let url = $state(initial?.url ?? '');
	let height = $state(initial?.height ? String(initial.height) : '');

	$effect(() => {
		const heightValue = parseInt(height, 10);
		onchange({
			fields: {
				url: url.trim() || undefined,
				height: Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined
			}
		});
	});
</script>

<TextField label={$lang('hearth_url')} bind:value={url} placeholder="https://" />
<TextField label={$lang('hearth_height_px')} bind:value={height} placeholder="150" />
