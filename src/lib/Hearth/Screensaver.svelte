<script lang="ts">
	import { fade } from 'svelte/transition';

	let { minutes = 10 }: { minutes?: number } = $props();

	let active = $state(false);
	let now = $state(new Date());
	let overlay: HTMLElement | undefined = $state();

	let lastActivity = Date.now();

	// pointermove fires continuously, so cap timestamp writes to one per second
	function recordActivity() {
		const stamp = Date.now();
		if (stamp - lastActivity < 1000) return;
		lastActivity = stamp;
	}

	function dismiss(event: Event) {
		// swallow so the wake tap/keypress never reaches the dashboard
		event.preventDefault();
		event.stopPropagation();
		lastActivity = Date.now();
		active = false;
	}

	$effect(() => {
		const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart'] as const;
		for (const name of events) window.addEventListener(name, recordActivity, { passive: true });
		const idleTimer = setInterval(() => {
			if (!active && Date.now() - lastActivity >= minutes * 60_000) active = true;
		}, 1000);
		return () => {
			for (const name of events) window.removeEventListener(name, recordActivity);
			clearInterval(idleTimer);
		};
	});

	$effect(() => {
		if (!active) return;
		now = new Date();
		// focus so keydown targets the overlay instead of the dashboard
		overlay?.focus();
		const clockTimer = setInterval(() => (now = new Date()), 30_000);
		return () => clearInterval(clockTimer);
	});

	let time = $derived(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
	let date = $derived(
		now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
	);
</script>

{#if active}
	<div
		class="screensaver"
		bind:this={overlay}
		tabindex="-1"
		transition:fade={{ duration: 400 }}
		onpointerdown={dismiss}
		onkeydown={dismiss}
	>
		<div class="clock">{time}</div>
		<div class="date">{date}</div>
	</div>
{/if}

<style>
	.screensaver {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--h-bg-1);
		font-family: var(--h-font-ui);
		outline: none;
		cursor: default;
	}

	.clock {
		font-size: clamp(80px, 14vw, 160px);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -4px;
		color: var(--h-text-6);
	}

	.date {
		font-size: 20px;
		margin-top: 18px;
		letter-spacing: 0.2px;
		color: var(--h-text-6);
	}
</style>
