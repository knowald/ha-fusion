<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let attributes = $derived(stateObj?.attributes ?? {});
	let features = $derived<number>(attributes.supported_features ?? 0);
	let target = $derived<number | null>(
		typeof attributes.temperature === 'number' ? attributes.temperature : null
	);
	let min = $derived<number>(attributes.min_temp ?? 30);
	let max = $derived<number>(attributes.max_temp ?? 80);
	let modes = $derived<string[]>(
		Array.isArray(attributes.operation_list) ? attributes.operation_list : []
	);

	function setTemperature(value: number) {
		callEntityService('water_heater', 'set_temperature', entity, {
			temperature: Math.min(max, Math.max(min, value))
		});
	}
</script>

{#if (features & 1) === 1 && target !== null}
	<div class="label">{$lang('hearth_target_temperature')}</div>
	<div class="stepper">
		<button
			type="button"
			class="step"
			aria-label={$lang('hearth_decrement')}
			onclick={() => setTemperature(target - 1)}>-</button
		>
		<div><span class="value">{target}</span><span class="unit">°</span></div>
		<button
			type="button"
			class="step"
			aria-label={$lang('hearth_increment')}
			onclick={() => setTemperature(target + 1)}>+</button
		>
	</div>
{/if}
{#if (features & 2) === 2 && modes.length}
	<div class="label">{$lang('hearth_operation_mode')}</div>
	<div class="segments">
		{#each modes as mode (mode)}
			<button
				type="button"
				class="segment"
				class:active={attributes.operation_mode === mode}
				onclick={() =>
					callEntityService('water_heater', 'set_operation_mode', entity, { operation_mode: mode })}
			>
				{mode}
			</button>
		{/each}
	</div>
{/if}
{#if (features & 4) === 4}
	<div class="label">{$lang('hearth_away_mode')}</div>
	<div class="segments">
		<button
			type="button"
			class="segment"
			class:active={attributes.away_mode === 'on'}
			onclick={() =>
				callEntityService('water_heater', 'set_away_mode', entity, { away_mode: true })}
		>
			{$lang('on')}
		</button>
		<button
			type="button"
			class="segment"
			class:active={attributes.away_mode !== 'on'}
			onclick={() =>
				callEntityService('water_heater', 'set_away_mode', entity, { away_mode: false })}
		>
			{$lang('off')}
		</button>
	</div>
{/if}
