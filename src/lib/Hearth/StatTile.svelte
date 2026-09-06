<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import type { VerdictBands } from '$lib/core/domains/sensor';
	import { hearthEditMode, popup } from './store';
	import { airQualityVerdict } from '$lib/core/domains/sensor';
	import { entityAvailability, sensorNumber } from '$lib/core/ha/entities';

	let {
		entity,
		name = undefined,
		verdictBands = undefined
	}: { entity: string; name?: string; verdictBands?: false | VerdictBands } = $props();

	let stateObj = $derived($states?.[entity]);
	let availability = $derived(entityAvailability(stateObj));
	let label = $derived(name || stateObj?.attributes?.friendly_name || entity);
	let value = $derived(sensorNumber(stateObj?.state));
	let unit = $derived(stateObj?.attributes?.unit_of_measurement);
	let verdict = $derived(
		airQualityVerdict(stateObj?.attributes?.device_class, value, verdictBands)
	);
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

	// a numeric readout earns a tap: its 24h history in a popup
	let openable = $derived(value !== null && !$hearthEditMode);

	function openHistory() {
		if (openable) popup.set({ kind: 'sensor', entity, name: label });
	}
</script>

{#snippet body()}
	<div class="stat-head">
		<div class="stat-label">{label}</div>
		{#if verdict}
			<div class="stat-verdict" data-tone={verdict.tone}>{verdict.label}</div>
		{/if}
	</div>
	<div class="stat-value" class:muted={value === null}>
		{display}{#if unit && value !== null}<span class="stat-unit" class:tight={unit === '%'}
				>{unit}</span
			>{/if}
	</div>
	{#if verdict}
		<div class="band-track">
			<div
				class="band-fill"
				data-tone={verdict.tone}
				style:width="{Math.round(verdict.fraction * 100)}%"
			></div>
			{#each verdict.ticks as tick (tick)}
				<div class="band-tick" style:left="{tick * 100}%"></div>
			{/each}
		</div>
	{/if}
{/snippet}

{#if openable}
	<button type="button" class="stat openable" onclick={openHistory}>
		{@render body()}
	</button>
{:else}
	<div class="stat">
		{@render body()}
	</div>
{/if}

<style>
	.stat {
		display: block;
		box-sizing: border-box;
		width: 100%;
		margin: 0;
		padding: 14px var(--tile-pad-right, 14px) 14px 14px;
		border: 0;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
		font: inherit;
		color: inherit;
		text-align: left;
		appearance: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.stat.openable {
		cursor: pointer;
	}

	.stat-label {
		font-size: var(--h-type-secondary);
		color: var(--h-text-4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.stat-value {
		font-size: var(--h-type-stat);
		font-weight: 600;
		color: var(--h-text-1);
		margin-top: 4px;
	}

	.stat-unit {
		margin-left: 0.3em;
		font-size: var(--h-type-secondary);
		color: var(--h-text-5);
		font-weight: 400;
	}

	/* percent binds to its number: "41.4%", never "41.4 %" */
	.stat-unit.tight {
		margin-left: 0;
	}

	.stat-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	.stat-verdict {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1.2px;
		flex: none;
	}

	.stat-verdict[data-tone='good'] {
		color: var(--h-good-text);
	}

	.stat-verdict[data-tone='fair'] {
		color: var(--h-accent-dim-text);
	}

	.stat-verdict[data-tone='poor'] {
		color: var(--h-bad-text);
	}

	.band-track {
		position: relative;
		height: 4px;
		border-radius: var(--h-radius-pill);
		background: rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		margin-top: 12px;
	}

	.band-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		border-radius: var(--h-radius-pill);
	}

	.band-fill[data-tone='good'] {
		background: var(--h-good);
	}

	.band-fill[data-tone='fair'] {
		background: var(--h-accent-deep);
	}

	.band-fill[data-tone='poor'] {
		background: rgb(var(--h-bad-rgb));
	}

	.band-tick {
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 1px;
		background: rgb(var(--h-line-rgb) / calc(0.22 * var(--h-line-scale)));
	}
	/* an unavailable or missing entity reads as a note, not a reading */
	.stat-value.muted {
		font-size: var(--h-type-emphasis);
		color: var(--h-text-5);
	}
</style>
