<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { vacuumCommand } from '$lib/core/domains/vacuum';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let vacuumState = $derived(stateObj?.state);
	let battery = $derived(stateObj?.attributes?.battery_level);
</script>

{#if typeof battery === 'number'}
	<div class="readout"><span>{$lang('hearth_battery')}</span><strong>{battery}%</strong></div>
{/if}
<div class="segments">
	<button
		type="button"
		class="segment"
		class:active={vacuumState === 'cleaning'}
		onclick={() => vacuumCommand(entity, 'start')}>{$lang('hearth_start')}</button
	>
	<button
		type="button"
		class="segment"
		class:active={vacuumState === 'paused'}
		onclick={() => vacuumCommand(entity, 'pause')}>{$lang('hearth_pause')}</button
	>
	<button type="button" class="segment" onclick={() => vacuumCommand(entity, 'stop')}
		>{$lang('hearth_stop')}</button
	>
	<button
		type="button"
		class="segment"
		class:active={vacuumState === 'returning' || vacuumState === 'docked'}
		onclick={() => vacuumCommand(entity, 'return_to_base')}>{$lang('hearth_return_to_base')}</button
	>
	<button type="button" class="segment" onclick={() => vacuumCommand(entity, 'locate')}
		>{$lang('hearth_locate')}</button
	>
</div>
