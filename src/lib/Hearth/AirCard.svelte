<script lang="ts">
	import { states } from '$lib/Stores';
	import type { OverviewCard } from './config';
	import { sensorNumber } from './store';
	import Icon from './Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'air' }> } = $props();

	let pm25 = $derived(
		sensorNumber(card.pm25_entity ? $states?.[card.pm25_entity]?.state : undefined)
	);
	let humidity = $derived(
		sensorNumber(card.humidity_entity ? $states?.[card.humidity_entity]?.state : undefined)
	);

	// WHO-ish PM2.5 bands
	let quality = $derived(
		pm25 === null
			? { label: 'Unknown', dot: 'var(--h-text-5)', text: 'var(--h-text-4)' }
			: pm25 <= 12
				? { label: 'Good', dot: 'var(--h-good)', text: 'var(--h-good-text)' }
				: pm25 <= 35
					? { label: 'Moderate', dot: 'rgb(var(--h-accent-rgb))', text: 'var(--h-accent-dim-text)' }
					: { label: 'Poor', dot: 'rgb(var(--h-bad-rgb))', text: 'var(--h-bad-text)' }
	);
</script>

<div class="card">
	<div class="header">
		<div class="title">{card.title ?? 'Air'}</div>
		<div class="status">
			<span class="dot" style:background={quality.dot} style:color={quality.dot}></span>
			<span class="status-text" style:color={quality.text}>{quality.label}</span>
		</div>
	</div>
	<div class="row">
		<div class="stat">
			<div class="stat-label">Home PM2.5</div>
			<div class="stat-value">
				{pm25 === null ? '-' : Math.round(pm25)}<span class="stat-unit"> µg/m³</span>
			</div>
		</div>
		<div class="stat">
			<div class="stat-label">Humidity</div>
			<div class="stat-value">
				{humidity === null ? '-' : Math.round(humidity)}<span class="stat-unit"> %</span>
			</div>
		</div>
	</div>
	{#if card.filters.length}
		<div class="row filters">
			{#each card.filters as filter (filter.entity)}
				{@const life = sensorNumber($states?.[filter.entity]?.state)}
				<div class="filter">
					<Icon name="mode_fan" size={22} color="var(--h-cool-icon)" />
					<div>
						<div class="filter-name">{filter.label}</div>
						<div class="filter-state">{life === null ? '-' : `${Math.round(life)}%`}</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card {
		padding: 20px;
		border-radius: var(--h-radius-lg);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
	}

	.header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
	}

	.status {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		animation: breathe 2.8s ease-in-out infinite;
	}

	@keyframes breathe {
		0%,
		100% {
			box-shadow: 0 0 0 0 currentColor;
			opacity: 1;
		}
		50% {
			box-shadow: 0 0 7px 1px currentColor;
			opacity: 0.75;
		}
	}

	.status-text {
		font-size: 13px;
	}

	.row {
		display: flex;
		gap: 14px;
		margin-top: 16px;
	}

	.row.filters {
		margin-top: 12px;
	}

	.stat {
		flex: 1;
		padding: 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
	}

	.stat-label {
		font-size: 13px;
		color: var(--h-text-4);
	}

	.stat-value {
		font-size: 24px;
		font-weight: 600;
		color: var(--h-text-1);
		margin-top: 4px;
	}

	.stat-unit {
		font-size: 13px;
		color: var(--h-text-5);
		font-weight: 400;
	}

	.filter {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 12px 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
	}

	.filter-name {
		font-size: 14px;
		color: var(--h-text-3);
	}

	.filter-state {
		font-size: 13px;
		color: var(--h-text-5);
	}
</style>
