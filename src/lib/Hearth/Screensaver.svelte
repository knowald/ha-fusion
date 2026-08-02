<script lang="ts">
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { lang, motion, selectedLanguage } from '$lib/Stores';

	let { minutes = 10 }: { minutes?: number } = $props();

	let active = $state(false);
	let now = $state(new Date());
	let overlay: HTMLElement | undefined = $state();

	let lastActivity = Date.now();
	let idleTimer: ReturnType<typeof setTimeout>;

	function scheduleIdle() {
		clearTimeout(idleTimer);
		if (active) return;
		const remaining = Math.max(0, minutes * 60_000 - (Date.now() - lastActivity));
		idleTimer = setTimeout(() => (active = true), remaining);
	}

	// pointermove fires continuously, so cap timestamp writes to one per second
	function recordActivity() {
		const stamp = Date.now();
		if (stamp - lastActivity < 1000) return;
		lastActivity = stamp;
		scheduleIdle();
	}

	function dismiss(event: Event) {
		// swallow so the wake tap/keypress never reaches the dashboard
		event.preventDefault();
		event.stopPropagation();
		lastActivity = Date.now();
		active = false;
		scheduleIdle();
	}

	$effect(() => {
		const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart'] as const;
		for (const name of events) window.addEventListener(name, recordActivity, { passive: true });
		scheduleIdle();
		return () => {
			for (const name of events) window.removeEventListener(name, recordActivity);
			clearTimeout(idleTimer);
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

	let time = $derived(
		now.toLocaleTimeString($selectedLanguage, { hour: '2-digit', minute: '2-digit' })
	);
	let date = $derived(
		now.toLocaleDateString($selectedLanguage, { weekday: 'long', month: 'long', day: 'numeric' })
	);
</script>

{#if active}
	<div
		class="screensaver"
		bind:this={overlay}
		tabindex="-1"
		role="button"
		aria-label={$lang('hearth_dismiss_screensaver')}
		in:fade={{ duration: $motion ? 1200 : 0, easing: cubicOut }}
		out:fade={{ duration: $motion ? 150 : 0 }}
		onpointerdown={dismiss}
		onkeydown={dismiss}
	>
		<div class="screensaver-content">
			<div class="clock">{time}</div>
			<div class="date">{date}</div>
		</div>
	</div>
{/if}

<style>
	.screensaver {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		background: #030201;
		font-family: var(--h-font-ui);
		outline: none;
		cursor: default;
	}

	.screensaver-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: screensaver-drift 90s ease-in-out infinite alternate;
	}

	.clock {
		font-size: clamp(80px, 14vw, 160px);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -4px;
		color: rgb(var(--h-line-rgb) / 0.32);
	}

	.date {
		font-size: 20px;
		margin-top: 18px;
		letter-spacing: 0.2px;
		color: rgb(var(--h-line-rgb) / 0.24);
	}

	@keyframes screensaver-drift {
		0% {
			transform: translate(-7vw, -5vh);
		}
		33% {
			transform: translate(6vw, -2vh);
		}
		66% {
			transform: translate(-3vw, 6vh);
		}
		100% {
			transform: translate(7vw, 4vh);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.screensaver-content {
			animation: none;
		}
	}
</style>
