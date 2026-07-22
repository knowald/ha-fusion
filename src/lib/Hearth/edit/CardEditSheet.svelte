<script lang="ts">
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { loadIcons } from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import {
		FUSION_OBJECT_TYPES,
		isStack,
		moveItem,
		normalizeVisibility,
		OVERVIEW_CARD_TYPES,
		PRESS_RIPPLE,
		slugify,
		takenCardIds,
		uniqueId,
		type EntityRef,
		type HearthConfig,
		type OverviewCard,
		type VisibilityCondition
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import { openModal } from '$lib/Modals';
	import { icons as pictureElementsIcons } from '$lib/Modal/PictureElements/icons';
	import CardRenderer from '../CardRenderer.svelte';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import FusionFields, { applyLeftoverYaml, dumpLeftoverYaml } from './FusionFields.svelte';
	import Icon from '../Icon.svelte';
	import IconField from './IconField.svelte';
	import TextField from './TextField.svelte';
	import SelectField from './SelectField.svelte';
	import VisibilityField from './VisibilityField.svelte';
	import YamlField from './YamlField.svelte';

	let {
		column,
		index,
		roomId,
		stackId
	}: { column: number; index: number | null; roomId?: string; stackId?: string } = $props();

	function stackCards(config: HearthConfig, targetStackId: string): OverviewCard[] | undefined {
		const target = config.overview[column]?.find((item) => item.id === targetStackId);
		return target && isStack(target) ? target.cards : undefined;
	}

	// with roomId the sheet edits that room's cards list instead of an
	// overview column (initializing it on first write); with stackId it edits
	// that stack's children instead. The column branch is cast to
	// OverviewCard[] - EditChip only opens this sheet without roomId/stackId
	// for a leaf-card slot, never a stack's slot (stacks have their own edit
	// sheet), so a column index reached this way is never a stack.
	function cardList(config: HearthConfig): OverviewCard[] | undefined {
		if (roomId !== undefined) {
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (!room) return undefined;
			return (room.cards ??= []);
		}
		if (stackId !== undefined) return stackCards(config, stackId);
		return config.overview[column] as OverviewCard[] | undefined;
	}

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? cardList(get(hearthConfig))?.[index] : undefined;

	// display widened to string so the per-entity select can hold '' for
	// "follow the card style"; narrowed back to the union in buildCard
	type EditableRef = { entity: string; name?: string; icon?: string; display?: string };

	let type = $state<OverviewCard['type']>(initial?.type ?? 'entities');
	let title = $state(initial && 'title' in initial ? (initial.title ?? '') : '');
	let label = $state(initial?.type === 'temperature' ? (initial.label ?? '') : '');
	let unit = $state(initial?.type === 'temperature' ? (initial.unit ?? '') : '°C');
	let entity = $state(initial && 'entity' in initial ? (initial.entity ?? '') : '');
	let gridStyle = $state<string>(initial?.type === 'entities' ? (initial.style ?? 'tile') : 'tile');
	let gridColumns = $state<string>(
		initial?.type === 'entities' && initial.columns ? String(initial.columns) : ''
	);
	let showCount = $state(initial?.type === 'entities' ? (initial.show_count ?? false) : false);
	let entities = $state<EditableRef[]>(
		initial?.type === 'entities'
			? initial.entities.map((ref) => ({ ...ref, display: ref.display ?? '' }))
			: []
	);
	let scenes = $state<EntityRef[]>(
		initial?.type === 'scenes' ? initial.scenes.map((ref) => ({ ...ref })) : []
	);
	let visibility = $state<VisibilityCondition[]>(
		(initial?.visibility ?? []).map((condition) => ({ ...condition }))
	);
	const initialFusion = initial?.type === 'fusion' ? (initial.config ?? {}) : {};
	let fusionType = $state<string>(String(initialFusion.type ?? 'button'));
	let fusionOptions = $state<Record<string, any>>(withoutType(initialFusion));
	let advancedOpen = $state(false);
	let advancedYaml = $state('');
	let advancedValid = $state(true);

	const yamlPlaceholder = 'entity_id: light.living_room\nname: Living Room';

	function withoutType(config: Record<string, any>) {
		const options = { ...config };
		delete options.type;
		return options;
	}

	// the YAML area edits only the keys the form fields do not cover, so its
	// text is re-dumped whenever the covered key set can have changed
	function resetAdvancedYaml() {
		advancedYaml = dumpLeftoverYaml(fusionType, fusionOptions);
		advancedValid = true;
	}

	function toggleAdvanced() {
		advancedOpen = !advancedOpen;
		if (advancedOpen) resetAdvancedYaml();
	}

	function setAdvancedYaml(value: string) {
		advancedYaml = value;
		advancedValid = applyLeftoverYaml(fusionType, fusionOptions, value);
	}

	/**
	 * Opens the original picture-elements Konva editor for the fusion card's
	 * `elements`. The editor mutates the `sel` object it's given in place (see
	 * its onDestroy) rather than writing through any store, so it's passed a
	 * plain snapshot; once the modal closes that snapshot is copied back into
	 * `fusionOptions`, which flows into hearthConfig through the normal
	 * done()/updateConfig() path.
	 */
	async function openElementsEditor() {
		const sel = {
			id: initial?.id ?? 'hearth-fusion',
			elements: $state.snapshot(fusionOptions).elements ?? []
		};

		const [{ default: PictureElementsConfig }] = await Promise.all([
			import('$lib/Modal/PictureElements/PictureElementsConfig.svelte'),
			loadIcons(Object.values(pictureElementsIcons))
		]);

		await openModal(PictureElementsConfig, { sel });
		// PictureElementsConfig writes sel.elements from its onDestroy, which
		// runs as part of the Svelte reactivity flush triggered by the modal
		// stack closing - wait for that flush before reading sel back.
		await tick();

		fusionOptions.elements = sel.elements;
		if (advancedOpen) resetAdvancedYaml();
	}

	let entityDomains = $derived(
		type === 'media'
			? ['media_player']
			: type === 'vacuum'
				? ['vacuum']
				: type === 'camera'
					? ['camera']
					: type === 'climate'
						? ['climate']
						: ['sensor']
	);

	function close() {
		editor.set(null);
	}

	function buildCard(id: string): OverviewCard {
		const visibilityValue = normalizeVisibility($state.snapshot(visibility));
		if (type === 'temperature') {
			return {
				id,
				type,
				label: label.trim() || undefined,
				entity: entity.trim() || undefined,
				unit: unit.trim() || undefined,
				visibility: visibilityValue
			};
		}
		if (type === 'entities') {
			const columnCount = parseInt(gridColumns, 10);
			return {
				id,
				type,
				title: title.trim() || undefined,
				style: gridStyle === 'stat' ? 'stat' : undefined,
				columns: Number.isFinite(columnCount) && columnCount >= 1 ? columnCount : undefined,
				show_count: showCount || undefined,
				entities: entities
					.map((ref): EntityRef => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined,
						display: ref.display === 'stat' || ref.display === 'tile' ? ref.display : undefined
					}))
					.filter((ref) => ref.entity),
				visibility: visibilityValue
			};
		}
		if (type === 'camera' || type === 'climate') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				visibility: visibilityValue
			};
		}
		if (type === 'scenes') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				scenes: scenes
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined
					}))
					.filter((ref) => ref.entity),
				visibility: visibilityValue
			};
		}
		if (type === 'fusion') {
			return {
				id,
				type,
				config: { type: fusionType, ...$state.snapshot(fusionOptions) },
				visibility: visibilityValue
			};
		}
		return { id, type, entity: entity.trim() || undefined, visibility: visibilityValue };
	}

	let previewCard = $derived.by(() => buildCard('preview'));

	function done() {
		updateConfig((config) => {
			const cards = cardList(config);
			if (!cards) return;
			if (index !== null) {
				cards[index] = buildCard(cards[index].id);
			} else {
				cards.push(buildCard(uniqueId(slugify(type), takenCardIds(config))));
			}
		});
		close();
	}

	function remove() {
		updateConfig((config) => {
			if (index !== null) cardList(config)?.splice(index, 1);
		});
		close();
	}

	// meaningful for an existing room card, or a card inside a stack (moving
	// it out to a room) - a plain overview-column card has no current room to
	// move from, and a not-yet-created card has nothing to splice out of
	let canMoveRoom = $derived((roomId !== undefined || stackId !== undefined) && index !== null);

	let targetRoomId = $state(roomId ?? '');

	function moveToRoom(newRoomId: string) {
		if (!canMoveRoom || !newRoomId || newRoomId === roomId || index === null) return;
		let newIndex = 0;
		updateConfig((config) => {
			const sourceCards =
				stackId !== undefined
					? stackCards(config, stackId)
					: config.rooms.find((entry) => entry.id === roomId)?.cards;
			const targetRoom = config.rooms.find((entry) => entry.id === newRoomId);
			if (!sourceCards || !targetRoom) return;
			// persist in-progress field edits before the editor.set below remounts
			// the sheet and discards local state
			sourceCards[index] = buildCard(sourceCards[index].id);
			const [card] = sourceCards.splice(index, 1);
			const targetCards = (targetRoom.cards ??= []);
			newIndex = targetCards.length;
			targetCards.push(card);
		});
		editor.set({ kind: 'card', column: 0, index: newIndex, roomId: newRoomId });
	}
</script>

<EditSheet
	title={index !== null ? 'Edit card' : 'Add card'}
	onclose={close}
	ondone={done}
	doneDisabled={type === 'fusion' && advancedOpen && !advancedValid}
	onremove={index !== null ? remove : undefined}
>
	<SelectField label="Type" bind:value={type} options={OVERVIEW_CARD_TYPES} />

	{#if canMoveRoom && $hearthConfig.rooms.length > 1}
		<SelectField
			label="Move to room"
			bind:value={targetRoomId}
			options={$hearthConfig.rooms.map((room) => ({ value: room.id, label: room.name }))}
			onchange={moveToRoom}
		/>
	{/if}

	<div class="group-label">PREVIEW</div>
	<div class="preview" style="pointer-events: none">
		<CardRenderer card={previewCard} />
	</div>

	{#if type === 'entities' || type === 'camera' || type === 'climate' || type === 'scenes'}
		<TextField label="Title" bind:value={title} placeholder="Lights" />
	{/if}

	{#if type === 'temperature'}
		<TextField label="Label" bind:value={label} placeholder="Average home temperature" />
		<EntityField label="Entity" bind:value={entity} domains={['sensor']} />
		<TextField label="Unit" bind:value={unit} placeholder="°C" />
	{/if}

	{#if type === 'media' || type === 'vacuum' || type === 'camera' || type === 'climate'}
		<EntityField label="Entity" bind:value={entity} domains={entityDomains} />
	{/if}

	{#if type === 'entities'}
		<SelectField
			label="Style"
			bind:value={gridStyle}
			options={[
				{ value: 'tile', label: 'Tiles' },
				{ value: 'stat', label: 'Stat boxes' }
			]}
		/>
		<SelectField
			label="Columns"
			bind:value={gridColumns}
			options={[
				{ value: '', label: 'Auto' },
				{ value: '1', label: '1' },
				{ value: '2', label: '2' },
				{ value: '3', label: '3' },
				{ value: '4', label: '4' }
			]}
		/>
		<label class="check">
			<input type="checkbox" bind:checked={showCount} />
			<span>Show active count in header</span>
		</label>

		<div class="group-label">ENTITIES</div>
		{#each entities as ref, refIndex (refIndex)}
			<div class="filter-row">
				<div class="filter-fields">
					<EntityField label="Entity" bind:value={ref.entity} />
					<TextField label="Name (optional)" bind:value={ref.name} />
					<IconField label="Icon (optional)" bind:value={ref.icon} />
					<SelectField
						label="Display"
						bind:value={ref.display}
						options={[
							{ value: '', label: 'Card style' },
							{ value: 'tile', label: 'Tile' },
							{ value: 'stat', label: 'Stat box' }
						]}
					/>
				</div>
				<span class="row-actions">
					<span
						class="reorder"
						class:disabled={refIndex === 0}
						onclick={() => moveItem(entities, refIndex, -1)}
					>
						<Icon name="keyboard_arrow_up" size={20} />
					</span>
					<span
						class="reorder"
						class:disabled={refIndex === entities.length - 1}
						onclick={() => moveItem(entities, refIndex, 1)}
					>
						<Icon name="keyboard_arrow_down" size={20} />
					</span>
					<span class="remove" onclick={() => entities.splice(refIndex, 1)}>
						<Icon name="delete" size={20} />
					</span>
				</span>
			</div>
		{/each}
		<div
			class="add-filter"
			onclick={() => entities.push({ entity: '', name: '', icon: '', display: '' })}
		>
			<Icon name="add" size={18} />
			<span>Add entity</span>
		</div>
	{/if}

	{#if type === 'scenes'}
		<div class="group-label">SCENES</div>
		{#each scenes as ref, refIndex (refIndex)}
			<div class="filter-row">
				<div class="filter-fields">
					<EntityField label="Entity" bind:value={ref.entity} domains={['scene', 'script']} />
					<TextField label="Name (optional)" bind:value={ref.name} />
					<IconField label="Icon (optional)" bind:value={ref.icon} />
				</div>
				<span class="remove" onclick={() => scenes.splice(refIndex, 1)}>
					<Icon name="delete" size={20} />
				</span>
			</div>
		{/each}
		<div class="add-filter" onclick={() => scenes.push({ entity: '', name: '', icon: '' })}>
			<Icon name="add" size={18} />
			<span>Add scene</span>
		</div>
	{/if}

	{#if type === 'fusion'}
		<SelectField
			label="Object type"
			bind:value={fusionType}
			options={FUSION_OBJECT_TYPES}
			onchange={() => advancedOpen && resetAdvancedYaml()}
		/>
		<FusionFields type={fusionType} bind:options={fusionOptions} />
		{#if fusionType === 'picture_elements'}
			<div class="elements-editor pressable" use:Ripple={PRESS_RIPPLE} onclick={openElementsEditor}>
				<Icon name="edit" size={18} />
				<span>Open elements editor</span>
			</div>
		{/if}
		<div class="advanced-toggle pressable" use:Ripple={PRESS_RIPPLE} onclick={toggleAdvanced}>
			<Icon name={advancedOpen ? 'expand_less' : 'expand_more'} size={18} />
			<span>Advanced (YAML)</span>
		</div>
		{#if advancedOpen}
			<YamlField
				label="Other options (YAML)"
				bind:value={() => advancedYaml, setAdvancedYaml}
				placeholder={yamlPlaceholder}
			/>
			<div class="hint">
				Options match the original ha-fusion object config for the chosen type, e.g. entity_id,
				name, icon.
			</div>
		{/if}
	{/if}

	<VisibilityField bind:value={visibility} />
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 18px 0 10px;
	}

	.preview {
		background: var(--h-inset);
		border-radius: var(--h-radius-md);
		padding: 14px;
		margin-bottom: 14px;
	}

	.advanced-toggle,
	.elements-editor {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 4px;
		border-radius: var(--h-radius-xs);
		color: var(--h-text-5);
		font-size: 13px;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.advanced-toggle:hover,
	.elements-editor:hover {
		color: var(--h-text-3);
	}

	.elements-editor {
		margin-bottom: 14px;
	}

	.filter-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 12px 0;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
		margin-bottom: 10px;
	}

	.filter-fields {
		flex: 1;
	}

	.remove {
		color: var(--h-icon);
		cursor: pointer;
		margin-top: 32px;
	}

	.remove:hover {
		color: var(--h-bad-text);
	}

	.row-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin-top: 32px;
	}

	.row-actions .remove {
		margin-top: 0;
	}

	.reorder {
		color: var(--h-icon);
		cursor: pointer;
		display: inline-flex;
	}

	.reorder:hover {
		color: var(--h-text-2);
	}

	.reorder.disabled {
		opacity: 0.3;
		pointer-events: none;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		margin-top: 4px;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}

	.add-filter {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px;
		border-radius: var(--h-radius-xs);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 14px;
		cursor: pointer;
	}

	.add-filter:hover {
		color: var(--h-text-4);
	}

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}
</style>
