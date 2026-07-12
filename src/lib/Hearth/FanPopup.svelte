<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import { setFanSpeed } from './store';

	let { entity }: { entity: string } = $props();

	const speeds = [
		{ label: 'Off', value: 0 },
		{ label: 'Low', value: 33 },
		{ label: 'Med', value: 66 },
		{ label: 'High', value: 100 }
	];

	let fan = $derived($states?.[entity]);
	let on = $derived(fan?.state === 'on');
	let speedPct = $derived(on ? Math.round(fan?.attributes?.percentage ?? 0) : 0);
	// snap the reported percentage to the nearest segment
	let active = $derived(
		on
			? speeds.reduce((nearest, speed) =>
					Math.abs(speed.value - speedPct) < Math.abs(nearest.value - speedPct) ? speed : nearest
				).value
			: 0
	);
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
		gap: 10px;
	}

	.segment {
		flex: 1;
		text-align: center;
		padding: 15px 0;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		cursor: pointer;
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-text-3);
	}

	.segment.active {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
		font-weight: 600;
	}
</style>
