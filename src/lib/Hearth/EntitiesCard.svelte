<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { domainIcon, PRESS_RIPPLE, type OverviewCard } from './config';
	import { entityGroupSummary, hearthEditMode } from './store';
	import AnchoredPopover from './AnchoredPopover.svelte';
	import EntityGrid from './EntityGrid.svelte';
	import Icon from './Icon.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'entities' }> } = $props();

	let summary = $derived(
		entityGroupSummary(
			card.entities.map((ref) => ref.entity),
			$states
		)
	);
	let summaryText = $derived(
		card.summary ??
			(card.summary_entity
				? [
						$states?.[card.summary_entity]?.state ?? '-',
						$states?.[card.summary_entity]?.attributes?.unit_of_measurement ?? ''
					]
						.join(' ')
						.trim()
				: summary.text)
	);

	let row = $state<HTMLElement | undefined>();
	let popoverOpen = $state(false);

	// edit mode arranges cards; the row's own tap belongs to the edit chip there
	function togglePopover() {
		if (!$hearthEditMode) popoverOpen = !popoverOpen;
	}

	$effect(() => {
		if ($hearthEditMode) popoverOpen = false;
	});
</script>

{#if card.collapsed}
	<div
		class="summary-row pressable"
		class:open={popoverOpen}
		bind:this={row}
		role="button"
		tabindex="0"
		aria-expanded={popoverOpen}
		use:Ripple={PRESS_RIPPLE}
		onclick={togglePopover}
		onkeydown={(event) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				togglePopover();
			}
		}}
	>
		<div class="summary-copy">
			<Icon
				name={card.icon || domainIcon(card.entities[0]?.entity)}
				size={24}
				color="var(--h-accent-dim-text)"
			/>
			<div class="summary-text">
				<div class="summary-title">{card.title || 'Group'}</div>
				<div class="summary-state">{summaryText}</div>
			</div>
		</div>
		<Icon name="chevron_right" size={20} color="var(--h-icon)" />
	</div>

	{#if popoverOpen && row}
		<AnchoredPopover anchor={row} onclose={() => (popoverOpen = false)}>
			<div class="popover-header">
				<div class="popover-title">{card.title || 'Group'}</div>
				{#if summary.badge}
					<div class="popover-badge">{summary.badge}</div>
				{/if}
			</div>
			{#if card.entities.length === 0}
				<div class="placeholder">Add entities in the card editor</div>
			{:else}
				<!-- the popover is ~420px wide, so more than two tracks would squeeze
				     the tiles to nothing however many the card asks for -->
				<EntityGrid
					entities={card.entities}
					style={card.style ?? 'tile'}
					columns={Math.min(card.columns ?? 2, 2)}
					compact={card.vertical_padding === 'compact'}
					readonly={card.readonly}
				/>
			{/if}
		</AnchoredPopover>
	{/if}
{:else}
	<div class="section">
		{#if card.title || card.show_count}
			<div class="section-header">
				<div class="section-title">{card.title ?? ''}</div>
				{#if card.show_count}
					<!-- same helper as the collapsed row, so both agree on the wording -->
					<div class="section-hint">{summary.activeLabel}</div>
				{/if}
			</div>
		{/if}
		{#if card.entities.length === 0}
			<div class="placeholder">Add entities in the card editor</div>
		{:else}
			<EntityGrid
				entities={card.entities}
				style={card.style ?? 'tile'}
				columns={card.columns}
				compact={card.vertical_padding === 'compact'}
				readonly={card.readonly}
			/>
		{/if}
	</div>
{/if}

<style>
	.section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.section-title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
	}

	.section-hint {
		font-size: 13px;
		color: var(--h-text-5);
	}

	.summary-row {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px 17px;
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.summary-row.open {
		background: rgb(var(--h-accent-rgb) / 0.12);
		border-color: rgb(var(--h-accent-rgb) / 0.3);
	}

	.summary-copy {
		display: flex;
		align-items: center;
		gap: 13px;
		min-width: 0;
	}

	.summary-text {
		min-width: 0;
	}

	.summary-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--h-text-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.summary-state {
		font-size: 12.5px;
		color: var(--h-text-4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.popover-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 13px;
	}

	.popover-title {
		font-size: 14.5px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.popover-badge {
		padding: 6px 11px;
		border-radius: 999px;
		background: rgb(var(--h-accent-rgb) / 0.13);
		font-family: var(--h-font-mono);
		font-size: 10.5px;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		color: var(--h-accent-bright);
		white-space: nowrap;
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 14px;
		text-align: center;
	}
</style>
