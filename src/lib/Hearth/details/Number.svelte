<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states, sensorNumber } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let attributes = $derived(stateObj?.attributes ?? {});
	let domain = $derived(entity.split('.')[0]);
	let min = $derived(typeof attributes.min === 'number' ? attributes.min : 0);
	let max = $derived(typeof attributes.max === 'number' ? attributes.max : 100);
	let step = $derived(typeof attributes.step === 'number' ? attributes.step : 1);
	let unit = $derived(attributes.unit_of_measurement ?? '');
	let current = $derived(sensorNumber(stateObj?.state) ?? min);
	let draft = $state<number | null>(null);
	let shown = $derived(draft ?? current);

	function commit(value: number) {
		const clamped = Math.min(max, Math.max(min, value));
		draft = null;
		callEntityService(domain, 'set_value', entity, { value: clamped });
	}
</script>

<div class="stepper">
	<button
		type="button"
		class="step"
		aria-label={$lang('hearth_decrement')}
		onclick={() => commit(current - step)}>-</button
	>
	<div><span class="value">{shown}</span><span class="unit">{unit}</span></div>
	<button
		type="button"
		class="step"
		aria-label={$lang('hearth_increment')}
		onclick={() => commit(current + step)}>+</button
	>
</div>
<input
	type="range"
	{min}
	{max}
	{step}
	value={shown}
	oninput={(event) => (draft = Number(event.currentTarget.value))}
	onchange={(event) => commit(Number(event.currentTarget.value))}
/>
