<script lang="ts">
	import { onMount } from 'svelte';
	import { lang, selectedLanguage } from '$lib/Stores';

	let { city }: { city?: string } = $props();

	let now = $state(new Date());

	onMount(() => {
		const timer = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(timer);
	});

	let time = $derived(
		now.toLocaleTimeString($selectedLanguage, { hour: '2-digit', minute: '2-digit' })
	);
	let date = $derived(
		now.toLocaleDateString($selectedLanguage, { weekday: 'long', month: 'long', day: 'numeric' })
	);
	let greeting = $derived(
		$lang(
			now.getHours() < 12
				? 'hearth_good_morning'
				: now.getHours() < 18
					? 'hearth_good_afternoon'
					: 'hearth_good_evening'
		)
	);
</script>

<div>
	<div class="clock">{time}</div>
	<div class="date">{date}</div>
	<div class="greeting">{greeting}{city ? `, ${city}` : ''}</div>
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
