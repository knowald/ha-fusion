<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { WidgetEditorProps } from '../types';
	import type { ChartWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<ChartWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let name = $state(initial?.name ?? '');
	let style = $state<string>(initial?.style ?? 'line');
	let period = $state<string>(initial?.period ?? 'day');
	let math = $state(initial?.math ?? '');
	let stroke = $state(initial?.stroke ? String(initial.stroke) : '');

	$effect(() => {
		const strokeValue = parseInt(stroke, 10);
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				name: name.trim() || undefined,
				style: style === 'line' ? undefined : (style as ChartWidget['style']),
				period: period === 'day' ? undefined : (period as ChartWidget['period']),
				math: math.trim() || undefined,
				stroke: Number.isFinite(strokeValue) && strokeValue > 0 ? strokeValue : undefined
			}
		});
	});
</script>

<EntityField label={$lang('entity')} bind:value={entity} />
<TextField label={$lang('hearth_name_optional')} bind:value={name} />
<SelectField
	label={$lang('hearth_chart_style')}
	bind:value={style}
	options={[
		{ value: 'line', label: $lang('hearth_chart_line') },
		{ value: 'history', label: $lang('hearth_chart_history') },
		{ value: 'bar', label: $lang('hearth_chart_bar') },
		{ value: 'radial', label: $lang('hearth_chart_radial') }
	]}
/>
{#if style === 'line' || style === 'history'}
	<SelectField
		label={$lang('hearth_period')}
		bind:value={period}
		options={[
			{ value: 'hour', label: $lang('hearth_last_hour') },
			{ value: 'day', label: $lang('hearth_last_day') },
			{ value: 'week', label: $lang('hearth_last_week') },
			{ value: 'month', label: $lang('hearth_last_month') }
		]}
	/>
{/if}
{#if style !== 'history'}
	<TextField label={$lang('hearth_math')} bind:value={math} placeholder="x / 1000" />
	<div class="hint">{$lang('hearth_math_hint')}</div>
{/if}
{#if style === 'line' || style === 'radial'}
	<TextField
		label={$lang('hearth_stroke_width')}
		bind:value={stroke}
		placeholder={style === 'radial' ? '9' : '2'}
	/>
{/if}
