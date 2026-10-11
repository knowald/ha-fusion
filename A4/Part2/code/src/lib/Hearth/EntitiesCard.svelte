<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import {
		domainIcon,
		findOverviewCard,
		PRESS_RIPPLE,
		wildcardEntityIds,
		type EntityRef,
		type OverviewCard
	} from './config';
	import { getHearthInteractionMode } from './interaction';
	import {
		entityGroupSummary,
		hearthEditMode,
		setAllCovers,
		turnAllOff,
		updateConfig
	} from './store';
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

	const preview = getHearthInteractionMode() === 'preview';
	let resolvedEntities = $derived.by(() => {
		const explicitIds = new Set(card.entities.map((ref) => ref.entity));
		const matched = wildcardEntityIds(card.wildcard, Object.keys($states ?? {}))
			.filter((entityId) => !explicitIds.has(entityId))
			.map((entityId): EntityRef => ({ entity: entityId }));
		return [...card.entities, ...matched];
	});

	let summary = $derived(
		entityGroupSummary(
			resolvedEntities.map((ref) => ref.entity),
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

	// groups become verbs on the header line: a lights section offers All off,
	// a blinds section Open all / Close all, instead of an "All" tile in the grid
	let switchableIds = $derived(
		resolvedEntities
			.filter((ref) => ref.readonly !== true)
			.map((ref) => ref.entity)
			.filter((entityId) => ['light', 'switch', 'input_boolean'].includes(entityId.split('.')[0]))
	);
	let coverIds = $derived(
		resolvedEntities
			.filter((ref) => ref.readonly !== true)
			.map((ref) => ref.entity)
			.filter((entityId) => entityId.split('.')[0] === 'cover')
	);
	let showGroupActions = $derived(
		card.group_actions !== false && !card.readonly && !$hearthEditMode && !preview
	);

	let row = $state<HTMLElement | undefined>();
	let popoverOpen = $state(false);

	// edit mode arranges cards; the row's own tap belongs to the edit chip there
	function togglePopover() {
		if (!$hearthEditMode || preview) popoverOpen = !popoverOpen;
	}

	$effect(() => {
		if ($hearthEditMode && !preview) popoverOpen = false;
	});

	function findEntitiesCard(config: Parameters<typeof findOverviewCard>[0], cardId: string) {
		const target = findOverviewCard(config, cardId);
		return target?.type === 'entities' ? target : undefined;
	}

	function reorderEntities(entities: EntityRef[]) {
		if (onentitiesreorder) {
			onentitiesreorder(entities);
			return;
		}
		updateConfig((config) => {
			const target = findEntitiesCard(config, card.id);
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
			const source = findEntitiesCard(config, sourceId);
			const target = findEntitiesCard(config, card.id);
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
				name={card.icon || domainIcon(resolvedEntities[0]?.entity)}
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
				entities={resolvedEntities}
				cardId={card.wildcard ? undefined : card.id}
				style={card.style ?? 'tile'}
				columns={card.columns}
				compact={card.vertical_padding === 'compact'}
				readonly={card.readonly}
				sliderUpdates={card.slider_updates}
				tuneButton={card.tune_button}
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
			{#if resolvedEntities.length === 0}
				<div class="placeholder">Add entities or a wildcard in the card editor</div>
			{:else}
				<!-- the popover is ~420px wide, so more than two tracks would squeeze
				     the tiles to nothing however many the card asks for -->
				<EntityGrid
					entities={resolvedEntities}
					style={card.style ?? 'tile'}
					columns={Math.min(card.columns ?? 2, 2)}
					compact={card.vertical_padding === 'compact'}
					readonly={card.readonly}
					sliderUpdates={card.slider_updates}
					tuneButton={card.tune_button}
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
				<!-- a titled section always carries its count; show_count: false opts out -->
				{#if card.show_count ?? Boolean(card.title)}
					<!-- same helper as the collapsed row, so both agree on the wording -->
					<div class="section-hint">{summary.activeLabel}</div>
				{/if}
				<div class="section-spacer"></div>
				{#if showGroupActions && switchableIds.length > 1}
					<button
						type="button"
						class="group-action pressable"
						use:Ripple={PRESS_RIPPLE}
						onclick={() => turnAllOff(switchableIds)}
					>
						<Icon name="power_settings_new" size={17} />
						All off
					</button>
				{/if}
				{#if showGroupActions && coverIds.length > 1}
					<button
						type="button"
						class="group-action pressable"
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setAllCovers(coverIds, true)}
					>
						<Icon name="keyboard_double_arrow_up" size={16} />
						Open all
					</button>
					<button
						type="button"
						class="group-action pressable"
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setAllCovers(coverIds, false)}
					>
						<Icon name="keyboard_double_arrow_down" size={16} />
						Close all
					</button>
				{/if}
			</div>
		{/if}
		{#if resolvedEntities.length === 0 && (!$hearthEditMode || !showEntityDragHandles)}
			<div class="placeholder">Add entities or a wildcard in the card editor</div>
		{:else}
			<EntityGrid
				entities={resolvedEntities}
				cardId={card.wildcard ? undefined : card.id}
				style={card.style ?? 'tile'}
				columns={card.columns}
				compact={card.vertical_padding === 'compact'}
				readonly={card.readonly}
				sliderUpdates={card.slider_updates}
				tuneButton={card.tune_button}
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
		align-items: center;
		gap: 14px;
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

	.section-spacer {
		flex: 1;
	}

	.group-action {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 14px;
		border-radius: 999px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.09 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		color: var(--h-text-3);
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
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
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.summary-row.open {
		background: rgb(var(--h-accent-rgb) / calc(0.12 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.3 * var(--h-accent-scale)));
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
		background: rgb(var(--h-accent-rgb) / calc(0.13 * var(--h-accent-scale)));
		font-family: var(--h-font-mono);
		font-size: 10.5px;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		color: var(--h-accent-icon);
		white-space: nowrap;
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 14px;
		text-align: center;
	}

	.collapsed-editor-grid {
		margin-top: 12px;
	}
</style>
