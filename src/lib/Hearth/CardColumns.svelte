<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import {
		cloneOverviewItem,
		isStack,
		takenCardIds,
		uniqueId,
		type HearthConfig,
		type OverviewCard,
		type OverviewItem,
		type OverviewStack
	} from './config';
	import { onDndReceive } from './drag';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import CardRenderer from './CardRenderer.svelte';
	import EditChip from './EditChip.svelte';
	import VisibilityGate from './VisibilityGate.svelte';

	let {
		columns,
		locate,
		groupName,
		roomId,
		fill = false
	}: {
		columns: OverviewItem[][];
		// resolves the mutable columns array inside a config draft, initializing
		// it if needed - all mutations below go through this
		locate: (config: HearthConfig) => OverviewItem[][];
		groupName: string;
		// the page these columns belong to; carried into every editor target
		roomId: string;
		fill?: boolean;
	} = $props();

	// Alt-drop duplicate: gives the clone (and, for a stack, every child) a
	// fresh id the same way the "Add card" flow does.
	function cloneEntry<T extends OverviewItem>(item: T): T {
		return cloneOverviewItem(item, takenCardIds($hearthConfig));
	}

	function reorderColumn(column: number, items: OverviewItem[]) {
		updateConfig((config) => {
			locate(config)[column] = items.filter(Boolean);
		});
	}

	function reorderStack(columnIndex: number, stackId: string, items: OverviewCard[]) {
		updateConfig((config) => {
			const stack = locate(config)[columnIndex]?.find(
				(item): item is OverviewStack => isStack(item) && item.id === stackId
			);
			if (stack) stack.cards = items.filter(Boolean);
		});
	}

	// searches top-level columns, then each column's stacks' children - never
	// recurses further since stacks cannot themselves contain a stack
	function locateList(config: HearthConfig, id: string): OverviewItem[] | undefined {
		for (const column of locate(config)) {
			if (column.some((item) => item.id === id)) return column;
			for (const item of column) {
				if (isStack(item) && item.cards.some((card) => card.id === id)) return item.cards;
			}
		}
		return undefined;
	}

	// a card or stack dropped from another column/stack: move it in one
	// config update; the source's onEnd then finds nothing to remove and
	// no-ops. Alt-drop duplicates instead: the source keeps its item and the
	// target gets a clone with a fresh id.
	function receiveCard(column: number, id: string, newIndex: number, alt: boolean) {
		updateConfig((config) => {
			const sourceList = locateList(config, id);
			if (!sourceList) return;
			const index = sourceList.findIndex((item) => item.id === id);
			if (index < 0) return;
			if (alt) {
				locate(config)[column].splice(
					newIndex,
					0,
					cloneOverviewItem(sourceList[index], takenCardIds(config))
				);
			} else {
				const [item] = sourceList.splice(index, 1);
				locate(config)[column].splice(newIndex, 0, item);
			}
		});
	}

	// same idea as receiveCard, but the target is a stack's children list.
	// Stacks can never receive a stack - blocked at the sortable group's
	// `put` check below, and re-checked here for safety.
	function receiveIntoStack(
		columnIndex: number,
		stackId: string,
		id: string,
		newIndex: number,
		alt: boolean
	) {
		updateConfig((config) => {
			const stack = locate(config)[columnIndex]?.find(
				(item): item is OverviewStack => isStack(item) && item.id === stackId
			);
			if (!stack) return;
			const sourceList = locateList(config, id);
			if (!sourceList) return;
			const index = sourceList.findIndex((item) => item.id === id);
			if (index < 0) return;
			const source = sourceList[index];
			if (isStack(source)) return;
			if (alt) {
				stack.cards.splice(newIndex, 0, cloneOverviewItem(source, takenCardIds(config)));
			} else {
				sourceList.splice(index, 1);
				stack.cards.splice(newIndex, 0, source);
			}
		});
	}

	function addStack(column: number) {
		let newIndex = 0;
		updateConfig((config) => {
			const stack: OverviewStack = {
				id: uniqueId('stack', takenCardIds(config)),
				kind: 'stack',
				direction: 'horizontal',
				cards: []
			};
			const target = locate(config)[column];
			newIndex = target.length;
			target.push(stack);
		});
		editor.set({ kind: 'stack', roomId, column, index: newIndex });
	}

	// a stack's own sortable container refuses drops of another stack (no
	// nesting); everything else in the shared group is welcome
	const stackGroup = $derived({
		name: groupName,
		put: (_to: unknown, _from: unknown, dragEl: HTMLElement) => dragEl.dataset.cardType !== 'stack'
	});
</script>

{#snippet cardSlot(
	card: OverviewCard,
	target: { kind: 'card'; roomId: string; column: number; index: number; stackId?: string }
)}
	<VisibilityGate conditions={card.visibility}>
		{#snippet children(visible)}
			{#if $hearthEditMode || visible}
				<div
					class="card-slot"
					data-id={card.id}
					data-card-type={card.type}
					class:editing={$hearthEditMode}
					class:stretch={card.type === 'media' || card.type === 'temperature'}
					class:visibility-dimmed={$hearthEditMode && !visible}
				>
					{#if $hearthEditMode}
						<EditChip onedit={() => editor.set(target)} />
					{/if}
					<CardRenderer {card} />
				</div>
			{/if}
		{/snippet}
	</VisibilityGate>
{/snippet}

<div class="overview" class:fill style:--overview-columns={columns.length}>
	{#each columns as column, columnIndex (columnIndex)}
		<div
			class="column"
			use:sortable={{
				group: groupName,
				handle: '.drag-handle',
				filter: '.add-tile',
				disabled: !$hearthEditMode,
				clone: true,
				cloneItem: cloneEntry,
				items: column,
				onFinalize: (items: OverviewItem[]) => reorderColumn(columnIndex, items)
			}}
			use:onDndReceive={(detail) =>
				receiveCard(columnIndex, detail.id, detail.newIndex, detail.alt ?? false)}
		>
			{#each column as item, index (item.id)}
				{#if isStack(item)}
					<div
						class="stack-slot"
						class:editing={$hearthEditMode}
						data-id={item.id}
						data-card-type="stack"
					>
						{#if $hearthEditMode}
							<EditChip
								onedit={() => editor.set({ kind: 'stack', column: columnIndex, index, roomId })}
							/>
						{/if}
						{#if item.title}
							<div class="group-label">{item.title}</div>
						{/if}
						<div
							class="stack"
							class:vertical={item.direction === 'vertical'}
							use:sortable={{
								group: stackGroup,
								handle: '.drag-handle',
								filter: '.add-tile',
								disabled: !$hearthEditMode,
								clone: true,
								cloneItem: cloneEntry,
								items: item.cards,
								onFinalize: (items: OverviewCard[]) => reorderStack(columnIndex, item.id, items)
							}}
							use:onDndReceive={(detail) =>
								receiveIntoStack(
									columnIndex,
									item.id,
									detail.id,
									detail.newIndex,
									detail.alt ?? false
								)}
						>
							{#each item.cards as card, cardIndex (card.id)}
								{@render cardSlot(card, {
									kind: 'card',
									column: columnIndex,
									index: cardIndex,
									roomId,
									stackId: item.id
								})}
							{/each}
							{#if $hearthEditMode}
								<AddTile
									label="Add card"
									onadd={() =>
										editor.set({
											kind: 'card',
											column: columnIndex,
											index: null,
											roomId,
											stackId: item.id
										})}
								/>
							{/if}
						</div>
					</div>
				{:else}
					{@render cardSlot(item, { kind: 'card', column: columnIndex, index, roomId })}
				{/if}
			{/each}
			{#if $hearthEditMode}
				<AddTile
					label="Add card"
					onadd={() => editor.set({ kind: 'card', column: columnIndex, index: null, roomId })}
				/>
				<AddTile label="Add stack" onadd={() => addStack(columnIndex)} />
			{/if}
		</div>
	{/each}
</div>

<style>
	.overview {
		display: grid;
		grid-template-columns: repeat(var(--overview-columns, 2), 1fr);
		gap: 30px;
	}

	.overview.fill {
		min-height: 100%;
	}

	@media (max-width: 1200px) {
		.overview {
			grid-template-columns: 1fr;
		}
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 18px;
		min-height: 0;
	}

	.card-slot {
		position: relative;
	}

	/* every group is one editable, movable unit - show its bounds while editing */
	.card-slot.editing {
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		border-radius: var(--h-radius-md);
		padding: 12px;
	}

	.card-slot.stretch {
		flex: 1;
		min-height: 0;
	}

	.card-slot.visibility-dimmed {
		opacity: 0.45;
	}

	.stack-slot {
		position: relative;
	}

	.stack-slot.editing {
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		border-radius: var(--h-radius-md);
		padding: 12px;
	}

	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-label);
		margin: 0 0 10px;
	}

	.stack {
		display: flex;
		gap: 18px;
	}

	.stack:not(.vertical) {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.stack:not(.vertical) > .card-slot {
		flex: 1 1 200px;
		min-width: 0;
	}

	.stack.vertical {
		flex-direction: column;
	}
</style>
