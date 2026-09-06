<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { get } from 'svelte/store';
	import type {
		EntityRef,
		HearthConfig,
		OverviewCard,
		OverviewItem,
		VisibilityCondition
	} from '../types';
	import {
		ensureRoomCardColumns,
		findOverviewCard,
		findOverviewItemList,
		isStack,
		normalizeVisibility,
		slugify,
		takenCardIds,
		uniqueId
	} from '../config';
	import { CARD_TYPES, cardDescriptor, type CardDraft } from '../cards';
	import { editor, hearthConfig, updateConfig } from '../store';
	import CardPreview from './CardPreview.svelte';
	import EditSheet from './EditSheet.svelte';
	import FormSection from './FormSection.svelte';
	import Icon from '../Icon.svelte';
	import { layer } from '$lib/ui/layers';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';
	import VisibilityField from './VisibilityField.svelte';

	let {
		roomId,
		id,
		column,
		stackId
	}: { roomId: string; id: string | null; column?: number; stackId?: string } = $props();

	// `column` indexes into the page's card columns; they are initialized on
	// first write via ensureRoomCardColumns in done()
	function containerColumns(config: HearthConfig): OverviewItem[][] | undefined {
		return config.rooms.find((entry) => entry.id === roomId)?.cards;
	}

	function stackCards(config: HearthConfig, targetStackId: string): OverviewCard[] | undefined {
		if (column === undefined) return undefined;
		const target = containerColumns(config)?.[column]?.find((item) => item.id === targetStackId);
		return target && isStack(target) ? target.cards : undefined;
	}

	function insertionList(config: HearthConfig): OverviewCard[] | undefined {
		if (column === undefined) return undefined;
		if (stackId !== undefined) return stackCards(config, stackId);
		return containerColumns(config)?.[column] as OverviewCard[] | undefined;
	}

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = id !== null ? findOverviewCard(get(hearthConfig), id, roomId) : undefined;

	let type = $state<OverviewCard['type']>(initial?.type ?? 'entities');
	let typeOpen = $state(false);
	// blank means the type's own default: media and sensor cards fill, the rest
	// size to their content
	let fill = $state<string>(
		initial && typeof initial.fill === 'number' ? String(initial.fill) : ''
	);
	// blank means "size to content" for a fusion embed, or "fill the column" for
	// the two cards that stretch
	let height = $state<string>(
		initial && 'height' in initial && initial.height ? String(initial.height) : ''
	);
	let visibility = $state<VisibilityCondition[]>(
		(initial?.visibility ?? []).map((condition) => ({ ...condition }))
	);

	// the per-type editor reports its fields; the shell adds id, type and layout
	let draft = $state<CardDraft<OverviewCard>>({ fields: {} as CardDraft<OverviewCard>['fields'] });
	let editorRef = $state<{ applyPreviewReorder?: (entities: EntityRef[]) => void }>();

	let descriptor = $derived(cardDescriptor(type));
	let editorInitial = $derived(initial?.type === type ? initial : undefined);

	function buildCard(cardId: string): OverviewCard {
		const heightValue = parseInt(height, 10);
		const fillValue = fill === '' ? undefined : Number(fill);
		// Unknown extension keys survive a no-op form edit. Switching type starts
		// a new schema and intentionally leaves type-specific extensions behind.
		return {
			...(initial?.type === type ? initial : {}),
			// snapshot: the draft is $state and its nested arrays are proxies,
			// which the store's structuredClone cannot copy
			...$state.snapshot(draft.fields),
			id: cardId,
			type,
			...(descriptor.sizable
				? { height: Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined }
				: {}),
			fill: Number.isFinite(fillValue as number) ? fillValue : undefined,
			visibility: normalizeVisibility($state.snapshot(visibility))
		} as OverviewCard;
	}

	let previewCard = $derived.by(() => buildCard('preview'));

	function close() {
		editor.set(null);
	}

	function done() {
		updateConfig((config) => {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (room) ensureRoomCardColumns(room);
			if (id !== null) {
				const cards = findOverviewItemList(config, id, roomId);
				const targetIndex = cards?.findIndex((card) => card.id === id) ?? -1;
				if (cards && targetIndex >= 0) cards[targetIndex] = buildCard(id);
			} else {
				const cards = insertionList(config);
				if (!cards) return;
				cards.push(buildCard(uniqueId(slugify(type), takenCardIds(config))));
			}
		});
		close();
	}

	function remove() {
		updateConfig((config) => {
			if (id === null) return;
			const cards = findOverviewItemList(config, id, roomId);
			const targetIndex = cards?.findIndex((card) => card.id === id) ?? -1;
			if (cards && targetIndex >= 0) cards.splice(targetIndex, 1);
		});
		close();
	}

	function selectType(value: OverviewCard['type']) {
		type = value;
		typeOpen = false;
	}
</script>

<EditSheet
	title={id !== null ? 'Edit card' : 'Add card'}
	onclose={close}
	ondone={done}
	doneDisabled={draft.valid === false}
	onremove={id !== null ? remove : undefined}
	wide
>
	<div class="card-editor-layout">
		<div class="card-settings editor-fields">
			<div class="card-actions">
				<button type="button" class="action-button" onclick={() => (typeOpen = true)}>
					<span class="action-icon"><Icon name={descriptor.icon} size={20} /></span>
					<span class="action-copy"
						><small>{$lang('hearth_card_type')}</small><strong>{$lang(descriptor.name)}</strong
						></span
					>
					<Icon name="chevron_right" size={20} />
				</button>
			</div>

			<!-- keyed so a type switch mounts a fresh editor with fresh field state -->
			{#key type}
				{#await descriptor.editor() then Editor}
					<Editor.default
						bind:this={editorRef}
						initial={editorInitial}
						onchange={(next) => (draft = next)}
					/>
				{/await}
			{/key}

			<FormSection title={$lang('hearth_layout')}>
				<SelectField
					label={$lang('hearth_fill_leftover_height')}
					bind:value={fill}
					options={[
						{ value: '', label: 'Default for this card type' },
						{ value: '0', label: 'No, size to content' },
						{ value: '1', label: 'Yes, one share' },
						{ value: '2', label: 'Yes, double share' },
						{ value: '3', label: 'Yes, triple share' }
					]}
				/>
				<div class="hint">
					{$lang('hearth_cards_sharing_a_column_split_whatever')}
				</div>

				{#if descriptor.sizable}
					<TextField
						label={$lang('hearth_height_in_px_optional')}
						bind:value={height}
						placeholder="240"
					/>
					<div class="hint">
						{type === 'fusion'
							? 'Without it the embed keeps its own height.'
							: 'Without it the card fills the rest of its column.'}
					</div>
				{/if}

				<VisibilityField bind:value={visibility} />
			</FormSection>
		</div>

		<CardPreview
			card={previewCard}
			onentitiesreorder={descriptor.previewReorder
				? (entities) => editorRef?.applyPreviewReorder?.(entities)
				: undefined}
		/>
	</div>

	{#if typeOpen}
		<div
			class="popup-backdrop"
			role="presentation"
			onclick={(event) => event.target === event.currentTarget && (typeOpen = false)}
		>
			<div
				class="action-popup"
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-label={$lang('hearth_change_card_type')}
				use:layer={() => (typeOpen = false)}
			>
				<div class="popup-header">
					<div>
						<small>{$lang('hearth_structure')}</small>
						<h3>{$lang('hearth_change_card_type')}</h3>
					</div>
					<button
						type="button"
						aria-label={$lang('hearth_close')}
						onclick={() => (typeOpen = false)}><Icon name="close" size={22} /></button
					>
				</div>
				<p class="popup-intro">{$lang('hearth_choose_how_this_card_presents_its')}</p>
				<div class="type-gallery">
					{#each CARD_TYPES as kind (kind.type)}
						<button
							type="button"
							class="type-option"
							class:selected={type === kind.type}
							onclick={() => selectType(kind.type)}
						>
							<span class="type-icon"><Icon name={kind.icon} size={21} /></span>
							<span class="type-copy"
								><span class="type-name">{$lang(kind.name)}</span><span class="type-sub"
									>{$lang(kind.sub)}</span
								></span
							>
							{#if type === kind.type}<Icon name="check" size={19} />{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</EditSheet>

<style>
	.card-editor-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 0.85fr);
		align-items: start;
		gap: 28px;
	}

	.card-settings {
		min-width: 0;
	}

	.type-gallery {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin-bottom: 20px;
	}

	.card-actions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
		margin-bottom: 20px;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		padding: 10px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.035 * var(--h-fill-scale)));
		color: var(--h-icon);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.action-button:hover {
		border-color: rgb(var(--h-line-rgb) / calc(0.16 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
	}

	.action-icon {
		display: flex;
		padding: 7px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
	}

	.action-copy {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	.action-copy small,
	.popup-header small {
		font-family: var(--h-font-mono);
		font-size: 9px;
		letter-spacing: 1.5px;
		color: var(--h-label);
	}

	.action-copy strong {
		overflow: hidden;
		color: var(--h-text-3);
		font-size: 12px;
		font-weight: 550;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background: rgb(0 0 0 / 0.55);
		backdrop-filter: blur(5px);
	}

	.action-popup {
		width: min(620px, 100%);
		max-height: min(680px, calc(100dvh - 40px));
		padding: 22px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		border-radius: var(--h-radius-lg);
		background: var(--h-sheet-0);
		box-shadow: 0 24px 70px rgb(0 0 0 / 0.55);
		overflow: auto;
	}

	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.popup-header h3 {
		margin: 2px 0 0;
		color: var(--h-text-1);
		font-size: 20px;
	}

	.popup-header button {
		display: flex;
		padding: 7px;
		border: 0;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		color: var(--h-icon);
		cursor: pointer;
	}

	.popup-intro {
		margin: 8px 0 18px;
		color: var(--h-text-6);
		font-size: 13px;
	}

	.type-option {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		padding: 11px 12px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.035 * var(--h-fill-scale)));
		color: var(--h-text-4);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.type-option.selected {
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.3 * var(--h-accent-scale)));
		color: var(--h-accent-icon);
	}

	.type-icon {
		display: flex;
		flex: none;
	}

	.type-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.type-name {
		font-size: 13px;
		font-family: inherit;
		text-align: left;
		font-weight: 600;
	}

	.type-sub {
		font-size: 10px;
		color: var(--h-text-6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 820px) {
		.card-actions {
			grid-template-columns: 1fr;
		}

		.card-editor-layout {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
