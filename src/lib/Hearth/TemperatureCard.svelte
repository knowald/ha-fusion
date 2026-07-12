<script lang="ts">
	import { connection, states } from '$lib/Stores';
	import type { OverviewCard } from './config';
	import { sensorNumber } from './store';

	let { card }: { card: Extract<OverviewCard, { type: 'temperature' }> } = $props();

	let value = $derived(sensorNumber(card.entity ? $states?.[card.entity]?.state : undefined));
	let points = $state<string | null>(null);

	// last 24h of hourly means for the sparkline
	$effect(() => {
		const conn = $connection;
		const entityId = card.entity;
		points = null;
		if (!conn || !entityId) return;

		let cancelled = false;
		conn
			.sendMessagePromise({
				type: 'recorder/statistics_during_period',
				start_time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
				end_time: new Date().toISOString(),
				statistic_ids: [entityId],
				period: 'hour'
			})
			.then((result: any) => {
				if (cancelled) return;
				const values: number[] = (result?.[entityId] ?? [])
					.map((item: { mean?: number; state?: number }) => item.mean ?? item.state)
					.filter((entry: unknown): entry is number => typeof entry === 'number');
				if (values.length < 2) return;
				const min = Math.min(...values);
				const max = Math.max(...values);
				const span = max - min || 1;
				points = values
					.map((entry, index) => {
						const x = (index / (values.length - 1)) * 300;
						const y = 65 - ((entry - min) / span) * 57;
						return `${Math.round(x)},${Math.round(y)}`;
					})
					.join(' ');
			})
			.catch(() => {
				// no recorder data, sparkline stays hidden
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class="card">
	<div class="label">{card.label ?? ''}</div>
	<div class="reading">
		<span class="value">{value === null ? '-' : value.toFixed(1)}</span>
		<span class="unit">{card.unit ?? ''}</span>
	</div>
	{#if points}
		<svg viewBox="0 0 300 70" preserveAspectRatio="none">
			<polyline
				{points}
				fill="none"
				stroke="rgb(var(--h-accent-rgb))"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
		height: 100%;
	}

	.label {
		font-size: 14px;
		color: var(--h-text-4);
	}

	.reading {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.value {
		font-size: 46px;
		font-weight: 600;
		letter-spacing: -1.5px;
		color: var(--h-text-1);
	}

	.unit {
		font-size: 18px;
		color: var(--h-text-3);
	}

	svg {
		width: 100%;
		height: 60px;
		margin-top: auto;
	}
</style>
