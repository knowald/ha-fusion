<script lang="ts">
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { loadIcons } from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import {
		ensureRoomCardColumns,
		FUSION_OBJECT_TYPES,
		findOverviewCard,
		findOverviewItemList,
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
		type OverviewItem,
		type VisibilityCondition
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import { openModal } from '$lib/Modals';
	import { icons as pictureElementsIcons } from '$lib/Modal/PictureElements/icons';
	import CardPreview from './CardPreview.svelte';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import FusionFields, { applyLeftoverYaml, dumpLeftoverYaml } from './FusionFields.svelte';
	import FormSection from './FormSection.svelte';
	import Icon from '../Icon.svelte';
	import IconField from './IconField.svelte';
	import TextField from './TextField.svelte';
	import SelectField from './SelectField.svelte';
	import VisibilityField from './VisibilityField.svelte';
	import YamlField from './YamlField.svelte';

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

	// display widened to string so the per-entity select can hold '' for
	// "follow the card style"; narrowed back to the union in buildCard
	type EditableRef = {
		entity: string;
		name?: string;
		icon?: string;
		display?: string;
		readonly?: boolean;
		slider_updates?: string;
	};
	type EditableVacuumMode = {
		entity: string;
		name?: string;
		icon?: string;
		detail?: string;
		duration?: string;
		default?: boolean;
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
	// blank means the type's own default: media and sensor cards fill, the rest
	// size to their content
	let fill = $state<string>(
		initial && 'fill' in initial && typeof initial.fill === 'number' ? String(initial.fill) : ''
	);
	// blank means "size to content" for a fusion embed, or "fill the column" for
	// the two cards that stretch
	let height = $state<string>(
		initial && 'height' in initial && initial.height ? String(initial.height) : ''
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
	let gridWildcard = $state(initial?.type === 'entities' ? (initial.wildcard ?? '') : '');
	let gridSliderUpdates = $state(
		initial?.type === 'entities' ? (initial.slider_updates ?? 'continuous') : 'continuous'
	);
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
					readonly: ref.readonly ?? false,
					slider_updates: ref.slider_updates ?? ''
				}))
			: []
	);
	let entitiesOpen = $state(true);
	let expandedEntityRows = $state<number[]>([]);
	let vacuumModes = $state<EditableVacuumMode[]>(
		initial?.type === 'vacuum'
			? (initial.modes ?? []).map((ref) => ({
					entity: ref.entity ?? '',
					name: ref.name ?? '',
					icon: ref.icon ?? '',
					detail: ref.detail ?? '',
					duration: ref.duration ?? '',
					default: ref.default ?? false
				}))
			: []
	);
	let vacuumBatteryEntity = $state(
		initial?.type === 'vacuum' ? (initial.battery_entity ?? '') : ''
	);
	let vacuumBinEntity = $state(initial?.type === 'vacuum' ? (initial.bin_entity ?? '') : '');
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

	// only one mode carries the tag, so checking a row clears the rest
	function setDefaultMode(index: number, checked: boolean) {
		vacuumModes = vacuumModes.map((mode, position) => ({
			...mode,
			default: checked && position === index
		}));
	}

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
					: type === 'image'
						? ['image']
						: type === 'climate'
							? ['climate']
							: ['sensor']
	);

	function close() {
		editor.set(null);
	}

	function buildKnownCard(id: string): OverviewCard {
		const visibilityValue = normalizeVisibility($state.snapshot(visibility));
		const heightValue = parseInt(height, 10);
		const cardHeight = Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined;
		const fillValue = fill === '' ? undefined : Number(fill);
		const cardFill = Number.isFinite(fillValue as number) ? fillValue : undefined;
		if (type === 'header') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				subtitle: subtitle.trim() || undefined,
				icon: headerIcon.trim() || undefined,
				temp_entity: headerTempEntity.trim() || undefined,
				humidity_entity: headerHumidityEntity.trim() || undefined,
				fill: cardFill,
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
				height: cardHeight,
				fill: cardFill,
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
				wildcard: gridWildcard.trim() || undefined,
				slider_updates:
					gridSliderUpdates === 'release' || gridSliderUpdates === 'continuous'
						? gridSliderUpdates
						: undefined,
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
						readonly: ref.readonly || undefined,
						slider_updates:
							ref.slider_updates === 'continuous' || ref.slider_updates === 'release'
								? ref.slider_updates
								: undefined
					}))
					.filter((ref) => ref.entity),
				fill: cardFill,
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
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		if (type === 'image') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		if (type === 'climate') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				entity: entity.trim() || undefined,
				fill: cardFill,
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
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		if (type === 'fusion') {
			return {
				id,
				type,
				config: { type: fusionType, ...$state.snapshot(fusionOptions) },
				height: cardHeight,
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		if (type === 'media') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				height: cardHeight,
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		if (type === 'vacuum') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				modes: vacuumModes
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined,
						detail: ref.detail?.trim() || undefined,
						duration: ref.duration?.trim() || undefined,
						default: ref.default || undefined
					}))
					.filter((ref) => ref.entity),
				battery_entity: vacuumBatteryEntity.trim() || undefined,
				bin_entity: vacuumBinEntity.trim() || undefined,
				fill: cardFill,
				visibility: visibilityValue
			};
		}
		return { id, type, entity: entity.trim() || undefined, visibility: visibilityValue };
	}

	function buildCard(id: string): OverviewCard {
		// Unknown extension keys survive a no-op form edit. Switching type starts
		// a new schema and intentionally leaves type-specific extensions behind.
		return {
			...(initial?.type === type ? initial : {}),
			...buildKnownCard(id)
		} as OverviewCard;
	}

	let previewCard = $derived.by(() => buildCard('preview'));

	function reorderPreviewEntities(reordered: EntityRef[]) {
		// buildCard filters incomplete rows out of the preview. Keep those rows in
		// place in the form while applying the preview's order to the valid ones.
		const positions = entities.flatMap((ref, position) => (ref.entity.trim() ? [position] : []));
		if (positions.length !== reordered.length) return;
		const next = entities.map((ref) => ({ ...ref }));
		for (const [order, position] of positions.entries()) {
			const ref = reordered[order];
			next[position] = {
				entity: ref.entity,
				name: ref.name ?? '',
				icon: ref.icon ?? '',
				display: ref.display ?? '',
				readonly: ref.readonly ?? false,
				slider_updates: ref.slider_updates ?? ''
			};
		}
		entities = next;
		expandedEntityRows = [];
	}

	function toggleEntityRow(index: number) {
		expandedEntityRows = expandedEntityRows.includes(index)
			? expandedEntityRows.filter((entry) => entry !== index)
			: [...expandedEntityRows, index];
	}

	function moveEntityRow(index: number, direction: -1 | 1) {
		moveItem(entities, index, direction);
		expandedEntityRows = [];
	}

	function removeEntityRow(index: number) {
		entities.splice(index, 1);
		expandedEntityRows = expandedEntityRows
			.filter((entry) => entry !== index)
			.map((entry) => (entry > index ? entry - 1 : entry));
	}

	function addEntityRow() {
		entities.push({
			entity: '',
			name: '',
			icon: '',
			display: '',
			readonly: false,
			slider_updates: ''
		});
		entitiesOpen = true;
		expandedEntityRows = [entities.length - 1];
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

	let currentType = $derived(
		OVERVIEW_CARD_TYPES.find((kind) => kind.value === type) ?? OVERVIEW_CARD_TYPES[0]
	);

	function selectType(value: OverviewCard['type']) {
		type = value;
		typeOpen = false;
	}
</script>

<EditSheet
	title={id !== null ? 'Edit card' : 'Add card'}
	onclose={close}
	ondone={done}
	doneDisabled={type === 'fusion' && advancedOpen && !advancedValid}
	onremove={id !== null ? remove : undefined}
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
			</div>

			{#if type === 'header' || type === 'entities' || type === 'camera' || type === 'image' || type === 'climate' || type === 'scenes'}
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

			{#if type === 'media' || type === 'vacuum' || type === 'camera' || type === 'image' || type === 'climate'}
				<EntityField label="Entity" bind:value={entity} domains={entityDomains} />
			{/if}

			{#if type === 'vacuum'}
				<EntityField
					label="Battery entity (optional)"
					bind:value={vacuumBatteryEntity}
					domains={['sensor']}
				/>
				<EntityField
					label="Dustbin entity (optional)"
					bind:value={vacuumBinEntity}
					domains={['sensor']}
				/>
				<div class="group-label">CLEANING MODES</div>
				<div class="hint">
					Button entities launched from the vacuum popover, in display order. Each runs on a single
					tap, so give every mode the rooms it covers and how long it takes.
				</div>
				{#each vacuumModes as mode, modeIndex (modeIndex)}
					<div class="filter-row">
						<div class="filter-fields">
							<EntityField label="Button entity" bind:value={mode.entity} domains={['button']} />
							<TextField label="Name (optional)" bind:value={mode.name} />
							<IconField label="Icon (optional)" bind:value={mode.icon} />
							<TextField
								label="Covers (optional)"
								bind:value={mode.detail}
								placeholder="Living + Bedroom"
							/>
							<TextField
								label="Duration (optional)"
								bind:value={mode.duration}
								placeholder="26 min"
							/>
							<label class="check">
								<input
									type="checkbox"
									checked={mode.default ?? false}
									onchange={(event) => setDefaultMode(modeIndex, event.currentTarget.checked)}
								/>
								<span>Recommended mode</span>
							</label>
						</div>
						<span class="remove" onclick={() => vacuumModes.splice(modeIndex, 1)}>
							<Icon name="delete" size={20} />
						</span>
					</div>
				{/each}
				<div
					class="add-filter"
					onclick={() =>
						vacuumModes.push({
							entity: '',
							name: '',
							icon: '',
							detail: '',
							duration: '',
							default: false
						})}
				>
					<Icon name="add" size={18} />
					<span>Add cleaning mode</span>
				</div>
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
				<SelectField
					label="Slider commands"
					bind:value={gridSliderUpdates}
					options={[
						{ value: 'continuous', label: 'While dragging' },
						{ value: 'release', label: 'On release' }
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
				<TextField
					label="Entity wildcard (optional)"
					bind:value={gridWildcard}
					placeholder="light.kitchen_*"
				/>
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

				<button
					type="button"
					class="entities-section-toggle"
					aria-expanded={entitiesOpen}
					onclick={() => (entitiesOpen = !entitiesOpen)}
				>
					<span class="group-label">ENTITIES</span>
					<span class="entities-count">{entities.length}</span>
					<Icon name={entitiesOpen ? 'expand_less' : 'expand_more'} size={19} />
				</button>
				{#if entitiesOpen}
					<div class="entity-editors">
						{#each entities as ref, refIndex (refIndex)}
							<div class="filter-row entity-editor-row">
								<div class="entity-row-header">
									<button
										type="button"
										class="entity-row-toggle"
										aria-expanded={expandedEntityRows.includes(refIndex)}
										onclick={() => toggleEntityRow(refIndex)}
									>
										<Icon
											name={expandedEntityRows.includes(refIndex) ? 'expand_more' : 'chevron_right'}
											size={19}
										/>
										<span class="entity-row-copy">
											<strong>{ref.name?.trim() || ref.entity.trim() || 'New entity'}</strong>
											{#if ref.name?.trim() && ref.entity.trim()}<small>{ref.entity}</small>{/if}
										</span>
									</button>
									<span class="entity-row-actions">
										<button
											type="button"
											class="reorder"
											disabled={refIndex === 0}
											aria-label="Move entity up"
											onclick={() => moveEntityRow(refIndex, -1)}
										>
											<Icon name="keyboard_arrow_up" size={20} />
										</button>
										<button
											type="button"
											class="reorder"
											disabled={refIndex === entities.length - 1}
											aria-label="Move entity down"
											onclick={() => moveEntityRow(refIndex, 1)}
										>
											<Icon name="keyboard_arrow_down" size={20} />
										</button>
										<button
											type="button"
											class="remove"
											aria-label="Remove entity"
											onclick={() => removeEntityRow(refIndex)}
										>
											<Icon name="delete" size={20} />
										</button>
									</span>
								</div>
								{#if expandedEntityRows.includes(refIndex)}
									<div class="filter-fields entity-row-fields">
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
										<SelectField
											label="Slider commands"
											bind:value={ref.slider_updates}
											options={[
												{ value: '', label: 'Card setting' },
												{ value: 'continuous', label: 'While dragging' },
												{ value: 'release', label: 'On release' }
											]}
										/>
										{#if !gridReadonly}
											<label class="check">
												<input type="checkbox" bind:checked={ref.readonly} />
												<span>Display only</span>
											</label>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
						<div class="add-filter" onclick={addEntityRow}>
							<Icon name="add" size={18} />
							<span>Add entity</span>
						</div>
					</div>
				{/if}
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

			<FormSection title="LAYOUT">
				<SelectField
					label="Fill leftover height"
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
					Cards sharing a column split whatever height is left over, in proportion to their shares.
					Only visible on a page set to fill the screen, or when a column is taller than its cards.
				</div>

				{#if type === 'temperature' || type === 'media' || type === 'fusion'}
					<TextField label="Height in px (optional)" bind:value={height} placeholder="240" />
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
			onentitiesreorder={type === 'entities' ? reorderPreviewEntities : undefined}
		/>
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
					{#each OVERVIEW_CARD_TYPES as kind (kind.value)}
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
</EditSheet>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 18px 0 10px;
	}

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

	.entities-section-toggle {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 8px;
		margin: 18px 0 10px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--h-label);
		font: inherit;
		cursor: pointer;
	}

	.entities-section-toggle .group-label {
		margin: 0;
	}

	.entities-count {
		padding: 2px 6px;
		border-radius: 999px;
		background: rgb(var(--h-surface-rgb) / calc(0.07 * var(--h-fill-scale)));
		color: var(--h-text-6);
		font-family: var(--h-font-mono);
		font-size: 10px;
	}

	.entities-section-toggle > :global(.mi) {
		margin-left: auto;
	}

	.entity-editors {
		display: flex;
		flex-direction: column;
	}

	.filter-row.entity-editor-row {
		display: block;
		padding: 0;
		overflow: hidden;
	}

	.entity-row-header {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 6px 8px 6px 6px;
	}

	.entity-row-toggle {
		display: flex;
		align-items: center;
		flex: 1;
		gap: 7px;
		min-width: 0;
		padding: 5px;
		border: 0;
		background: none;
		color: var(--h-icon);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.entity-row-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.entity-row-copy strong,
	.entity-row-copy small {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entity-row-copy strong {
		color: var(--h-text-3);
		font-size: 13px;
		font-weight: 550;
	}

	.entity-row-copy small {
		color: var(--h-text-6);
		font-size: 10.5px;
	}

	.entity-row-actions {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.entity-row-actions button {
		display: flex;
		padding: 4px;
		border: 0;
		background: none;
	}

	.entity-row-actions button:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.entity-row-actions .remove {
		margin: 0 0 0 2px;
	}

	.entity-row-fields {
		padding: 0 12px 8px 39px;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.05 * var(--h-line-scale)));
	}

	.remove {
		color: var(--h-icon);
		cursor: pointer;
		margin-top: 32px;
	}

	.remove:hover {
		color: var(--h-bad-text);
	}

	.reorder {
		color: var(--h-icon);
		cursor: pointer;
		display: inline-flex;
	}

	.reorder:hover {
		color: var(--h-text-2);
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
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
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
		.card-actions {
			grid-template-columns: 1fr;
		}

		.card-editor-layout {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
</style>
