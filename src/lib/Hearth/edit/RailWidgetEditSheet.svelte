<script lang="ts">
	import { get } from 'svelte/store';
	import Ripple from '$lib/Actions/ripple';
	import {
		FUSION_WIDGET_TYPES,
		PRESS_RIPPLE,
		RAIL_WIDGET_TYPES,
		slugify,
		uniqueId,
		type RailWidget
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import FusionFields, { applyLeftoverYaml, dumpLeftoverYaml } from './FusionFields.svelte';
	import Icon from '../Icon.svelte';
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
	let hideMobile = $state(initial?.hide_mobile ?? false);
	const initialFusion = initial?.type === 'fusion' ? (initial.config ?? {}) : {};
	let fusionType = $state<string>(String(initialFusion.type ?? 'sensor'));
	let fusionOptions = $state<Record<string, any>>(withoutType(initialFusion));
	let advancedOpen = $state(false);
	let advancedYaml = $state('');
	let advancedValid = $state(true);

	const yamlPlaceholder = 'entity_id: sensor.average_temperature\nname: Home';

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

	function close() {
		editor.set(null);
	}

	function buildWidget(id: string): RailWidget {
		const hide_mobile = hideMobile || undefined;
		if (type === 'clock') return { id, type, city: city.trim() || undefined, hide_mobile };
		if (type === 'weather') return { id, type, entity: entity.trim() || undefined, hide_mobile };
		if (type === 'status') {
			return {
				id,
				type,
				icon: icon.trim() || undefined,
				text: text.trim() || undefined,
				entity: entity.trim() || undefined,
				hide_mobile
			};
		}
		if (type === 'entity') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				name: name.trim() || undefined,
				icon: icon.trim() || undefined,
				hide_mobile
			};
		}
		if (type === 'fusion') {
			return {
				id,
				type,
				config: { type: fusionType, ...$state.snapshot(fusionOptions) },
				hide_mobile
			};
		}
		return { id, type: type as 'nav' | 'spacer', hide_mobile };
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
	doneDisabled={type === 'fusion' && advancedOpen && !advancedValid}
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
		<SelectField
			label="Widget type"
			bind:value={fusionType}
			options={FUSION_WIDGET_TYPES}
			onchange={() => advancedOpen && resetAdvancedYaml()}
		/>
		<FusionFields type={fusionType} bind:options={fusionOptions} />
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
				Options match the original ha-fusion sidebar config for the chosen type, e.g. entity_id,
				name, period.
			</div>
		{/if}
	{/if}

	<label class="check">
		<input type="checkbox" bind:checked={hideMobile} />
		<span>Hide on mobile</span>
	</label>
</EditSheet>

<style>
	.advanced-toggle {
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

	.advanced-toggle:hover {
		color: var(--h-text-3);
	}

	.hint {
		font-size: 12px;
		color: var(--h-text-6);
		margin: 4px 0 12px;
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
</style>
