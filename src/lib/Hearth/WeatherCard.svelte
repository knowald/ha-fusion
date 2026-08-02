<script lang="ts">
	import { connection, states } from '$lib/Stores';
	import Icon from './Icon.svelte';

	let { entity: weatherEntity }: { entity?: string } = $props();

	const conditionIcons: Record<string, string> = {
		'clear-night': 'clear_night',
		cloudy: 'cloud',
		fog: 'foggy',
		hail: 'weather_hail',
		lightning: 'thunderstorm',
		'lightning-rainy': 'thunderstorm',
		partlycloudy: 'partly_cloudy_day',
		pouring: 'rainy',
		rainy: 'rainy',
		snowy: 'weather_snowy',
		'snowy-rainy': 'weather_mix',
		sunny: 'clear_day',
		windy: 'air',
		'windy-variant': 'air',
		exceptional: 'warning'
	};

	const conditionLabels: Record<string, string> = {
		'clear-night': 'Clear night',
		cloudy: 'Cloudy',
		fog: 'Fog',
		hail: 'Hail',
		lightning: 'Lightning',
		'lightning-rainy': 'Thunderstorm',
		partlycloudy: 'Partly cloudy',
		pouring: 'Pouring',
		rainy: 'Rainy',
		snowy: 'Snowy',
		'snowy-rainy': 'Sleet',
		sunny: 'Sunny',
		windy: 'Windy',
		'windy-variant': 'Windy',
		exceptional: 'Exceptional'
	};

	interface ForecastDay {
		day: string;
		temp: string;
	}

	let entity = $derived(weatherEntity ? $states?.[weatherEntity] : undefined);
	let condition = $derived(entity?.state ?? '');
	let temperature = $derived(entity?.attributes?.temperature);
	let apparent = $derived(entity?.attributes?.apparent_temperature);
	let sub = $derived(
		(conditionLabels[condition] ?? '') +
			(typeof apparent === 'number' ? ` · feels ${Math.round(apparent)}°` : '')
	);

	let forecast = $state<ForecastDay[]>([]);

	$effect(() => {
		const conn = $connection;
		const entityId = weatherEntity;
		forecast = [];
		if (!conn || !entityId) return;

		let cancelled = false;
		let unsubscribe: (() => Promise<void>) | undefined;
		conn
			.subscribeMessage(
				(message: { forecast?: { datetime: string; temperature: number }[] }) => {
					forecast = (message?.forecast ?? []).slice(1, 4).map((day) => ({
						day: new Date(day.datetime)
							.toLocaleDateString('en-US', { weekday: 'short' })
							.toUpperCase(),
						temp: `${Math.round(day.temperature)}°`
					}));
				},
				{
					type: 'weather/subscribe_forecast',
					entity_id: entityId,
					forecast_type: 'daily'
				}
			)
			.then((unsub) => {
				if (cancelled) unsub();
				else unsubscribe = unsub;
			})
			.catch(() => {
				// forecast unsupported, columns stay hidden
			});

		return () => {
			cancelled = true;
			unsubscribe?.();
		};
	});
</script>

<div class="card">
	<Icon
		name={conditionIcons[condition] ?? 'clear_day'}
		size={38}
		color="rgb(var(--h-accent-rgb))"
		fill
	/>
	<div>
		<div class="temp">{typeof temperature === 'number' ? Math.round(temperature) : '-'}°</div>
		<div class="sub">{sub}</div>
	</div>
	<div class="forecast">
		{#each forecast as day (day.day)}
			<div>
				<div class="day">{day.day}</div>
				<div class="value">{day.temp}</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 26px;
		padding: 16px 18px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.temp {
		font-size: 26px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.sub {
		font-size: 13px;
		color: var(--h-text-4);
	}

	.forecast {
		margin-left: auto;
		display: flex;
		gap: 14px;
		text-align: center;
	}

	.day {
		font-size: 11px;
		color: var(--h-text-5);
	}

	.value {
		font-size: 13px;
		color: var(--h-text-3);
		margin-top: 3px;
	}
</style>
