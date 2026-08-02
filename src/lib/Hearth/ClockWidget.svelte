<script lang="ts">
	import { onMount } from 'svelte';
	import { lang, selectedLanguage } from '$lib/Stores';
	import { clockTimeOptions, hourInTimeZone, validTimeZone, type ClockHourFormat } from './clock';

	let {
		timezone,
		hour_format = 'auto',
		show_seconds = false
	}: { timezone?: string; hour_format?: ClockHourFormat; show_seconds?: boolean } = $props();

	let now = $state(new Date());

	onMount(() => {
		const timer = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(timer);
	});

	let activeTimezone = $derived(validTimeZone(timezone));
	let time = $derived(
		now.toLocaleTimeString(
			$selectedLanguage,
			clockTimeOptions(activeTimezone, hour_format, show_seconds)
		)
	);
	let date = $derived(
		now.toLocaleDateString($selectedLanguage, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			...(activeTimezone ? { timeZone: activeTimezone } : {})
		})
	);
	let hour = $derived(hourInTimeZone(now, $selectedLanguage, activeTimezone));
	let greeting = $derived(
		$lang(
			hour < 12
				? 'hearth_good_morning'
				: hour < 18
					? 'hearth_good_afternoon'
					: 'hearth_good_evening'
		)
	);
</script>

<div>
	<div class="clock">{time}</div>
	<div class="date">{date}</div>
	<div class="greeting">{greeting}</div>
</div>

<style>
	.clock {
		font-size: 80px;
		font-weight: 600;
		line-height: 0.9;
		letter-spacing: -3px;
		color: var(--h-text-1);
	}

	.date {
		font-size: 15px;
		color: var(--h-text-4);
		margin-top: 10px;
		letter-spacing: 0.2px;
	}

	.greeting {
		font-size: 14px;
		color: var(--h-text-5);
		margin-top: 2px;
	}
</style>
