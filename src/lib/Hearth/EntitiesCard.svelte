<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import {
		domainIcon,
		isStack,
		PRESS_RIPPLE,
		type EntityRef,
		type HearthConfig,
		type OverviewCard
	} from './config';
	import { entityGroupSummary, hearthEditMode, updateConfig } from './store';
	import AnchoredPopover from './AnchoredPopover.svelte';
	import EntityGrid from './EntityGrid.svelte';
	import Icon from './Icon.svelte';

	let {
		card,
		onentitiesreorder = undefined,
		showEntityDragHandles = true
	}: {
		card: Extract<OverviewCard, { type: 'entities' }>;
		/** Draft-card callback used by the card editor's interactive preview. */
		onentitiesreorder?: (entities: EntityRef[]) => void;
		showEntityDragHandles?: boolean;
	} = $props();

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

	function findCard(
		config: HearthConfig,
		cardId: string
	): Extract<OverviewCard, { type: 'entities' }> | undefined {
		for (const room of config.rooms) {
			for (const column of room.cards) {
				for (const item of column) {
					if (!isStack(item)) {
						if (item.id === cardId && item.type === 'entities') return item;
						continue;
					}
					const child = item.cards.find(
						(entry): entry is Extract<OverviewCard, { type: 'entities' }> =>
							entry.id === cardId && entry.type === 'entities'
					);
					if (child) return child;
				}
			}
		}
		return undefined;
	}

	function reorderEntities(entities: EntityRef[]) {
		if (onentitiesreorder) {
			onentitiesreorder(entities);
			return;
		}
		updateConfig((config) => {
			const target = findCard(config, card.id);
			if (target) target.entities = entities.filter(Boolean);
		});
	}

	function receiveEntity(token: string, newIndex: number) {
		let sourceId: string;
		let sourceIndex: number;
		try {
			[sourceId, sourceIndex] = JSON.parse(token);
		} catch {
			return;
		}
		if (typeof sourceId !== 'string' || !Number.isInteger(sourceIndex)) return;

		updateConfig((config) => {
			const source = findCard(config, sourceId);
			const target = findCard(config, card.id);
			if (!source || !target || source === target || sourceIndex < 0) return;
			const [entity] = source.entities.splice(sourceIndex, 1);
			if (!entity) return;
			target.entities.splice(Math.min(Math.max(newIndex, 0), target.entities.length), 0, entity);
		});
	}
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

	{#if $hearthEditMode && showEntityDragHandles}
		<div class="collapsed-editor-grid">
			<EntityGrid
				entities={card.entities}
				cardId={card.id}
				style={card.style ?? 'tile'}
				columns={card.columns}
				compact={card.vertical_padding === 'compact'}
				readonly={card.readonly}
				showDragHandles={showEntityDragHandles}
				onreorder={reorderEntities}
				onreceive={receiveEntity}
			/>
		</div>
	{/if}

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
					showDragHandles={showEntityDragHandles}
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
		{#if card.entities.length === 0 && (!$hearthEditMode || !showEntityDragHandles)}
			<div class="placeholder">Add entities in the card editor</div>
		{:else}
			<EntityGrid
				entities={card.entities}
				cardId={card.id}
				style={card.style ?? 'tile'}
				columns={card.columns}
				compact={card.vertical_padding === 'compact'}
				readonly={card.readonly}
				showDragHandles={showEntityDragHandles}
				onreorder={reorderEntities}
				onreceive={receiveEntity}
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

	.collapsed-editor-grid {
		margin-top: 12px;
	}
</style>
