<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { timer } from '$lib/core/app/clock';
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';
	import { hearthEditMode } from '../../store';
	import Icon from '../../Icon.svelte';
	import type { TimerWidget } from './descriptor';

	let { widget }: { widget: TimerWidget } = $props();

	let entity = $derived(widget.entity ?? '');
	let stateObj = $derived($states?.[entity]);
	let timerState = $derived(stateObj?.state);
	let label = $derived(widget.name || stateObj?.attributes?.friendly_name || entity);

	function format(totalSeconds: number) {
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		return h
			? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
			: `${m}:${String(s).padStart(2, '0')}`;
	}

	// finishes_at is authoritative while running; paused timers report remaining
	let display = $derived.by(() => {
		if (timerState === 'active' && stateObj?.attributes?.finishes_at) {
			const ms = Date.parse(stateObj.attributes.finishes_at) - $timer.getTime();
			return format(Math.max(0, Math.round(ms / 1000)));
		}
		const remaining: string | undefined =
			stateObj?.attributes?.remaining ?? stateObj?.attributes?.duration;
		if (!remaining) return '0:00';
		const parts = remaining.split(':').map(Number);
		while (parts.length < 3) parts.unshift(0);
		return format(parts[0] * 3600 + parts[1] * 60 + Math.floor(parts[2]));
	});

	function primary() {
		if ($hearthEditMode || !entity) return;
		callEntityService('timer', timerState === 'active' ? 'pause' : 'start', entity);
	}
</script>

<div class="timer" class:running={timerState === 'active'}>
	<button
		type="button"
		class="primary"
		aria-label={timerState === 'active' ? $lang('hearth_pause') : $lang('hearth_start')}
		onclick={primary}
	>
		<Icon name={timerState === 'active' ? 'pause' : 'play_arrow'} size={20} fill />
	</button>
	<div class="text">
		<div class="name">{label}</div>
		<div class="count">{display}</div>
	</div>
	{#if timerState !== 'idle'}
		<button
			type="button"
			class="cancel"
			aria-label={$lang('hearth_cancel')}
			onclick={() => callEntityService('timer', 'cancel', entity)}
		>
			<Icon name="close" size={18} />
		</button>
	{/if}
</div>

<style>
	.timer {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 0;
	}

	.primary,
	.cancel {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 50%;
		background: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
		color: var(--h-text-2);
		cursor: pointer;
	}

	.running .primary {
		background: rgb(var(--h-accent-rgb));
		color: var(--h-on-accent);
	}

	.text {
		flex: 1;
		min-width: 0;
	}

	.name {
		font-size: 13px;
		color: var(--h-text-4);
	}

	.count {
		font-size: 20px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--h-text-1);
	}
</style>
