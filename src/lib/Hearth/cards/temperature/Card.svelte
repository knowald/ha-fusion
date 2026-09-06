<script lang="ts">
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { connected } from '$lib/core/ha/connection';
	import { states } from '$lib/core/ha/entities';
	import type { OverviewCard } from '../../config';
	import { cachedData, fetchStatisticSeries, startDataRefresh } from '$lib/core/ha/history';
	import { airQualityVerdict } from '$lib/core/domains/sensor';
	import { controlOverrides } from '$lib/core/ha/commands';
	import { sensorNumber } from '$lib/core/ha/entities';
	import { setClimateTemperature } from '$lib/core/domains/climate';
	import Icon from '../../Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'temperature' }> } = $props();

	let value = $derived(sensorNumber(card.entity ? $states?.[card.entity]?.state : undefined));
	let verdict = $derived(
		airQualityVerdict(
			card.entity ? $states?.[card.entity]?.attributes?.device_class : undefined,
			value,
			card.verdict
		)
	);

	let climate = $derived(card.climate_entity ? $states?.[card.climate_entity] : undefined);
	// the pending override wins, so repeated +/- presses step from the value
	// just sent rather than resending the stale state
	let target = $derived(
		sensorNumber(
			String(
				$controlOverrides[`climate:${card.climate_entity}`] ??
					climate?.attributes?.temperature ??
					''
			)
		)
	);
	let targetStep = $derived(
		sensorNumber(String(climate?.attributes?.target_temp_step ?? '')) ?? 0.5
	);

	function nudgeTarget(direction: 1 | -1) {
		if (!card.climate_entity || target === null) return;
		setClimateTemperature(card.climate_entity, target + direction * targetStep);
	}

	let history = $state<number[] | null>(null);

	$effect(() => {
		void card.entity;
		history = null;
	});

	// last 24h of hourly means for the history chart
	$effect(() => {
		const entityId = card.entity;
		if (!$connected || !entityId) return;

		return startDataRefresh(
			() =>
				cachedData(`temperature-history:${entityId}`, () =>
					fetchStatisticSeries(
						entityId,
						new Date(Date.now() - 24 * 3600 * 1000),
						new Date(),
						'hour'
					)
				),
			(values) => (history = values)
		);
	});

	const CHART_WIDTH = 520;
	const CHART_HEIGHT = 90;
	const CHART_PAD = 8;

	let chart = $derived.by(() => {
		if (!history) return null;
		const values = history;
		const low = Math.min(...values);
		const high = Math.max(...values);
		// the target line must fit on the chart even when the room never reached it
		const min = target === null ? low : Math.min(low, target);
		const max = target === null ? high : Math.max(high, target);
		const span = max - min || 1;
		const y = (entry: number) =>
			CHART_PAD + (1 - (entry - min) / span) * (CHART_HEIGHT - 2 * CHART_PAD);
		const points = values.map((entry, index) => ({
			x: (index / (values.length - 1)) * CHART_WIDTH,
			y: y(entry)
		}));
		const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' L');
		return {
			low,
			high,
			linePath: `M${line}`,
			areaPath: `M${line} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`,
			end: points[points.length - 1],
			targetY: target === null ? null : y(target)
		};
	});

	function formatReading(reading: number) {
		return reading % 1 === 0 ? String(reading) : reading.toFixed(1);
	}

	// gradient ids are per-card: duplicated ids across cards would make every
	// area fill resolve against whichever card rendered first
	let gradientId = $derived(`temp-gradient-${card.id}`);
</script>

<div class="card" style:height={card.height ? `${card.height}px` : undefined}>
	<div class="top">
		<div>
			<div class="label">{card.label ?? ''}</div>
			<div class="reading">
				<span class="value">{value === null ? '-' : value.toFixed(1)}</span>
				<span class="unit">{card.unit ?? ''}</span>
			</div>
		</div>
		{#if climate && target !== null}
			<div class="thermostat">
				<div class="target-label">{$lang('hearth_target')}</div>
				<div class="target-value">{target.toFixed(1)}°</div>
				<div class="target-buttons">
					<button
						type="button"
						aria-label={$lang('hearth_lower_target')}
						onclick={() => nudgeTarget(-1)}
					>
						<Icon name="remove" size={ICON.control} color="var(--h-text-3)" />
					</button>
					<button
						type="button"
						aria-label={$lang('hearth_raise_target')}
						onclick={() => nudgeTarget(1)}
					>
						<Icon name="add" size={ICON.control} color="var(--h-text-3)" />
					</button>
				</div>
			</div>
		{:else if verdict}
			<div class="verdict" data-tone={verdict.tone}>{verdict.label}</div>
		{/if}
	</div>
	{#if chart}
		<div class="chart">
			<svg viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}" preserveAspectRatio="none">
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="var(--h-accent-dim-text)" stop-opacity="0.25" />
						<stop offset="1" stop-color="var(--h-accent-dim-text)" stop-opacity="0" />
					</linearGradient>
				</defs>
				{#if chart.targetY !== null}
					<line
						x1="0"
						y1={chart.targetY}
						x2={CHART_WIDTH}
						y2={chart.targetY}
						stroke="rgb(var(--h-accent-rgb))"
						stroke-opacity="0.28"
						stroke-width="1"
						stroke-dasharray="4 5"
					/>
				{/if}
				<path d={chart.areaPath} fill="url(#{gradientId})" />
				<path
					d={chart.linePath}
					fill="none"
					stroke="var(--h-accent-dim-text)"
					stroke-width="2"
					stroke-linejoin="round"
				/>
				<circle cx={chart.end.x} cy={chart.end.y} r="4" fill="rgb(var(--h-accent-rgb))" />
			</svg>
			{#if chart.targetY !== null && target !== null}
				<div class="target-line-label" style:top="{(chart.targetY / CHART_HEIGHT) * 100}%">
					{$lang('hearth_target')}
					{target.toFixed(1)}
				</div>
			{/if}
		</div>
		<div class="chart-footer">
			<span>24 H</span>
			<span
				>{$lang('hearth_low')}
				{formatReading(chart.low)} · {$lang('hearth_high')}
				{formatReading(chart.high)}</span
			>
		</div>
	{/if}
</div>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 18px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		height: 100%;
		/* a squeezed card must clip its chart, never paint over the next card */
		overflow: hidden;
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.label {
		font-size: var(--h-type-body);
		color: var(--h-text-4);
	}

	.reading {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}

	.value {
		font-size: var(--h-type-hero);
		font-weight: 600;
		letter-spacing: -1.5px;
		color: var(--h-text-1);
	}

	.unit {
		font-size: var(--h-type-subtitle);
		color: var(--h-text-3);
	}

	.thermostat {
		text-align: right;
	}

	.target-label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1.6px;
		color: var(--h-text-6);
	}

	.target-value {
		font-size: var(--h-type-headline);
		font-weight: 600;
		color: var(--h-accent-icon);
		margin-top: 6px;
	}

	.target-buttons {
		display: flex;
		gap: 6px;
		margin-top: 10px;
		justify-content: flex-end;
	}

	.target-buttons button {
		width: 34px;
		height: 34px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.09 * var(--h-line-scale)));
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		font: inherit;
	}

	.verdict {
		padding: 8px 14px;
		border-radius: var(--h-radius-pill);
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 1.2px;
	}

	.verdict[data-tone='good'] {
		background: color-mix(in srgb, var(--h-good) 13%, transparent);
		border: 1px solid color-mix(in srgb, var(--h-good) 26%, transparent);
		color: var(--h-good-text);
	}

	.verdict[data-tone='fair'] {
		background: rgb(var(--h-accent-rgb) / calc(0.13 * var(--h-accent-scale)));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.26 * var(--h-accent-scale)));
		color: var(--h-accent-dim-text);
	}

	.verdict[data-tone='poor'] {
		background: rgb(var(--h-bad-rgb) / 0.13);
		border: 1px solid rgb(var(--h-bad-rgb) / 0.26);
		color: var(--h-bad-text);
	}

	.chart {
		position: relative;
		margin-top: auto;
	}

	svg {
		width: 100%;
		height: 86px;
		display: block;
	}

	.target-line-label {
		position: absolute;
		left: 0;
		margin-top: 4px;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1px;
		color: var(--h-label);
		pointer-events: none;
	}

	.chart-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--h-font-mono);
		font-size: var(--h-type-caption);
		letter-spacing: 1.4px;
		color: var(--h-text-6);
	}
</style>
