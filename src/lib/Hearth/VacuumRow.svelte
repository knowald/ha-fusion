<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { OverviewCard } from './config';
	import { pendingEntities, toggleVacuum } from './store';
	import Icon from './Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'vacuum' }> } = $props();

	const statusLabels: Record<string, string> = {
		docked: 'Docked',
		cleaning: 'Cleaning',
		returning: 'Returning to dock',
		paused: 'Paused',
		idle: 'Idle',
		error: 'Error'
	};

	let entity = $derived(card.entity ? $states?.[card.entity] : undefined);
	let running = $derived(entity?.state === 'cleaning' || entity?.state === 'returning');
	let status = $derived(statusLabels[entity?.state ?? ''] ?? 'Unavailable');
	let pending = $derived(card.entity !== undefined && $pendingEntities[card.entity] !== undefined);
</script>

<div class="row">
	<Icon name="robot_2" size={28} color="var(--h-text-4)" />
	<div class="info">
		<div class="name">{entity?.attributes?.friendly_name ?? 'Vacuum'}</div>
		<div class="status">{status}</div>
	</div>
	<div
		class="action pressable"
		class:running
		class:pending
		use:Ripple={PRESS_RIPPLE}
		onclick={() => card.entity && toggleVacuum(card.entity)}
	>
		<Icon name={running ? 'stop' : 'play_arrow'} size={18} />
		{running ? 'Stop' : 'Clean'}
	</div>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
	}

	.info {
		flex: 1;
	}

	.name {
		font-size: 15px;
		font-weight: 600;
		color: var(--h-text-2);
	}

	.status {
		font-size: 13px;
		color: var(--h-text-5);
	}

	.action {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-xs);
		cursor: pointer;
		font-size: 14px;
		font-weight: 600;
		background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.action.running {
		background: rgb(var(--h-bad-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-bad-text);
	}
</style>
