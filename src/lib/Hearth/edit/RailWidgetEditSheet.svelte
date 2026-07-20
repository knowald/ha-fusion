<script lang="ts">
	import { get } from 'svelte/store';
	import Ripple from '$lib/Actions/ripple';
	import {
		FUSION_WIDGET_TYPES,
		normalizeVisibility,
		PRESS_RIPPLE,
		RAIL_WIDGET_TYPES,
		slugify,
		uniqueId,
		type RailWidget,
		type VisibilityCondition
	} from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import EntityField from './EntityField.svelte';
	import FusionFields, { applyLeftoverYaml, dumpLeftoverYaml } from './FusionFields.svelte';
	import Icon from '../Icon.svelte';
	import IconField from './IconField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';
	import VisibilityField from './VisibilityField.svelte';
	import YamlField from './YamlField.svelte';

	let { index }: { index: number | null } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? get(hearthConfig).rail[index] : undefined;

	let type = $state<RailWidget['type']>(initial?.type ?? 'status');
	let city = $state(initial?.type === 'clock' ? (initial.city ?? '') : '');
	let entity = $state(
		initial &&
			(initial.type === 'weather' ||
				initial.type === 'status' ||
				initial.type === 'entity' ||
				initial.type === 'energy')
			? (initial.entity ?? '')
			: ''
	);
	let icon = $state(
		initial?.type === 'status' || initial?.type === 'entity' || initial?.type === 'progress'
			? (initial.icon ?? '')
			: ''
	);
	let text = $state(
		initial?.type === 'status' || initial?.type === 'label' ? (initial.text ?? '') : ''
	);
	let name = $state(
		initial?.type === 'entity' || initial?.type === 'progress' ? (initial.name ?? '') : ''
	);
	let price = $state(
		initial?.type === 'energy' && typeof initial.price === 'number' ? String(initial.price) : ''
	);
	let priceEntity = $state(initial?.type === 'energy' ? (initial.price_entity ?? '') : '');
	let currency = $state(initial?.type === 'energy' ? (initial.currency ?? '') : '');
	let statusEntity = $state(initial?.type === 'progress' ? (initial.status_entity ?? '') : '');
	let progressEntity = $state(initial?.type === 'progress' ? (initial.progress_entity ?? '') : '');
	let remainingEntity = $state(
		initial?.type === 'progress' ? (initial.remaining_entity ?? '') : ''
	);
	let activeStates = $state(
		initial?.type === 'progress' ? (initial.active_states ?? []).join(', ') : ''
	);
	let calendarEntities = $state(
		initial?.type === 'calendar' ? (initial.entities ?? []).join(', ') : ''
	);
	let travelEntity = $state(initial?.type === 'calendar' ? (initial.travel_entity ?? '') : '');
	let lookaheadHours = $state(
		initial?.type === 'calendar' && typeof initial.lookahead_hours === 'number'
			? String(initial.lookahead_hours)
			: ''
	);
	let hideMobile = $state(initial?.hide_mobile ?? false);
	let visibility = $state<VisibilityCondition[]>(
		(initial?.visibility ?? []).map((condition) => ({ ...condition }))
	);
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
		const visibilityValue = normalizeVisibility($state.snapshot(visibility));
		if (type === 'clock') {
			return { id, type, city: city.trim() || undefined, hide_mobile, visibility: visibilityValue };
		}
		if (type === 'weather') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'label') {
			return { id, type, text: text.trim() || undefined, hide_mobile, visibility: visibilityValue };
		}
		if (type === 'energy') {
			const parsedPrice = parseFloat(price);
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
				price_entity: priceEntity.trim() || undefined,
				currency: currency.trim() || undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'progress') {
			const parsedStates = activeStates
				.split(',')
				.map((state) => state.trim())
				.filter(Boolean);
			return {
				id,
				type,
				name: name.trim() || undefined,
				icon: icon.trim() || undefined,
				status_entity: statusEntity.trim() || undefined,
				progress_entity: progressEntity.trim() || undefined,
				remaining_entity: remainingEntity.trim() || undefined,
				active_states: parsedStates.length ? parsedStates : undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'calendar') {
			const parsedHours = parseFloat(lookaheadHours);
			return {
				id,
				type,
				entities: calendarEntities
					.split(',')
					.map((calendarEntity) => calendarEntity.trim())
					.filter(Boolean),
				travel_entity: travelEntity.trim() || undefined,
				lookahead_hours: Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'status') {
			return {
				id,
				type,
				icon: icon.trim() || undefined,
				text: text.trim() || undefined,
				entity: entity.trim() || undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'entity') {
			return {
				id,
				type,
				entity: entity.trim() || undefined,
				name: name.trim() || undefined,
				icon: icon.trim() || undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'fusion') {
			return {
				id,
				type,
				config: { type: fusionType, ...$state.snapshot(fusionOptions) },
				hide_mobile,
				visibility: visibilityValue
			};
		}
		return { id, type: type as 'nav' | 'spacer', hide_mobile, visibility: visibilityValue };
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

	{#if type === 'label'}
		<TextField label="Text" bind:value={text} placeholder="TODAY" />
	{/if}

	{#if type === 'energy'}
		<EntityField
			label="Energy sensor (today total or increasing)"
			bind:value={entity}
			domains={['sensor']}
		/>
		<TextField label="Price per kWh (optional)" bind:value={price} placeholder="0.72" />
		<EntityField
			label="Price entity (optional, overrides static price)"
			bind:value={priceEntity}
			domains={['sensor', 'input_number']}
		/>
		<TextField label="Currency label (optional)" bind:value={currency} placeholder="zł" />
	{/if}

	{#if type === 'progress'}
		<TextField label="Name" bind:value={name} placeholder="Washer" />
		<IconField label="Icon (optional)" bind:value={icon} placeholder="local_laundry_service" />
		<EntityField label="Status entity" bind:value={statusEntity} />
		<EntityField label="Progress entity (0-100, optional)" bind:value={progressEntity} />
		<EntityField
			label="Remaining time entity (minutes or timestamp, optional)"
			bind:value={remainingEntity}
		/>
		<TextField
			label="Active states (comma separated, optional)"
			bind:value={activeStates}
			placeholder="running, rinse, spin"
		/>
		<div class="hint">
			Row is visible only while the status entity is active. Without an explicit list, common idle
			states (idle, off, standby, docked, ...) hide it.
		</div>
	{/if}

	{#if type === 'calendar'}
		<TextField
			label="Calendar entities (comma separated)"
			bind:value={calendarEntities}
			placeholder="calendar.family, calendar.work"
		/>
		<EntityField
			label="Travel time entity (minutes, optional)"
			bind:value={travelEntity}
			domains={['sensor']}
		/>
		<TextField label="Look-ahead hours (default 24)" bind:value={lookaheadHours} placeholder="24" />
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

	<VisibilityField bind:value={visibility} />
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
