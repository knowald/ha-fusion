<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let attributes = $derived(stateObj?.attributes ?? {});
	let on = $derived(stateObj?.state === 'on');
	let humidity = $derived<number>(attributes.humidity ?? 50);
	let min = $derived<number>(attributes.min_humidity ?? 0);
	let max = $derived<number>(attributes.max_humidity ?? 100);
	let modes = $derived<string[]>(
		Array.isArray(attributes.available_modes) ? attributes.available_modes : []
	);
	let draft = $state<number | null>(null);
</script>

<div class="segments">
	<button
		type="button"
		class="segment"
		class:active={on}
		onclick={() => callEntityService('humidifier', 'turn_on', entity)}
		>{$lang('hearth_turn_on')}</button
	>
	<button
		type="button"
		class="segment"
		class:active={!on}
		onclick={() => callEntityService('humidifier', 'turn_off', entity)}
		>{$lang('hearth_turn_off')}</button
	>
</div>
<div class="label">{$lang('hearth_target_humidity')}</div>
<div class="stepper">
	<div><span class="value">{draft ?? humidity}</span><span class="unit">%</span></div>
</div>
<input
	type="range"
	{min}
	{max}
	value={draft ?? humidity}
	oninput={(event) => (draft = Number(event.currentTarget.value))}
	onchange={(event) => {
		draft = null;
		callEntityService('humidifier', 'set_humidity', entity, {
			humidity: Number(event.currentTarget.value)
		});
	}}
/>
{#if modes.length}
	<div class="label">{$lang('hearth_mode')}</div>
	<div class="segments">
		{#each modes as mode (mode)}
			<button
				type="button"
				class="segment"
				class:active={attributes.mode === mode}
				onclick={() => callEntityService('humidifier', 'set_mode', entity, { mode })}
			>
				{mode}
			</button>
		{/each}
	</div>
{/if}
