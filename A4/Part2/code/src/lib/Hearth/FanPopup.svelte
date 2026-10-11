<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { getSupport } from '$lib/Utils';
	import { PRESS_RIPPLE } from './config';
	import { callEntityService, setFanSpeed } from './store';

	let { entity }: { entity: string } = $props();

	const speeds = [
		{ label: 'Off', value: 0 },
		{ label: 'Low', value: 33 },
		{ label: 'Med', value: 66 },
		{ label: 'High', value: 100 }
	];

	let fan = $derived($states?.[entity]);
	let attributes = $derived(fan?.attributes);
	let on = $derived(fan?.state === 'on');
	let speedPct = $derived(on ? Math.round(attributes?.percentage ?? 0) : 0);
	// snap the reported percentage to the nearest segment
	let active = $derived(
		on
			? speeds.reduce((nearest, speed) =>
					Math.abs(speed.value - speedPct) < Math.abs(nearest.value - speedPct) ? speed : nearest
				).value
			: 0
	);

	let supports = $derived(
		getSupport(attributes?.supported_features, {
			OSCILLATE: 2,
			DIRECTION: 4,
			PRESET_MODE: 8
		})
	);

	let presetModes = $derived<string[]>(
		Array.isArray(attributes?.preset_modes) ? attributes.preset_modes : []
	);

	function call(service: string, data: Record<string, unknown>) {
		callEntityService('fan', service, entity, data);
	}
</script>

<div class="label">FAN SPEED</div>
<div class="segments">
	{#each speeds as speed (speed.value)}
		<div
			class="segment pressable"
			class:active={active === speed.value}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => setFanSpeed(entity, speed.value)}
		>
			{speed.label}
		</div>
	{/each}
</div>

{#if supports?.PRESET_MODE && presetModes.length}
	<div class="label">PRESET MODE</div>
	<div class="segments">
		{#each presetModes as mode (mode)}
			<div
				class="segment pressable"
				class:active={attributes?.preset_mode === mode}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => call('set_preset_mode', { preset_mode: mode })}
			>
				{mode}
			</div>
		{/each}
	</div>
{/if}

{#if supports?.OSCILLATE}
	<div class="label">OSCILLATE</div>
	<div class="segments">
		<div
			class="segment pressable"
			class:active={attributes?.oscillating === true}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => call('oscillate', { oscillating: true })}
		>
			On
		</div>
		<div
			class="segment pressable"
			class:active={attributes?.oscillating === false}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => call('oscillate', { oscillating: false })}
		>
			Off
		</div>
	</div>
{/if}

{#if supports?.DIRECTION}
	<div class="label">DIRECTION</div>
	<div class="segments">
		<div
			class="segment pressable"
			class:active={attributes?.direction === 'forward'}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => call('set_direction', { direction: 'forward' })}
		>
			Forward
		</div>
		<div
			class="segment pressable"
			class:active={attributes?.direction === 'reverse'}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => call('set_direction', { direction: 'reverse' })}
		>
			Reverse
		</div>
	</div>
{/if}

<style>
	.label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 22px 0 10px;
	}

	.segments {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.segment {
		flex: 1;
		text-align: center;
		padding: 15px 0;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		cursor: pointer;
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		color: var(--h-text-3);
	}

	.segment.active {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
		font-weight: 600;
	}
</style>
