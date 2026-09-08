<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let value = $derived(stateObj?.state ?? '-');
	let min = $derived(stateObj?.attributes?.minimum);
	let max = $derived(stateObj?.attributes?.maximum);
</script>

<div class="stepper">
	<button
		type="button"
		class="step"
		aria-label={$lang('hearth_decrement')}
		disabled={typeof min === 'number' && Number(value) <= min}
		onclick={() => callEntityService('counter', 'decrement', entity)}>-</button
	>
	<span class="value">{value}</span>
	<button
		type="button"
		class="step"
		aria-label={$lang('hearth_increment')}
		disabled={typeof max === 'number' && Number(value) >= max}
		onclick={() => callEntityService('counter', 'increment', entity)}>+</button
	>
</div>
<div class="segments">
	<button
		type="button"
		class="segment"
		onclick={() => callEntityService('counter', 'reset', entity)}
	>
		{$lang('hearth_reset')}
	</button>
</div>
