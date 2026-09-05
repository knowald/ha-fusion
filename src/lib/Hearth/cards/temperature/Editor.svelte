<script lang="ts">
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
				verdict: verdict ? initialBands : false,
				height: initial?.height
			}
		});
	});
</script>

<TextField label="Label" bind:value={label} placeholder="Average home temperature" />
<EntityField label="Entity" bind:value={entity} domains={['sensor']} />
<TextField label="Unit" bind:value={unit} placeholder="°C" />
<EntityField label="Thermostat (optional)" bind:value={climateEntity} domains={['climate']} />
<div class="hint">Adds a target readout with +/- controls and a target line.</div>
<label class="check">
	<input type="checkbox" bind:checked={verdict} />
	<span>Verdict pill for air sensors (GOOD / FAIR / POOR)</span>
</label>
<div class="hint">
	Judged by device class; custom thresholds go in YAML as verdict: &lbrace; good, fair, max
	&rbrace;.
</div>
