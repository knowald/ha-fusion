<script lang="ts">
	import { onMount } from 'svelte';

	let { city }: { city?: string } = $props();

	let now = $state(new Date());

	onMount(() => {
		const timer = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(timer);
	});

	let time = $derived(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
	let date = $derived(
		now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
	);
	let greeting = $derived(
		now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
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
