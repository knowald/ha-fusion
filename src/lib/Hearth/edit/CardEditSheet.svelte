<script lang="ts">
	import { ICON } from '../iconSizes';
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
	import TypeGallery from './TypeGallery.svelte';
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
	// a new card opens on the gallery; an existing one on its fields
	let typeOpen = $state(id === null);
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
		// snapshot: the draft is $state and its nested arrays are proxies,
		// which the store's structuredClone cannot copy
		const fields = {
			...(initial?.type === type ? initial : {}),
			...$state.snapshot(draft.fields)
		};
		return {
			...fields,
			// the editor loads on demand and reports its fields a beat after the
			// preview first renders; normalizing fills typed defaults until then
			...descriptor.normalize(fields),
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

	function selectType(value: string) {
		type = value as OverviewCard['type'];
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
	<TypeGallery
		kinds={CARD_TYPES}
		selected={type}
		label="hearth_card_type"
		searchPlaceholder={$lang('hearth_search_cards')}
		noMatch={$lang('hearth_no_cards_match')}
		bind:open={typeOpen}
		onselect={selectType}
	/>
	<div class="card-editor-layout editor-layout" class:hidden={typeOpen}>
		<div class="card-settings editor-fields">
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
						{$lang(descriptor.heightHint ?? 'hearth_height_hint_fill')}
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

	/* the open gallery is the whole sheet; fields and preview wait underneath */
	.card-editor-layout.hidden {
		display: none;
	}

	@media (max-width: 820px) {
		.card-editor-layout {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
