<script lang="ts">
	import { get } from 'svelte/store';
	import * as yaml from 'js-yaml';
	import {
		FUSION_WIDGET_TYPES,
		RAIL_WIDGET_TYPES,
		slugify,
		uniqueId,
		type RailWidget
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import IconField from './IconField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';
	import YamlField from './YamlField.svelte';

	let { index }: { index: number | null } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? get(hearthConfig).rail[index] : undefined;

	let type = $state<RailWidget['type']>(initial?.type ?? 'status');
	let city = $state(initial?.type === 'clock' ? (initial.city ?? '') : '');
	let entity = $state(
		initial &&
			(initial.type === 'weather' || initial.type === 'status' || initial.type === 'entity')
			? (initial.entity ?? '')
			: ''
	);
	let icon = $state(
		initial?.type === 'status' || initial?.type === 'entity' ? (initial.icon ?? '') : ''
	);
	let text = $state(initial?.type === 'status' ? (initial.text ?? '') : '');
	let name = $state(initial?.type === 'entity' ? (initial.name ?? '') : '');
	const initialFusion = initial?.type === 'fusion' ? (initial.config ?? {}) : {};
	let fusionType = $state<string>(String(initialFusion.type ?? 'sensor'));
	let fusionYaml = $state(fusionOptionsToYaml(initialFusion));

	const yamlPlaceholder = 'entity_id: sensor.average_temperature\nname: Home';

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

	function close() {
		editor.set(null);
	}

	function buildWidget(id: string): RailWidget {
		if (type === 'clock') return { id, type, city: city.trim() || undefined };
		if (type === 'weather') return { id, type, entity: entity.trim() || undefined };
		if (type === 'status') {
			return {
				id,
				type,
				icon: icon.trim() || undefined,
				text: text.trim() || undefined,
				entity: entity.trim() || undefined
			};
		}
		if (type === 'entity') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				name: name.trim() || undefined,
				icon: icon.trim() || undefined
			};
		}
		if (type === 'fusion') {
			return { id, type, config: { type: fusionType, ...(parseFusionYaml() ?? {}) } };
		}
		return { id, type: type as 'nav' | 'spacer' };
	}

	function done() {
		updateConfig((config) => {
			if (index !== null) {
				config.rail[index] = buildWidget(config.rail[index].id);
			} else {
				config.rail.push(
					buildWidget(
						uniqueId(
							slugify(type),
							config.rail.map((widget) => widget.id)
						)
					)
				);
			}
		});
		close();
	}

	function remove() {
		updateConfig((config) => {
			if (index !== null) config.rail.splice(index, 1);
		});
		close();
	}
</script>

<EditSheet
	title={index !== null ? 'Edit widget' : 'Add widget'}
	onclose={close}
	ondone={done}
	doneDisabled={type === 'fusion' && parseFusionYaml() === null}
	onremove={index !== null ? remove : undefined}
>
	<SelectField label="Type" bind:value={type} options={RAIL_WIDGET_TYPES} />

	{#if type === 'clock'}
		<TextField label="City" bind:value={city} placeholder="Wrocław" />
	{/if}

	{#if type === 'weather'}
		<EntityField label="Weather entity" bind:value={entity} domains={['weather']} />
	{/if}

	{#if type === 'status'}
		<IconField label="Icon" bind:value={icon} placeholder="eco" />
		<TextField label="Text" bind:value={text} placeholder="All systems nominal" />
		<EntityField label="Entity (optional, appends its state)" bind:value={entity} />
	{/if}

	{#if type === 'entity'}
		<EntityField label="Entity" bind:value={entity} />
		<TextField label="Name (optional)" bind:value={name} />
		<IconField label="Icon (optional)" bind:value={icon} />
	{/if}

	{#if type === 'fusion'}
		<SelectField label="Widget type" bind:value={fusionType} options={FUSION_WIDGET_TYPES} />
		<YamlField label="Options (YAML)" bind:value={fusionYaml} placeholder={yamlPlaceholder} />
		<div class="hint">
			Options match the original ha-fusion sidebar config for the chosen type, e.g. entity_id, name,
			period.
		</div>
	{/if}
</EditSheet>

<style>
	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
	}
</style>
