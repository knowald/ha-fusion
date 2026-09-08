<script lang="ts">
	import { integerFromInput } from '../../edit/numbers';
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import { SPACER_MIN_HEIGHT, type SpacerWidget } from './descriptor';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<SpacerWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let line = $state(initial?.line ?? false);
	let height = $state(initial?.height ? String(initial.height) : '');

	$effect(() => {
		const heightValue = integerFromInput(height);
		onchange({
			fields: {
				line: line || undefined,
				height:
					Number.isFinite(heightValue) && heightValue >= SPACER_MIN_HEIGHT ? heightValue : undefined
			}
		});
	});
</script>

<TextField label={$lang('hearth_height_px')} bind:value={height} placeholder="24" />
<div class="hint">{$lang('hearth_spacer_height_hint')}</div>
<label class="check">
	<input type="checkbox" bind:checked={line} />
	<span>{$lang('hearth_divider_line')}</span>
</label>

<style>
	.hint {
		margin: -8px 0 14px;
		font-size: var(--h-type-small);
		color: var(--h-text-6);
	}
</style>
