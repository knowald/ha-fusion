<script lang="ts">
	import { browser } from '$app/environment';
	import { states } from '$lib/Stores';
	import { capitalize, type RailWidget } from './config';
	import { hearthEditMode, sensorNumber } from './store';
	import Icon from './Icon.svelte';

	let { widget }: { widget: Extract<RailWidget, { type: 'progress' }> } = $props();

	// states that read as "nothing running" when no active_states list is set
	const IDLE_STATES = ['idle', 'off', 'unavailable', 'unknown', 'standby', 'none', 'docked'];
	const DEFAULT_COMPLETED_STATES = ['complete', 'completed', 'finished', 'done'];

	let statusEntity = $derived(widget.status_entity ? $states?.[widget.status_entity] : undefined);
	let status = $derived(statusEntity?.state);
	let normalizedStatus = $derived(status?.toLowerCase());
	let completed = $derived(
		normalizedStatus !== undefined &&
			(widget.completed_states?.length
				? widget.completed_states.some((state) => state.toLowerCase() === normalizedStatus)
				: DEFAULT_COMPLETED_STATES.includes(normalizedStatus))
	);

	let active = $derived(
		status !== undefined &&
			!completed &&
			(widget.active_states?.length
				? widget.active_states.includes(status)
				: !IDLE_STATES.includes(normalizedStatus ?? ''))
	);

	let progress = $derived.by(() => {
		const value = widget.progress_entity
			? sensorNumber($states?.[widget.progress_entity]?.state)
			: null;
		return value === null ? null : Math.max(0, Math.min(100, value));
	});

	// re-evaluated every 30s so timestamp countdowns tick without state changes
	let now = $state(Date.now());
	let fallbackCompletedAt = $state<number | null>(null);
	let dismissedCompletion = $state<string | null>(null);
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});
	$effect(() => {
		if (completed) {
			if (fallbackCompletedAt === null) fallbackCompletedAt = Date.now();
		} else {
			fallbackCompletedAt = null;
			dismissedCompletion = null;
		}
	});

	// A completion is one occurrence, not just one status value. Home Assistant
	// changes last_changed when the entity leaves and later re-enters a completed
	// state, so a newly completed activity is not hidden by an older dismissal.
	let completionId = $derived(
		completed && normalizedStatus && statusEntity?.last_changed
			? `${normalizedStatus}:${statusEntity.last_changed}`
			: null
	);
	let dismissalStorageKey = $derived(`hearth:dismissed-progress:${widget.id}`);
	$effect(() => {
		if (!browser || !completionId) return;
		try {
			dismissedCompletion = localStorage.getItem(dismissalStorageKey);
		} catch {
			// Storage may be unavailable in privacy-restricted browser contexts.
			dismissedCompletion = null;
		}
	});

	let completedAt = $derived.by(() => {
		const changedAt = statusEntity?.last_changed
			? Date.parse(statusEntity.last_changed)
			: Number.NaN;
		return Number.isNaN(changedAt) ? fallbackCompletedAt : changedAt;
	});
	let dismissed = $derived(completionId !== null && dismissedCompletion === completionId);

	function dismissCompletion() {
		if (!completionId) return;
		dismissedCompletion = completionId;
		if (!browser) return;
		try {
			localStorage.setItem(dismissalStorageKey, completionId);
		} catch {
			// The in-memory dismissal still works for this page session.
		}
	}

	let completionDelay = $derived(widget.completion_delay_minutes ?? 15);
	let completionVisible = $derived(
		completed &&
			!dismissed &&
			completionDelay !== 0 &&
			(completionDelay < 0 || completedAt === null || now - completedAt < completionDelay * 60_000)
	);

	let progressLabel = $derived(
		progress !== null && widget.unit ? `${Math.round(progress)}${widget.unit}` : null
	);

	// the remaining entity may hold plain minutes or a finish timestamp
	let remaining = $derived.by(() => {
		const raw = widget.remaining_entity ? $states?.[widget.remaining_entity]?.state : undefined;
		if (raw === undefined || raw === 'unavailable' || raw === 'unknown') return null;
		const minutes = sensorNumber(raw);
		if (minutes !== null) return `${Math.max(0, Math.round(minutes))} min`;
		const finish = Date.parse(raw);
		if (Number.isNaN(finish)) return null;
		return `${Math.max(0, Math.ceil((finish - now) / 60_000))} min`;
	});
</script>

{#if active || completionVisible || $hearthEditMode}
	<svelte:element
		this={completed && !$hearthEditMode ? 'button' : 'div'}
		class="row"
		class:inactive={!active && !completed}
		class:completed
		type={completed && !$hearthEditMode ? 'button' : undefined}
		title={completed && !$hearthEditMode ? 'Tap to dismiss' : undefined}
		onclick={completed && !$hearthEditMode ? dismissCompletion : undefined}
	>
		<Icon name={widget.icon || 'autorenew'} size={20} color="var(--h-cool-icon)" />
		<div class="body">
			<div class="text">
				{widget.name || 'Activity'}{status !== undefined ? ` · ${capitalize(status)}` : ''}
			</div>
			{#if progress !== null}
				<div class="track">
					<div class="fill" style:width="{progress}%"></div>
				</div>
			{/if}
		</div>
		{#if progressLabel !== null || remaining !== null}
			<span class="remaining">{[progressLabel, remaining].filter(Boolean).join(' · ')}</span>
		{/if}
		{#if completed && !$hearthEditMode}
			<span class="dismiss" aria-hidden="true">×</span>
		{/if}
	</svelte:element>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
		margin-bottom: 8px;
		width: 100%;
		font: inherit;
		text-align: left;
		color: inherit;
	}

	button.row {
		cursor: pointer;
	}

	button.row:hover {
		background: rgb(var(--h-surface-rgb) / 0.075);
	}

	.row.inactive {
		opacity: 0.45;
	}

	.body {
		flex: 1;
		min-width: 0;
	}

	.text {
		font-size: 13px;
		font-weight: 500;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track {
		height: 3px;
		border-radius: 2px;
		background: rgb(var(--h-surface-rgb) / 0.12);
		margin-top: 6px;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 2px;
		background: var(--h-cool-icon);
	}

	.remaining {
		font-family: var(--h-font-mono);
		font-size: 12px;
		color: var(--h-cool-light);
		white-space: nowrap;
	}

	.dismiss {
		color: var(--h-text-3);
		font-size: 18px;
		line-height: 1;
	}
</style>
