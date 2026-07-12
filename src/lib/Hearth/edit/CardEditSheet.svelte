<script lang="ts">
	import { get } from 'svelte/store';
	import * as yaml from 'js-yaml';
	import {
		FUSION_OBJECT_TYPES,
		OVERVIEW_CARD_TYPES,
		slugify,
		uniqueId,
		type EntityRef,
		type HearthConfig,
		type HearthFilter,
		type OverviewCard
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import Icon from '../Icon.svelte';
	import TextField from './TextField.svelte';
	import SelectField from './SelectField.svelte';
	import YamlField from './YamlField.svelte';

	let { column, index, roomId }: { column: number; index: number | null; roomId?: string } =
		$props();

	// with roomId the sheet edits that room's cards list instead of an
	// overview column; initializes the list on first write
	function cardList(config: HearthConfig): OverviewCard[] | undefined {
		if (roomId === undefined) return config.overview[column];
		const room = config.rooms.find((entry) => entry.id === roomId);
		if (!room) return undefined;
		return (room.cards ??= []);
	}

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? cardList(get(hearthConfig))?.[index] : undefined;

	let type = $state<OverviewCard['type']>(initial?.type ?? 'media');
	let title = $state(initial && 'title' in initial ? (initial.title ?? '') : '');
	let label = $state(initial?.type === 'temperature' ? (initial.label ?? '') : '');
	let unit = $state(initial?.type === 'temperature' ? (initial.unit ?? '') : '°C');
	let entity = $state(initial && 'entity' in initial ? (initial.entity ?? '') : '');
	let pm25Entity = $state(initial?.type === 'air' ? (initial.pm25_entity ?? '') : '');
	let humidityEntity = $state(initial?.type === 'air' ? (initial.humidity_entity ?? '') : '');
	let filters = $state<HearthFilter[]>(
		initial?.type === 'air' ? initial.filters.map((filter) => ({ ...filter })) : []
	);
	let entities = $state<EntityRef[]>(
		initial?.type === 'entities' ? initial.entities.map((ref) => ({ ...ref })) : []
	);
	let scenes = $state<EntityRef[]>(
		initial?.type === 'scenes' ? initial.scenes.map((ref) => ({ ...ref })) : []
	);
	const initialFusion = initial?.type === 'fusion' ? (initial.config ?? {}) : {};
	let fusionType = $state<string>(String(initialFusion.type ?? 'button'));
	let fusionYaml = $state(fusionOptionsToYaml(initialFusion));

	const yamlPlaceholder = 'entity_id: light.living_room\nname: Living Room';

	function fusionOptionsToYaml(config: Record<string, any>) {
		const options = { ...config };
		delete options.type;
		return Object.keys(options).length ? yaml.dump(options) : '';
	}

	function parseFusionYaml(): Record<string, any> | null {
		if (!fusionYaml.trim()) return {};
		try {
			const parsed = yaml.load(fusionYaml);
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
				? (parsed as Record<string, any>)
				: null;
		} catch {
			return null;
		}
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
		if (type === 'lights') return { id, type, title: title.trim() || undefined };
		if (type === 'blinds') return { id, type, title: title.trim() || undefined };
		if (type === 'temperature') {
			return {
				id,
				type,
				label: label.trim() || undefined,
				entity: entity.trim() || undefined,
				unit: unit.trim() || undefined
			};
		}
		if (type === 'air') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				pm25_entity: pm25Entity.trim() || undefined,
				humidity_entity: humidityEntity.trim() || undefined,
				filters: filters
					.map((filter) => ({ label: filter.label.trim(), entity: filter.entity.trim() }))
					.filter((filter) => filter.label && filter.entity)
			};
		}
		if (type === 'entities') {
			return {
				id,
				type,
				title: title.trim() || undefined,
				entities: entities
					.map((ref) => ({
						entity: ref.entity.trim(),
						name: ref.name?.trim() || undefined,
						icon: ref.icon?.trim() || undefined
					}))
					.filter((ref) => ref.entity)
			};
		}
		if (type === 'camera' || type === 'climate') {
			return { id, type, title: title.trim() || undefined, entity: entity.trim() || undefined };
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
					.filter((ref) => ref.entity)
			};
		}
		if (type === 'fusion') {
			return { id, type, config: { type: fusionType, ...(parseFusionYaml() ?? {}) } };
		}
		return { id, type, entity: entity.trim() || undefined };
	}

	function done() {
		updateConfig((config) => {
			const cards = cardList(config);
			if (!cards) return;
			if (index !== null) {
				cards[index] = buildCard(cards[index].id);
			} else {
				const taken = [
					...config.overview.flat(),
					...config.rooms.flatMap((room) => room.cards ?? [])
				].map((card) => card.id);
				cards.push(buildCard(uniqueId(slugify(type), taken)));
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
</script>

<EditSheet
	title={index !== null ? 'Edit card' : 'Add card'}
	onclose={close}
	ondone={done}
	doneDisabled={type === 'fusion' && parseFusionYaml() === null}
	onremove={index !== null ? remove : undefined}
>
	<SelectField label="Type" bind:value={type} options={OVERVIEW_CARD_TYPES} />

	{#if type === 'lights' || type === 'blinds' || type === 'air' || type === 'entities' || type === 'camera' || type === 'climate' || type === 'scenes'}
		<TextField label="Title" bind:value={title} placeholder={type === 'air' ? 'Air' : 'Lights'} />
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
		<div class="group-label">ENTITIES</div>
		{#each entities as ref, refIndex (refIndex)}
			<div class="filter-row">
				<div class="filter-fields">
					<EntityField label="Entity" bind:value={ref.entity} />
					<TextField label="Name (optional)" bind:value={ref.name} />
					<TextField
						label="Icon (optional)"
						bind:value={ref.icon}
						placeholder="Material Symbols name"
					/>
				</div>
				<span class="remove" onclick={() => entities.splice(refIndex, 1)}>
					<Icon name="delete" size={20} />
				</span>
			</div>
		{/each}
		<div class="add-filter" onclick={() => entities.push({ entity: '', name: '', icon: '' })}>
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
					<TextField
						label="Icon (optional)"
						bind:value={ref.icon}
						placeholder="Material Symbols name"
					/>
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
		<SelectField label="Object type" bind:value={fusionType} options={FUSION_OBJECT_TYPES} />
		<YamlField label="Options (YAML)" bind:value={fusionYaml} placeholder={yamlPlaceholder} />
		<div class="hint">
			Options match the original ha-fusion object config for the chosen type, e.g. entity_id, name,
			icon.
		</div>
	{/if}

	{#if type === 'air'}
		<EntityField label="PM2.5 sensor" bind:value={pm25Entity} domains={['sensor']} />
		<EntityField label="Humidity sensor" bind:value={humidityEntity} domains={['sensor']} />

		<div class="group-label">FILTERS</div>
		{#each filters as filter, filterIndex (filterIndex)}
			<div class="filter-row">
				<div class="filter-fields">
					<TextField label="Label" bind:value={filter.label} placeholder="Filter · Bedroom" />
					<EntityField label="Entity" bind:value={filter.entity} domains={['sensor']} />
				</div>
				<span class="remove" onclick={() => filters.splice(filterIndex, 1)}>
					<Icon name="delete" size={20} />
				</span>
			</div>
		{/each}
		<div class="add-filter" onclick={() => filters.push({ label: '', entity: '' })}>
			<Icon name="add" size={18} />
			<span>Add filter</span>
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
