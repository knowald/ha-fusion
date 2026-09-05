<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let attributes = $derived(stateObj?.attributes ?? {});
	// ValveEntityFeature: 1 open, 2 close, 4 set position, 8 stop
	let features = $derived<number>(attributes.supported_features ?? 0);
	let position = $derived<number | null>(
		typeof attributes.current_position === 'number' ? attributes.current_position : null
	);
	let draft = $state<number | null>(null);
</script>

<div class="segments">
	{#if (features & 1) === 1}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === 'open'}
			onclick={() => callEntityService('valve', 'open_valve', entity)}
			>{$lang('hearth_open')}</button
		>
	{/if}
	{#if (features & 8) === 8}
		<button
			type="button"
			class="segment"
			onclick={() => callEntityService('valve', 'stop_valve', entity)}
			>{$lang('hearth_stop')}</button
		>
	{/if}
	{#if (features & 2) === 2}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === 'closed'}
			onclick={() => callEntityService('valve', 'close_valve', entity)}
			>{$lang('hearth_close_valve')}</button
		>
	{/if}
</div>
{#if (features & 4) === 4 && position !== null}
	<div class="label">{$lang('hearth_position')}</div>
	<div class="stepper">
		<div><span class="value">{draft ?? position}</span><span class="unit">%</span></div>
	</div>
	<input
		type="range"
		min="0"
		max="100"
		value={draft ?? position}
		oninput={(event) => (draft = Number(event.currentTarget.value))}
		onchange={(event) => {
			draft = null;
			callEntityService('valve', 'set_valve_position', entity, {
				position: Number(event.currentTarget.value)
			});
		}}
	/>
{/if}
