<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { CardEditorProps } from '../types';
	import type { TemperatureCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<TemperatureCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let label = $state(initial?.label ?? '');
	let entity = $state(initial?.entity ?? '');
	let unit = $state(initial?.unit ?? '°C');
	let climateEntity = $state(initial?.climate_entity ?? '');
	let verdict = $state(initial?.verdict !== false);
	// custom verdict bands have no form fields; a YAML-authored object survives
	// form edits as long as the verdict stays enabled
	const initialBands = typeof initial?.verdict === 'object' ? initial.verdict : undefined;

	$effect(() => {
		onchange({
			fields: {
				label: label.trim() || undefined,
				entity: entity.trim() || undefined,
				unit: unit.trim() || undefined,
				climate_entity: climateEntity.trim() || undefined,
				verdict: verdict ? initialBands : false
			}
		});
	});
</script>

<TextField
	label={$lang('hearth_label')}
	bind:value={label}
	placeholder="Average home temperature"
/>
<EntityField label={$lang('entity')} bind:value={entity} domains={['sensor']} />
<TextField label={$lang('hearth_unit')} bind:value={unit} placeholder="°C" />
<EntityField
	label={$lang('hearth_thermostat_optional')}
	bind:value={climateEntity}
	domains={['climate']}
/>
<div class="hint">{$lang('hearth_adds_a_target_readout_with_controls')}</div>
<label class="check">
	<input type="checkbox" bind:checked={verdict} />
	<span>{$lang('hearth_verdict_pill_for_air_sensors_good')}</span>
</label>
<div class="hint">
	{$lang('hearth_judged_by_device_class_custom_thresholds')}
</div>
