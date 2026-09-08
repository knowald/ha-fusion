<script lang="ts">
	import { integerFromInput } from '../../edit/numbers';
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import type { IframeWidget } from './descriptor';
	import TextField from '../../edit/TextField.svelte';
	import { normalizeEmbedUrl } from '../../normalizers';

	let { initial: initialProp, onchange }: WidgetEditorProps<IframeWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let url = $state(initial?.url ?? '');
	let height = $state(initial?.height ? String(initial.height) : '');

	let urlValid = $derived(!url.trim() || normalizeEmbedUrl(url) !== undefined);

	$effect(() => {
		const heightValue = integerFromInput(height);
		onchange({
			fields: {
				url: normalizeEmbedUrl(url),
				height: Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined
			},
			valid: urlValid
		});
	});
</script>

<TextField label={$lang('hearth_url')} bind:value={url} placeholder="https://" />
{#if !urlValid}<div class="field-error">{$lang('hearth_embed_url_hint')}</div>{/if}
<TextField label={$lang('hearth_height_px')} bind:value={height} placeholder="150" />
