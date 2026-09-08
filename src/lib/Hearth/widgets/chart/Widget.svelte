<script lang="ts">
	import EmptyState from '../../EmptyState.svelte';
	import { lang } from '$lib/core/i18n';
	import { connected } from '$lib/core/ha/connection';
	import { states, sensorNumber, entityActive } from '$lib/core/ha/entities';
	import {
		cachedData,
		fetchStateHistory,
		fetchStatisticSeries,
		startDataRefresh
	} from '$lib/core/ha/history';
	import type { ChartWidget } from './descriptor';
	import { applyMath, PERIOD_MS } from './math';

	let { widget }: { widget: ChartWidget } = $props();

	let entity = $derived(widget.entity ?? '');
	let stateObj = $derived($states?.[entity]);
	let style = $derived(widget.style ?? 'line');
	let period = $derived(widget.period ?? 'day');
	let label = $derived(widget.name || stateObj?.attributes?.friendly_name || entity);
	let unit = $derived(stateObj?.attributes?.unit_of_measurement ?? '');
	let raw = $derived(sensorNumber(stateObj?.state));
	let value = $derived(raw === null ? null : applyMath(raw, widget.math));
	let percent = $derived(value === null ? 0 : Math.max(0, Math.min(100, value)));
	let stroke = $derived(widget.stroke ?? (style === 'radial' ? 9 : 2));

	/* line: hourly means (or daily for long periods) from the recorder */
	let points = $state<number[] | null>(null);
	$effect(() => {
		if (style !== 'line' || !entity || !$connected) return;
		const span = PERIOD_MS[period];
		const bucket = period === 'hour' ? '5minute' : period === 'day' ? 'hour' : 'day';
		return startDataRefresh(
			() =>
				cachedData(`chart:${entity}:${period}`, async () => {
					const values = await fetchStatisticSeries(
						entity,
						new Date(Date.now() - span),
						new Date(),
						bucket
					);
					return values?.map((entry) => applyMath(entry, widget.math)) ?? null;
				}),
			(values) => (points = values)
		);
	});

	const WIDTH = 300;
	const HEIGHT = 60;
	let line = $derived.by(() => {
		const values = points;
		if (!values) return null;
		const low = Math.min(...values);
		const high = Math.max(...values);
		const span = high - low || 1;
		const coords = values.map((entry, index) => [
			(index / (values.length - 1)) * WIDTH,
			4 + (1 - (entry - low) / span) * (HEIGHT - 8)
		]);
		const path = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
		return { path: `M${path}`, area: `M${path} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z` };
	});

	/* history: state segments over the period */
	interface Segment {
		state: string;
		fraction: number;
		active: boolean;
	}
	let segments = $state<Segment[] | null>(null);
	$effect(() => {
		if (style !== 'history' || !entity || !$connected) return;
		const span = PERIOD_MS[period];
		return startDataRefresh(
			() =>
				cachedData(`history:${entity}:${period}`, async () => {
					const start = Date.now() - span;
					const changes =
						(await fetchStateHistory([entity], new Date(start), new Date()))[entity] ?? [];
					if (!changes.length) return [] as Segment[];
					return changes.map((change, index) => {
						const from = Math.max(start, change.lu * 1000);
						const to = index + 1 < changes.length ? changes[index + 1].lu * 1000 : Date.now();
						return {
							state: change.s,
							fraction: Math.max(0, to - from) / span,
							active: entityActive(entity, { ...stateObj, state: change.s } as any)
						};
					});
				}),
			(next) => (segments = next)
		);
	});

	const RADIUS = 26;
	let circumference = 2 * Math.PI * RADIUS;
</script>

<div class="chart" class:radial={style === 'radial'}>
	<div class="head">
		<span class="name">{label}</span>
		{#if style !== 'radial'}
			<span class="reading">{value === null ? '-' : Math.round(value * 10) / 10}{unit}</span>
		{/if}
	</div>
	{#if style === 'line'}
		{#if line}
			<svg viewBox="0 0 {WIDTH} {HEIGHT}" preserveAspectRatio="none">
				<path d={line.area} fill="rgb(var(--h-accent-rgb) / 0.15)" />
				<path d={line.path} fill="none" stroke="var(--h-accent-dim-text)" stroke-width={stroke} />
			</svg>
		{:else}
			<EmptyState inline text={$lang('hearth_no_recorded_history_for_the_last')} />
		{/if}
	{:else if style === 'history'}
		<div class="timeline" title={stateObj?.state}>
			{#each segments ?? [] as segment, index (index)}
				<div
					class="segment"
					class:active={segment.active}
					style:flex={segment.fraction}
					title={segment.state}
				></div>
			{/each}
		</div>
		<div class="period">{$lang(`hearth_last_${period}`)}</div>
	{:else if style === 'bar'}
		<div class="bar"><div class="bar-fill" style:width="{percent}%"></div></div>
	{:else}
		<div class="radial-wrap">
			<svg viewBox="0 0 64 64">
				<circle
					cx="32"
					cy="32"
					r={RADIUS}
					fill="none"
					stroke="rgb(var(--h-line-rgb) / 0.15)"
					stroke-width={stroke}
				/>
				<circle
					cx="32"
					cy="32"
					r={RADIUS}
					fill="none"
					stroke="rgb(var(--h-accent-rgb))"
					stroke-width={stroke}
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={circumference * (1 - percent / 100)}
					transform="rotate(-90 32 32)"
				/>
			</svg>
			<span class="reading">{value === null ? '-' : Math.round(value)}{unit || '%'}</span>
		</div>
	{/if}
</div>

<style>
	.chart {
		padding: 10px 0;
	}

	.head {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-size: var(--h-type-secondary);
		color: var(--h-text-4);
	}

	.reading {
		color: var(--h-text-1);
		font-variant-numeric: tabular-nums;
	}

	svg {
		display: block;
		width: 100%;
		height: 56px;
		margin-top: 8px;
	}

	.period {
		margin-top: 8px;
		font-size: var(--h-type-label);
		color: var(--h-text-6);
	}

	.timeline {
		display: flex;
		height: 10px;
		margin-top: 10px;
		border-radius: var(--h-radius-hair);
		overflow: hidden;
		background: rgb(var(--h-line-rgb) / 0.12);
	}

	.segment {
		background: rgb(var(--h-line-rgb) / 0.2);
	}

	.segment.active {
		background: rgb(var(--h-accent-rgb));
	}

	.bar {
		height: 8px;
		margin-top: 10px;
		border-radius: var(--h-radius-hair);
		background: rgb(var(--h-line-rgb) / 0.12);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: rgb(var(--h-accent-rgb));
		transition: width var(--h-motion-slow) ease;
	}

	.radial-wrap {
		position: relative;
		width: 64px;
		margin: 6px auto 0;
	}

	.radial-wrap svg {
		height: 64px;
		margin: 0;
	}

	.radial-wrap .reading {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: var(--h-type-secondary);
	}
</style>
