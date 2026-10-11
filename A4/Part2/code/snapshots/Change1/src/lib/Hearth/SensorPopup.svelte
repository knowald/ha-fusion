<script lang="ts">
	import { connected, connection, states } from '$lib/Stores';
	import { cachedData, startDataRefresh } from './refresh';
	import { sensorNumber } from './store';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let value = $derived(sensorNumber(stateObj?.state));
	let unit = $derived(stateObj?.attributes?.unit_of_measurement ?? '');

	let history = $state<number[] | null>(null);

	$effect(() => {
		void entity;
		history = null;
	});

	// same 24h hourly means the temperature card charts, shared through the
	// recorder cache so opening the popup after the card costs nothing
	$effect(() => {
		const conn = $connection;
		if (!$connected || !conn) return;

		return startDataRefresh(
			() =>
				cachedData(`temperature-history:${entity}`, async () => {
					const result: any = await conn.sendMessagePromise({
						type: 'recorder/statistics_during_period',
						start_time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
						end_time: new Date().toISOString(),
						statistic_ids: [entity],
						period: 'hour'
					});
					const values: number[] = (result?.[entity] ?? [])
						.map((item: { mean?: number; state?: number }) => item.mean ?? item.state)
						.filter((entry: unknown): entry is number => typeof entry === 'number');
					return values.length < 2 ? null : values;
				}),
			(values) => (history = values)
		);
	});

	const CHART_WIDTH = 520;
	const CHART_HEIGHT = 110;
	const CHART_PAD = 10;

	let chart = $derived.by(() => {
		if (!history) return null;
		const values = history;
		const low = Math.min(...values);
		const high = Math.max(...values);
		const span = high - low || 1;
		const points = values.map((entry, index) => ({
			x: (index / (values.length - 1)) * CHART_WIDTH,
			y: CHART_PAD + (1 - (entry - low) / span) * (CHART_HEIGHT - 2 * CHART_PAD)
		}));
		const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' L');
		return {
			low,
			high,
			linePath: `M${line}`,
			areaPath: `M${line} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`,
			end: points[points.length - 1]
		};
	});

	function formatReading(reading: number) {
		return reading % 1 === 0 ? String(reading) : reading.toFixed(1);
	}
</script>

<div class="reading">
	<span class="value">{value === null ? '-' : formatReading(value)}</span>
	<span class="unit">{unit}</span>
</div>

{#if chart}
	<svg viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}" preserveAspectRatio="none">
		<defs>
			<linearGradient id="sensor-popup-gradient" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="var(--h-accent-dim-text)" stop-opacity="0.25" />
				<stop offset="1" stop-color="var(--h-accent-dim-text)" stop-opacity="0" />
			</linearGradient>
		</defs>
		<path d={chart.areaPath} fill="url(#sensor-popup-gradient)" />
		<path
			d={chart.linePath}
			fill="none"
			stroke="var(--h-accent-dim-text)"
			stroke-width="2"
			stroke-linejoin="round"
		/>
		<circle cx={chart.end.x} cy={chart.end.y} r="4" fill="rgb(var(--h-accent-rgb))" />
	</svg>
	<div class="chart-footer">
		<span>24 H</span>
		<span>LOW {formatReading(chart.low)} · HIGH {formatReading(chart.high)}</span>
	</div>
{:else}
	<div class="no-history">No recorded history for the last 24 hours</div>
{/if}

<style>
	.reading {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-top: 22px;
	}

	.value {
		font-size: 44px;
		font-weight: 600;
		letter-spacing: -1.5px;
		color: var(--h-text-1);
	}

	.unit {
		font-size: 17px;
		color: var(--h-text-3);
	}

	svg {
		width: 100%;
		height: 104px;
		display: block;
		margin-top: 14px;
	}

	.chart-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 8px;
		font-family: var(--h-font-mono);
		font-size: 10px;
		letter-spacing: 1.4px;
		color: var(--h-text-6);
	}

	.no-history {
		margin-top: 18px;
		padding: 18px;
		border-radius: var(--h-radius-sm);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 13px;
		text-align: center;
	}
</style>
