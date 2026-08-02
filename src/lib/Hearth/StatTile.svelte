<script lang="ts">
	import { lang, states } from '$lib/Stores';
	import { entityAvailability, sensorNumber } from './store';

	let { entity, name = undefined }: { entity: string; name?: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let availability = $derived(entityAvailability(stateObj));
	let label = $derived(name || stateObj?.attributes?.friendly_name || entity);
	let value = $derived(sensorNumber(stateObj?.state));
	let unit = $derived(stateObj?.attributes?.unit_of_measurement);
	let display = $derived(
		value === null
			? availability !== 'available'
				? availability === 'missing'
					? $lang('hearth_missing_entity')
					: $lang(availability)
				: stateObj.state
			: value % 1 === 0
				? String(value)
				: value.toFixed(1)
	);
</script>

<div class="stat">
	<div class="stat-label">{label}</div>
	<div class="stat-value">
		{display}{#if unit && value !== null}<span class="stat-unit">{unit}</span>{/if}
	</div>
</div>

<style>
	.stat {
		padding: 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
		user-select: none;
		-webkit-user-select: none;
	}

	.stat-label {
		font-size: 13px;
		color: var(--h-text-4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 600;
		color: var(--h-text-1);
		margin-top: 4px;
	}

	.stat-unit {
		margin-left: 0.3em;
		font-size: 13px;
		color: var(--h-text-5);
		font-weight: 400;
	}
</style>
