<script lang="ts">
	import { connection, states } from '$lib/Stores';
	import type { RailWidget } from './config';
	import { sensorNumber } from './store';
	import Icon from './Icon.svelte';

	let { widget }: { widget: Extract<RailWidget, { type: 'energy' }> } = $props();

	const BAR_COUNT = 8;
	const REFRESH_MS = 5 * 60 * 1000;

	// kWh per hour for today, oldest first; null until the first fetch lands
	let hours = $state<number[] | null>(null);

	$effect(() => {
		const conn = $connection;
		const entityId = widget.entity;
		hours = null;
		if (!conn || !entityId) return;

		let cancelled = false;

		async function fetchToday() {
			const now = new Date();
			const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			try {
				const result: any = await conn?.sendMessagePromise({
					type: 'recorder/statistics_during_period',
					start_time: start.toISOString(),
					end_time: new Date().toISOString(),
					statistic_ids: [entityId],
					period: 'hour'
				});
				if (cancelled) return;
				const rows: { change?: number; sum?: number }[] = result?.[entityId!] ?? [];
				// energy statistics carry per-period change; fall back to sum deltas
				let previousSum: number | undefined;
				hours = rows.map((row) => {
					let value = row.change;
					if (typeof value !== 'number' && typeof row.sum === 'number') {
						value = previousSum === undefined ? 0 : row.sum - previousSum;
					}
					if (typeof row.sum === 'number') previousSum = row.sum;
					return Math.max(0, value ?? 0);
				});
			} catch {
				// no recorder statistics for this id, card shows just the header
				if (!cancelled) hours = [];
			}
		}

		fetchToday();
		const timer = setInterval(fetchToday, REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	});

	let total = $derived(hours ? hours.reduce((sum, value) => sum + value, 0) : null);

	let pricePerKwh = $derived(
		widget.price_entity
			? sensorNumber($states?.[widget.price_entity]?.state)
			: typeof widget.price === 'number'
				? widget.price
				: null
	);

	let cost = $derived(
		total !== null && pricePerKwh !== null
			? `${(total * pricePerKwh).toFixed(2)}${widget.currency ? ` ${widget.currency}` : ''}`
			: null
	);

	// last BAR_COUNT hours ending at the current hour; height relative to the
	// day's peak hour, opacity ramping toward now, current hour solid
	let bars = $derived.by(() => {
		if (!hours || !hours.length) return [];
		const recent = hours.slice(-BAR_COUNT);
		const max = Math.max(...recent, 0.001);
		return recent.map((value, index) => ({
			height: Math.max(3, Math.round((value / max) * 24)),
			current: index === recent.length - 1,
			alpha: 0.25 + (index / Math.max(1, recent.length - 1)) * 0.3
		}));
	});
</script>

<div class="card">
	<div class="header">
		<Icon name="bolt" size={18} color="rgb(var(--h-accent-rgb))" fill />
		<span class="title">Energy</span>
		<span class="reading">
			{#if total !== null}
				<span class="value">{total.toFixed(1)} kWh</span>
				{#if cost}
					<span class="cost">· {cost}</span>
				{/if}
			{:else}
				<span class="cost">-</span>
			{/if}
		</span>
	</div>
	{#if bars.length}
		<div class="bars">
			{#each bars as bar, index (index)}
				<span
					class="bar"
					style:height="{bar.height}px"
					style:background={bar.current
						? 'rgb(var(--h-accent-rgb))'
						: `rgb(var(--h-accent-rgb) / ${bar.alpha})`}
				></span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card {
		padding: 12px 14px;
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
		margin-bottom: 8px;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.title {
		font-size: 13px;
		color: var(--h-text-3);
	}

	.reading {
		margin-left: auto;
		display: flex;
		align-items: baseline;
		gap: 5px;
	}

	.value {
		font-size: 14px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.cost {
		font-size: 12px;
		color: var(--h-text-5);
	}

	.bars {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 24px;
		margin-top: 10px;
	}

	.bar {
		flex: 1;
		border-radius: 3px;
	}
</style>
