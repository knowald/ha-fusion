<script lang="ts">
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { loadIcons } from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import {
		ensureRoomCardColumns,
		FUSION_OBJECT_TYPES,
		isStack,
		moveItem,
		normalizeVisibility,
		PRESS_RIPPLE,
		slugify,
		takenCardIds,
		uniqueId,
		type EntityRef,
		type HearthConfig,
		type OverviewCard,
		type OverviewItem,
		type VisibilityCondition
	} from '../config';
	import { currentRoom, editor, hearthConfig, updateConfig } from '../store';
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
		roomId,
		column,
		index,
		stackId
	}: { roomId: string; column: number; index: number | null; stackId?: string } = $props();

	const CARD_GALLERY: { value: OverviewCard['type']; name: string; sub: string; icon: string }[] = [
		{ value: 'entities', name: 'Entities', sub: 'tiles or readings', icon: 'grid_view' },
		{ value: 'header', name: 'Header', sub: 'title and room stats', icon: 'view_agenda' },
		{ value: 'temperature', name: 'Sensor', sub: 'reading and history', icon: 'monitoring' },
		{ value: 'media', name: 'Media', sub: 'now playing', icon: 'music_note' },
		{ value: 'vacuum', name: 'Vacuum', sub: 'cleaning control', icon: 'robot_2' },
		{ value: 'camera', name: 'Camera', sub: 'live camera feed', icon: 'videocam' },
		{ value: 'climate', name: 'Climate', sub: 'thermostat control', icon: 'thermostat' },
		{ value: 'scenes', name: 'Scenes', sub: 'scene shortcuts', icon: 'palette' },
		{ value: 'fusion', name: 'Fusion', sub: 'legacy objects', icon: 'widgets' }
	];

	// `column` indexes into the page's card columns; they are initialized on
	// first write via ensureRoomCardColumns in done()/moveCard
	function containerColumns(config: HearthConfig): OverviewItem[][] | undefined {
		return config.rooms.find((entry) => entry.id === roomId)?.cards;
	}

	function stackCards(config: HearthConfig, targetStackId: string): OverviewCard[] | undefined {
		const target = containerColumns(config)?.[column]?.find((item) => item.id === targetStackId);
		return target && isStack(target) ? target.cards : undefined;
	}

	// with stackId the sheet edits that stack's children instead of the
	// column itself. The column branch is cast to OverviewCard[] - EditChip
	// only opens this sheet for a leaf-card slot, never a stack's slot
	// (stacks have their own edit sheet), so an indexed slot reached this way
	// is never a stack.
	function cardList(config: HearthConfig): OverviewCard[] | undefined {
		if (stackId !== undefined) return stackCards(config, stackId);
		return containerColumns(config)?.[column] as OverviewCard[] | undefined;
	}

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? cardList(get(hearthConfig))?.[index] : undefined;

	// display widened to string so the per-entity select can hold '' for
	// "follow the card style"; narrowed back to the union in buildCard
	type EditableRef = {
		entity: string;
		name?: string;
		icon?: string;
		display?: string;
		readonly?: boolean;
	};
	type EditableSceneRef = {
		entity: string;
		name?: string;
		icon?: string;
		caption?: string;
		active_entity?: string;
		active_state?: string;
	};

	let type = $state<OverviewCard['type']>(initial?.type ?? 'entities');
	let typeOpen = $state(false);
	let title = $state(initial && 'title' in initial ? (initial.title ?? '') : '');
	let label = $state(initial?.type === 'temperature' ? (initial.label ?? '') : '');
	let unit = $state(initial?.type === 'temperature' ? (initial.unit ?? '') : '°C');
	let entity = $state(initial && 'entity' in initial ? (initial.entity ?? '') : '');
	let cameraStream = $state(initial?.type === 'camera' ? (initial.stream ?? false) : false);
	let subtitle = $state(initial?.type === 'header' ? (initial.subtitle ?? '') : '');
	let headerIcon = $state(initial?.type === 'header' ? (initial.icon ?? 'home') : 'home');
	let headerTempEntity = $state(initial?.type === 'header' ? (initial.temp_entity ?? '') : '');
	let headerHumidityEntity = $state(
		initial?.type === 'header' ? (initial.humidity_entity ?? '') : ''
	);
	let gridStyle = $state<string>(initial?.type === 'entities' ? (initial.style ?? 'tile') : 'tile');
	let gridColumns = $state<string>(
		initial?.type === 'entities' && initial.columns ? String(initial.columns) : ''
	);
	let showCount = $state(initial?.type === 'entities' ? (initial.show_count ?? false) : false);
	let gridVerticalPadding = $state(
		initial?.type === 'entities' ? (initial.vertical_padding ?? '') : ''
	);
	let gridReadonly = $state(initial?.type === 'entities' ? (initial.readonly ?? false) : false);
	let gridCollapsed = $state(initial?.type === 'entities' ? (initial.collapsed ?? false) : false);
	let gridIcon = $state(initial?.type === 'entities' ? (initial.icon ?? '') : '');
	let gridSummary = $state(initial?.type === 'entities' ? (initial.summary ?? '') : '');
	let gridSummaryEntity = $state(
		initial?.type === 'entities' ? (initial.summary_entity ?? '') : ''
	);
	// optional ref keys become '' instead of undefined - the row fields bind
	// them to props with fallback values, which undefined would crash
	let entities = $state<EditableRef[]>(
		initial?.type === 'entities'
			? initial.entities.map((ref) => ({
					entity: ref.entity ?? '',
					name: ref.name ?? '',
					icon: ref.icon ?? '',
					display: ref.display ?? '',
					readonly: ref.readonly ?? false
				}))
			: []
	);
	let sceneStyle = $state<string>(
		initial?.type === 'scenes' ? (initial.style ?? 'chips') : 'chips'
	);
	let scenes = $state<EditableSceneRef[]>(
		initial?.type === 'scenes'
			? initial.scenes.map((ref) => ({
					entity: ref.entity ?? '',
					name: ref.name ?? '',
					icon: ref.icon ?? '',
					caption: ref.caption ?? '',
					active_entity: ref.active_entity ?? '',
					active_state: ref.active_state ?? ''
				}))
			: []
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
		if (type === 'header') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				subtitle: subtitle.trim() || undefined,
				icon: headerIcon.trim() || undefined,
				temp_entity: headerTempEntity.trim() || undefined,
				humidity_entity: headerHumidityEntity.trim() || undefined,
				visibility: visibilityValue
			};
		}
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
				vertical_padding: gridVerticalPadding === 'compact' ? 'compact' : undefined,
				readonly: gridReadonly || undefined,
				collapsed: gridCollapsed || undefined,
				icon: gridCollapsed ? gridIcon.trim() || undefined : undefined,
				summary: gridCollapsed ? gridSummary.trim() || undefined : undefined,
				summary_entity: gridCollapsed ? gridSummaryEntity.trim() || undefined : undefined,
				entities: entities
					.map((ref): EntityRef => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined,
						display: ref.display === 'stat' || ref.display === 'tile' ? ref.display : undefined,
						readonly: ref.readonly || undefined
					}))
					.filter((ref) => ref.entity),
				visibility: visibilityValue
			};
		}
		if (type === 'camera') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				stream: cameraStream || undefined,
				visibility: visibilityValue
			};
		}
		if (type === 'climate') {
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
				style: sceneStyle === 'bar' ? 'bar' : undefined,
				scenes: scenes
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined,
						caption: ref.caption?.trim() || undefined,
						active_entity: ref.active_entity?.trim() || undefined,
						active_state: ref.active_state?.trim() || undefined
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
			const room = config.rooms.find((entry) => entry.id === roomId);
			if (room) ensureRoomCardColumns(room);
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

	// Placement is deliberately separate from the settings form. Moving a card
	// is an explicit operation; merely choosing a destination must not mutate the
	// dashboard or remount this editor.
	let canMove = $derived(index !== null);
	let placementOpen = $state(false);
	// The sheet is keyed by its editor target, so these are intentionally the
	// initial placement whenever a card editor instance is mounted.
	// svelte-ignore state_referenced_locally
	let targetLocation = $state(roomId);
	// svelte-ignore state_referenced_locally
	let targetColumn = $state(String(column));
	let locationOptions = $derived(
		$hearthConfig.rooms.map((room) => ({ value: room.id, label: room.name }))
	);
	let targetColumnCount = $derived.by(() => {
		const room = $hearthConfig.rooms.find((entry) => entry.id === targetLocation);
		return Math.max(1, room?.columns ?? room?.cards?.length ?? 1);
	});
	let targetColumnOptions = $derived(
		Array.from({ length: targetColumnCount }, (_, columnIndex) => ({
			value: String(columnIndex),
			label: `Column ${columnIndex + 1}`
		}))
	);
	let currentLocationName = $derived(
		$hearthConfig.rooms.find((room) => room.id === roomId)?.name ?? 'Page'
	);
	let currentType = $derived(CARD_GALLERY.find((kind) => kind.value === type) ?? CARD_GALLERY[0]);
	let samePlacement = $derived(
		stackId === undefined && roomId === targetLocation && column === Number(targetColumn)
	);

	function selectTargetLocation(value: string) {
		targetLocation = value;
		targetColumn = '0';
	}

	function selectType(value: OverviewCard['type']) {
		type = value;
		typeOpen = false;
	}

	function moveCard() {
		if (!canMove || samePlacement || index === null) return;
		let newIndex = 0;
		let newColumn = 0;
		updateConfig((config) => {
			const sourceCards = cardList(config);
			if (!sourceCards) return;
			const targetRoom = config.rooms.find((entry) => entry.id === targetLocation);
			if (!targetRoom) return;
			// persist in-progress field edits before the editor.set below remounts
			// the sheet and discards local state
			sourceCards[index] = buildCard(sourceCards[index].id);
			const [card] = sourceCards.splice(index, 1);
			const destinationColumns = ensureRoomCardColumns(targetRoom);
			if (destinationColumns.length === 0) destinationColumns.push([]);
			const destinationColumnIndex = Math.min(
				Math.max(0, Number(targetColumn) || 0),
				Math.max(0, destinationColumns.length - 1)
			);
			newColumn = destinationColumnIndex;
			const destination = destinationColumns[destinationColumnIndex];
			newIndex = destination.length;
			destination.push(card);
		});
		// follow the card, otherwise Done returns to a page it no longer sits on
		currentRoom.set(targetLocation);
		editor.set({ kind: 'card', roomId: targetLocation, column: newColumn, index: newIndex });
	}
</script>

<EditSheet
	title={index !== null ? 'Edit card' : 'Add card'}
	onclose={close}
	ondone={done}
	doneDisabled={type === 'fusion' && advancedOpen && !advancedValid}
	onremove={index !== null ? remove : undefined}
	wide
>
	<div class="card-editor-layout">
		<div class="card-settings">
			<div class="card-actions">
				<button type="button" class="action-button" onclick={() => (typeOpen = true)}>
					<span class="action-icon"><Icon name={currentType.icon} size={20} /></span>
					<span class="action-copy"
						><small>CARD TYPE</small><strong>{currentType.name}</strong></span
					>
					<Icon name="chevron_right" size={20} />
				</button>
				{#if canMove}
					<button type="button" class="action-button" onclick={() => (placementOpen = true)}>
						<span class="action-icon"><Icon name="dashboard" size={20} /></span>
						<span class="action-copy"
							><small>PLACEMENT</small><strong
								>{currentLocationName} · {stackId ? 'Stack' : `Column ${column + 1}`}</strong
							></span
						>
						<Icon name="chevron_right" size={20} />
					</button>
				{/if}
			</div>

			{#if type === 'header' || type === 'entities' || type === 'camera' || type === 'climate' || type === 'scenes'}
				<TextField
					label="Title"
					bind:value={title}
					placeholder={type === 'header' ? 'Home' : 'Lights'}
				/>
			{/if}

			{#if type === 'header'}
				<TextField label="Subtitle" bind:value={subtitle} placeholder="Cozy · curtains open" />
				<IconField label="Icon" bind:value={headerIcon} placeholder="home" />
				<EntityField
					label="Temperature sensor (optional)"
					bind:value={headerTempEntity}
					domains={['sensor']}
				/>
				<EntityField
					label="Humidity sensor (optional)"
					bind:value={headerHumidityEntity}
					domains={['sensor']}
				/>
			{/if}

			{#if type === 'temperature'}
				<TextField label="Label" bind:value={label} placeholder="Average home temperature" />
				<EntityField label="Entity" bind:value={entity} domains={['sensor']} />
				<TextField label="Unit" bind:value={unit} placeholder="°C" />
			{/if}

			{#if type === 'media' || type === 'vacuum' || type === 'camera' || type === 'climate'}
				<EntityField label="Entity" bind:value={entity} domains={entityDomains} />
			{/if}

			{#if type === 'camera'}
				<label class="check">
					<input type="checkbox" bind:checked={cameraStream} />
					<span>Live stream</span>
				</label>
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
				<SelectField
					label="Vertical padding"
					bind:value={gridVerticalPadding}
					options={[
						{ value: '', label: 'Standard' },
						{ value: 'compact', label: 'Compact' }
					]}
				/>
				<label class="check">
					<input type="checkbox" bind:checked={showCount} />
					<span>Show active count in header</span>
				</label>
				<label class="check">
					<input type="checkbox" bind:checked={gridReadonly} />
					<span>Display only (no tile ever sends a command)</span>
				</label>
				<label class="check">
					<input type="checkbox" bind:checked={gridCollapsed} />
					<span>Collapse into a summary row (details in a popover)</span>
				</label>

				{#if gridCollapsed}
					<IconField label="Summary row icon (optional)" bind:value={gridIcon} />
					<TextField
						label="Summary text (optional)"
						bind:value={gridSummary}
						placeholder="5 open · 3 closed"
					/>
					<EntityField label="Summary from entity (optional)" bind:value={gridSummaryEntity} />
					<div class="hint">
						Without either, the row counts the entities that are on. The title names the group.
					</div>
				{/if}

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
							{#if !gridReadonly}
								<label class="check">
									<input type="checkbox" bind:checked={ref.readonly} />
									<span>Display only</span>
								</label>
							{/if}
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
					onclick={() =>
						entities.push({ entity: '', name: '', icon: '', display: '', readonly: false })}
				>
					<Icon name="add" size={18} />
					<span>Add entity</span>
				</div>
			{/if}

			{#if type === 'scenes'}
				<SelectField
					label="Style"
					bind:value={sceneStyle}
					options={[
						{ value: 'chips', label: 'Chips' },
						{ value: 'bar', label: 'Scene bar' }
					]}
				/>
				{#if sceneStyle === 'bar'}
					<div class="hint">
						Equal-width tiles on one row, the active scene lit. Keep it to four scenes so the row
						never scrolls.
					</div>
				{/if}

				<div class="group-label">SCENES</div>
				{#each scenes as ref, refIndex (refIndex)}
					<div class="filter-row">
						<div class="filter-fields">
							<EntityField label="Entity" bind:value={ref.entity} domains={['scene', 'script']} />
							<TextField label="Name (optional)" bind:value={ref.name} />
							<IconField label="Icon (optional)" bind:value={ref.icon} />
							{#if sceneStyle === 'bar'}
								<TextField
									label="Caption (optional)"
									bind:value={ref.caption}
									placeholder="23:00, all off, ..."
								/>
							{/if}
							<EntityField label="Active while entity (optional)" bind:value={ref.active_entity} />
							<TextField
								label="...is in state (optional)"
								bind:value={ref.active_state}
								placeholder="on"
							/>
						</div>
						<span class="remove" onclick={() => scenes.splice(refIndex, 1)}>
							<Icon name="delete" size={20} />
						</span>
					</div>
				{/each}
				<div class="hint">
					Without an indicator entity, the most recently applied scene entity counts as active.
					Scripts always need one, since a script has no activation timestamp.
				</div>
				<div
					class="add-filter"
					onclick={() =>
						scenes.push({
							entity: '',
							name: '',
							icon: '',
							caption: '',
							active_entity: '',
							active_state: ''
						})}
				>
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
					<div
						class="elements-editor pressable"
						use:Ripple={PRESS_RIPPLE}
						onclick={openElementsEditor}
					>
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
		</div>

		<aside class="preview-pane">
			<div class="group-label first">LIVE PREVIEW</div>
			<div class="preview" style="pointer-events: none">
				<CardRenderer card={previewCard} />
			</div>
		</aside>
	</div>

	{#if typeOpen}
		<div class="popup-backdrop" role="presentation" onclick={() => (typeOpen = false)}>
			<div
				class="action-popup"
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-label="Change card type"
				onclick={(event) => event.stopPropagation()}
				onkeydown={(event) => {
					if (event.key === 'Escape') {
						event.stopPropagation();
						typeOpen = false;
					}
				}}
			>
				<div class="popup-header">
					<div>
						<small>STRUCTURE</small>
						<h3>Change card type</h3>
					</div>
					<button type="button" aria-label="Close" onclick={() => (typeOpen = false)}
						><Icon name="close" size={22} /></button
					>
				</div>
				<p class="popup-intro">Choose how this card presents its content.</p>
				<div class="type-gallery">
					{#each CARD_GALLERY as kind (kind.value)}
						<button
							type="button"
							class="type-option"
							class:selected={type === kind.value}
							onclick={() => selectType(kind.value)}
						>
							<span class="type-icon"><Icon name={kind.icon} size={21} /></span>
							<span class="type-copy"
								><span class="type-name">{kind.name}</span><span class="type-sub">{kind.sub}</span
								></span
							>
							{#if type === kind.value}<Icon name="check" size={19} />{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	{#if placementOpen}
		<div class="popup-backdrop" role="presentation" onclick={() => (placementOpen = false)}>
			<div
				class="action-popup placement-popup"
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-label="Move card"
				onclick={(event) => event.stopPropagation()}
				onkeydown={(event) => {
					if (event.key === 'Escape') {
						event.stopPropagation();
						placementOpen = false;
					}
				}}
			>
				<div class="popup-header">
					<div>
						<small>STRUCTURE</small>
						<h3>Move card</h3>
					</div>
					<button type="button" aria-label="Close" onclick={() => (placementOpen = false)}
						><Icon name="close" size={22} /></button
					>
				</div>
				<p class="popup-intro">
					Currently in {currentLocationName} · {stackId ? 'Stack' : `Column ${column + 1}`}.
				</p>
				<div class="placement-controls">
					<SelectField
						label="Page"
						value={targetLocation}
						options={locationOptions}
						onchange={selectTargetLocation}
					/>
					<SelectField label="Position" bind:value={targetColumn} options={targetColumnOptions} />
					<button class="move-button" type="button" disabled={samePlacement} onclick={moveCard}
						><Icon name="drive_file_move" size={18} />Move card</button
					>
				</div>
			</div>
		</div>
	{/if}
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 18px 0 10px;
	}

	.group-label.first {
		margin-top: 0;
	}

	.card-editor-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 0.85fr);
		align-items: start;
		gap: 28px;
	}

	.card-settings,
	.preview-pane {
		min-width: 0;
	}

	.preview-pane {
		position: sticky;
		top: 0;
		align-self: start;
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
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.035);
		color: var(--h-icon);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.action-button:hover {
		border-color: rgb(var(--h-surface-rgb) / 0.16);
		background: rgb(var(--h-surface-rgb) / 0.06);
	}

	.action-icon {
		display: flex;
		padding: 7px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.06);
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
		border: 1px solid rgb(var(--h-surface-rgb) / 0.1);
		border-radius: var(--h-radius-lg);
		background: var(--h-sheet-0);
		box-shadow: 0 24px 70px rgb(0 0 0 / 0.55);
		overflow: auto;
	}

	.action-popup.placement-popup {
		width: min(520px, 100%);
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
		background: rgb(var(--h-surface-rgb) / 0.06);
		color: var(--h-icon);
		cursor: pointer;
	}

	.popup-intro {
		margin: 8px 0 18px;
		color: var(--h-text-6);
		font-size: 13px;
	}

	.placement-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 0 10px;
		padding: 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
	}

	.move-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		grid-column: 1 / -1;
		padding: 10px 14px;
		border: 0;
		border-radius: var(--h-radius-xs);
		background: var(--h-accent-deep);
		color: white;
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.move-button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.type-option {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
		padding: 11px 12px;
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.035);
		color: var(--h-text-4);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.type-option.selected {
		background: rgb(var(--h-accent-rgb) / 0.14);
		border-color: rgb(var(--h-accent-rgb) / 0.3);
		color: var(--h-accent-bright);
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

	.preview {
		background: var(--h-inset);
		border-radius: var(--h-radius-md);
		padding: 14px;
		margin-bottom: 14px;
		max-height: calc(100dvh - 210px);
		overflow: auto;
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
		margin: 4px 0 10px;
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

	@media (max-width: 820px) {
		.card-actions,
		.placement-controls {
			grid-template-columns: 1fr;
		}

		.card-editor-layout {
			grid-template-columns: 1fr;
			gap: 18px;
		}

		.preview-pane {
			grid-row: 1;
			z-index: 2;
			padding: 12px;
			margin: -12px -12px 0;
			background: var(--h-sheet-0);
			border-bottom: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		}

		.preview-pane .group-label {
			display: none;
		}

		.preview {
			max-height: 30dvh;
			margin-bottom: 0;
		}
	}
</style>
