<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { OverviewCard } from './config';
	import {
		controlOverrides,
		entityActiveFor,
		hearthEditMode,
		pendingEntities,
		sensorNumber,
		toggleVacuum
	} from './store';
	import AnchoredPopover from './AnchoredPopover.svelte';
	import Icon from './Icon.svelte';
	import { getHearthInteractionMode } from './interaction';
	import VacuumPopover from './VacuumPopover.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'vacuum' }> } = $props();

	const interactionMode = getHearthInteractionMode();
	const preview = interactionMode === 'preview';

	const statusLabels: Record<string, string> = {
		docked: 'Docked',
		cleaning: 'Cleaning',
		returning: 'Returning to dock',
		paused: 'Paused',
		idle: 'Idle',
		error: 'Error'
	};

	let entity = $derived(card.entity ? $states?.[card.entity] : undefined);
	let battery = $derived(
		card.battery_entity
			? sensorNumber($states?.[card.battery_entity]?.state)
			: sensorNumber(String(entity?.attributes?.battery_level ?? ''))
	);
	let bin = $derived(card.bin_entity ? sensorNumber($states?.[card.bin_entity]?.state) : null);
	let running = $derived(
		card.entity ? entityActiveFor(card.entity, entity, $controlOverrides) : false
	);
	let pending = $derived(card.entity !== undefined && $pendingEntities[card.entity] !== undefined);
	let status = $derived(
		[
			statusLabels[entity?.state ?? ''] ?? 'Unavailable',
			...(battery !== null ? [`${Math.round(battery)}%`] : []),
			...(bin !== null ? [`bin ${Math.round(bin)}%`] : [])
		].join(' · ')
	);
	let row = $state<HTMLElement | undefined>();
	let popoverOpen = $state(false);

	function openPopup() {
		if (!card.entity || ($hearthEditMode && !preview)) return;
		popoverOpen = !popoverOpen;
	}

	$effect(() => {
		if ($hearthEditMode && !preview) popoverOpen = false;
	});
</script>

<div
	class="row"
	class:openable={Boolean(card.entity) && (!$hearthEditMode || preview)}
	class:open={popoverOpen}
	bind:this={row}
	role="button"
	tabindex="0"
	aria-expanded={popoverOpen}
	onclick={openPopup}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			openPopup();
		}
	}}
>
	<Icon name="robot_2" size={26} color="var(--h-accent-dim-text)" />
	<div class="info">
		<div class="name">{entity?.attributes?.friendly_name ?? 'Vacuum'}</div>
		<div class="status">{status}</div>
	</div>
	{#if card.quick_action}
		<button
			type="button"
			class="action pressable"
			class:running
			class:pending
			use:Ripple={PRESS_RIPPLE}
			onclick={(event) => {
				event.stopPropagation();
				if (card.entity && !preview) toggleVacuum(card.entity);
			}}
			onkeydown={(event) => event.stopPropagation()}
		>
			<Icon name={running ? 'stop' : 'play_arrow'} size={18} />
			{running ? 'Stop' : 'Clean'}
		</button>
	{/if}
	<Icon name="chevron_right" size={21} color="var(--h-icon)" />
</div>

{#if popoverOpen && row && card.entity}
	<AnchoredPopover anchor={row} onclose={() => (popoverOpen = false)}>
		<VacuumPopover
			entity={card.entity}
			modes={card.modes ?? []}
			batteryEntity={card.battery_entity}
			binEntity={card.bin_entity}
		/>
	</AnchoredPopover>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
	}

	.row.openable {
		cursor: pointer;
	}

	.row.open {
		border-color: rgb(var(--h-accent-rgb) / calc(0.28 * var(--h-accent-scale)));
		background: rgb(var(--h-accent-rgb) / calc(0.08 * var(--h-accent-scale)));
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
		border: 0;
		font: inherit;
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
