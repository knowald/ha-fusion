<script lang="ts">
	import { states } from '$lib/Stores';
	import { capitalize, type RailWidget } from './config';
	import { hearthEditMode, sensorNumber } from './store';
	import Icon from './Icon.svelte';

	let { widget }: { widget: Extract<RailWidget, { type: 'progress' }> } = $props();

	// states that read as "nothing running" when no active_states list is set
	const IDLE_STATES = ['idle', 'off', 'unavailable', 'unknown', 'standby', 'none', 'docked'];

	let status = $derived(widget.status_entity ? $states?.[widget.status_entity]?.state : undefined);

	let active = $derived(
		status !== undefined &&
			(widget.active_states?.length
				? widget.active_states.includes(status)
				: !IDLE_STATES.includes(status))
	);

	let progress = $derived.by(() => {
		const value = widget.progress_entity
			? sensorNumber($states?.[widget.progress_entity]?.state)
			: null;
		return value === null ? null : Math.max(0, Math.min(100, value));
	});

	// re-evaluated every 30s so timestamp countdowns tick without state changes
	let now = $state(Date.now());
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), 30_000);
		return () => clearInterval(timer);
	});

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

{#if active || $hearthEditMode}
	<div class="row" class:inactive={!active}>
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
		{#if remaining !== null}
			<span class="remaining">{remaining}</span>
		{/if}
	</div>
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
</style>
