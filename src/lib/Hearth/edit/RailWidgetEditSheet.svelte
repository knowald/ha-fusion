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
	import EntityField from './EntityField.svelte';
	import RailWidgetRenderer from '../RailWidgetRenderer.svelte';
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
	let entityVerticalPadding = $state(
		initial?.type === 'entity' ? (initial.vertical_padding ?? '') : ''
	);
	let price = $state(
		initial?.type === 'energy' && typeof initial.price === 'number' ? String(initial.price) : ''
	);
	let priceEntity = $state(initial?.type === 'energy' ? (initial.price_entity ?? '') : '');
	let currency = $state(initial?.type === 'energy' ? (initial.currency ?? '') : '');
	let statusEntity = $state(initial?.type === 'progress' ? (initial.status_entity ?? '') : '');
	let progressEntity = $state(initial?.type === 'progress' ? (initial.progress_entity ?? '') : '');
	let progressUnit = $state(initial?.type === 'progress' ? (initial.unit ?? '') : '');
	let remainingEntity = $state(
		initial?.type === 'progress' ? (initial.remaining_entity ?? '') : ''
	);
	let activeStates = $state(
		initial?.type === 'progress' ? (initial.active_states ?? []).join(', ') : ''
	);
	let completedStates = $state(
		initial?.type === 'progress'
			? (initial.completed_states ?? ['complete', 'completed', 'finished', 'done']).join(', ')
			: 'complete, completed, finished, done'
	);
	let completionDelay = $state(
		initial?.type === 'progress' ? String(initial.completion_delay_minutes ?? 15) : '15'
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
	let height = $state<string>(
		initial?.type === 'fusion' && initial.height ? String(initial.height) : ''
	);
	const initialFusion = initial?.type === 'fusion' ? (initial.config ?? {}) : {};
	let fusionType = $state<string>(String(initialFusion.type ?? 'sensor'));
	let fusionOptions = $state<Record<string, any>>(withoutType(initialFusion));
	let advancedOpen = $state(false);
	let advancedYaml = $state('');
	let advancedValid = $state(true);
	let search = $state('');
	// svelte-ignore state_referenced_locally
	let conditionsOpen = $state(visibility.length > 0);
	let confirmRemove = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout>;

	const yamlPlaceholder = 'entity_id: sensor.average_temperature\nname: Home';

	let filteredGallery = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return RAIL_WIDGET_TYPES;
		return RAIL_WIDGET_TYPES.filter(
			(kind) => kind.name.toLowerCase().includes(query) || kind.sub.toLowerCase().includes(query)
		);
	});

	let alwaysVisible = $derived(!hideMobile && visibility.length === 0);

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

	function setAlwaysVisible() {
		hideMobile = false;
		visibility = [];
		conditionsOpen = false;
	}

	function scrollSelectedIntoView(node: HTMLElement, selected: boolean) {
		if (selected) node.scrollIntoView({ block: 'nearest' });
	}

	function close() {
		editor.set(null);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			close();
		}
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
			const parsedCompletedStates = completedStates
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
				unit: progressUnit.trim() || undefined,
				remaining_entity: remainingEntity.trim() || undefined,
				active_states: parsedStates.length ? parsedStates : undefined,
				completed_states: parsedCompletedStates.length ? parsedCompletedStates : undefined,
				completion_delay_minutes: Number(completionDelay),
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
				vertical_padding: entityVerticalPadding === 'compact' ? 'compact' : undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		if (type === 'fusion') {
			const heightValue = parseInt(height, 10);
			return {
				id,
				type,
				config: { type: fusionType, ...$state.snapshot(fusionOptions) },
				height: Number.isFinite(heightValue) && heightValue >= 40 ? heightValue : undefined,
				hide_mobile,
				visibility: visibilityValue
			};
		}
		return { id, type: type as 'nav' | 'spacer', hide_mobile, visibility: visibilityValue };
	}

	let previewWidget = $derived.by(() => buildWidget('preview'));
	let doneDisabled = $derived(type === 'fusion' && advancedOpen && !advancedValid);

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
		clearTimeout(confirmTimer);
		if (!confirmRemove) {
			confirmRemove = true;
			confirmTimer = setTimeout(() => (confirmRemove = false), 4000);
			return;
		}
		updateConfig((config) => {
			if (index !== null) config.rail.splice(index, 1);
		});
		close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" onclick={close}>
	<div class="sheet" onclick={(event) => event.stopPropagation()}>
		<div class="header">
			<div class="title">{index !== null ? 'Edit widget' : 'Add widget'}</div>
			<div
				class="button primary pressable"
				class:disabled={doneDisabled}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => !doneDisabled && done()}
			>
				{index !== null ? 'Save' : 'Add'}
			</div>
			<span class="icon-button" onclick={close}><Icon name="close" size={22} /></span>
		</div>
		<div class="body">
			<div class="gallery">
				<label class="search">
					<Icon name="search" size={17} />
					<input type="text" bind:value={search} placeholder="Search widgets" spellcheck="false" />
				</label>
				{#each filteredGallery as kind (kind.value)}
					<div
						class="kind pressable"
						class:selected={type === kind.value}
						use:Ripple={PRESS_RIPPLE}
						use:scrollSelectedIntoView={type === kind.value}
						onclick={() => (type = kind.value)}
					>
						<span class="kind-icon"><Icon name={kind.icon} size={20} /></span>
						<div>
							<div class="kind-name">{kind.name}</div>
							<div class="kind-sub">{kind.sub}</div>
						</div>
					</div>
				{:else}
					<div class="no-results">No widgets match</div>
				{/each}
			</div>
			<div class="config">
				<div class="preview-well" style="pointer-events: none">
					{#if type === 'spacer'}
						<div class="preview-note">Flexible gap - pushes the widgets around it apart</div>
					{:else}
						<RailWidgetRenderer widget={previewWidget} />
					{/if}
				</div>

				{#if type === 'clock'}
					<TextField label="City" bind:value={city} placeholder="City name" />
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
					<div class="row">
						<div class="grow">
							<TextField label="Name" bind:value={name} placeholder="Washer" />
						</div>
						<div class="icon-column">
							<IconField label="Icon" bind:value={icon} placeholder="local_laundry_service" />
						</div>
					</div>
					<EntityField label="Status entity" bind:value={statusEntity} />
					<EntityField label="Progress entity (0-100, optional)" bind:value={progressEntity} />
					<TextField
						label="Progress unit (optional, shows the value with this suffix)"
						bind:value={progressUnit}
						placeholder="%"
					/>
					<EntityField
						label="Remaining time entity (minutes or timestamp, optional)"
						bind:value={remainingEntity}
					/>
					<TextField
						label="Active states (comma separated, optional)"
						bind:value={activeStates}
						placeholder="running, rinse, spin"
					/>
					<TextField
						label="Completed states (comma separated)"
						bind:value={completedStates}
						placeholder="complete, completed, finished, done"
					/>
					<SelectField
						label="After completion"
						bind:value={completionDelay}
						options={[
							{ value: '0', label: 'Hide immediately' },
							{ value: '5', label: 'Hide after 5 minutes' },
							{ value: '15', label: 'Hide after 15 minutes' },
							{ value: '30', label: 'Hide after 30 minutes' },
							{ value: '60', label: 'Hide after 1 hour' },
							{ value: '-1', label: 'Keep until tapped' }
						]}
					/>
					<div class="hint">
						Completed rows can be tapped to dismiss early. Without an explicit active-state list,
						common idle states (idle, off, standby, docked, ...) hide the row.
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
					<TextField
						label="Look-ahead hours (default 24)"
						bind:value={lookaheadHours}
						placeholder="24"
					/>
				{/if}

				{#if type === 'status'}
					<div class="row">
						<div class="grow">
							<TextField label="Text" bind:value={text} placeholder="All systems nominal" />
						</div>
						<div class="icon-column">
							<IconField label="Icon" bind:value={icon} placeholder="eco" />
						</div>
					</div>
					<EntityField label="Entity (optional, appends its state)" bind:value={entity} />
				{/if}

				{#if type === 'entity'}
					<EntityField label="Entity" bind:value={entity} />
					<div class="row">
						<div class="grow">
							<TextField label="Name (optional)" bind:value={name} />
						</div>
						<div class="icon-column">
							<IconField label="Icon (optional)" bind:value={icon} />
						</div>
					</div>
					<SelectField
						label="Vertical padding"
						bind:value={entityVerticalPadding}
						options={[
							{ value: '', label: 'Standard' },
							{ value: 'compact', label: 'Compact' }
						]}
					/>
				{/if}

				{#if type === 'fusion'}
					<SelectField
						label="Widget type"
						bind:value={fusionType}
						options={FUSION_WIDGET_TYPES}
						onchange={() => advancedOpen && resetAdvancedYaml()}
					/>
					<FusionFields type={fusionType} bind:options={fusionOptions} />
					<TextField label="Height in px (optional)" bind:value={height} placeholder="120" />
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
							Options match the original ha-fusion sidebar config for the chosen type, e.g.
							entity_id, name, period.
						</div>
					{/if}
				{/if}

				<div class="chips">
					<span
						class="chip pressable"
						class:active={alwaysVisible}
						use:Ripple={PRESS_RIPPLE}
						onclick={setAlwaysVisible}
					>
						<Icon name="visibility" size={16} />
						Always visible
					</span>
					<span
						class="chip pressable"
						class:active={hideMobile}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => (hideMobile = !hideMobile)}
					>
						<Icon name="smartphone" size={16} />
						Hide on mobile
					</span>
					<span
						class="chip pressable"
						class:active={visibility.length > 0 || conditionsOpen}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => (conditionsOpen = !conditionsOpen)}
					>
						<Icon name="rule" size={16} />
						Conditions{visibility.length ? ` (${visibility.length})` : ''}
					</span>
				</div>

				{#if conditionsOpen}
					<VisibilityField bind:value={visibility} />
				{/if}

				{#if index !== null}
					<div
						class="button danger pressable"
						class:confirm={confirmRemove}
						use:Ripple={PRESS_RIPPLE}
						onclick={remove}
					>
						{confirmRemove ? 'Remove - are you sure?' : 'Remove'}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 60;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet {
		width: min(720px, calc(100vw - 32px));
		height: min(680px, calc(100vh - 48px));
		display: flex;
		flex-direction: column;
		background: radial-gradient(600px 400px at 25% -10%, var(--h-sheet-0), var(--h-sheet-1) 60%);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		border-radius: var(--h-radius-xl);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 22px 28px 18px;
	}

	.title {
		flex: 1;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.3px;
		color: var(--h-text-1);
	}

	.icon-button {
		color: var(--h-icon);
		cursor: pointer;
		padding: 8px;
		transition: transform 120ms ease;
	}

	.icon-button:active {
		transform: scale(0.9);
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.body {
		display: flex;
		flex: 1;
		min-height: 0;
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	.gallery {
		width: 248px;
		flex: none;
		border-right: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		padding: 18px 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-y: auto;
	}

	.search {
		flex: none;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 9px 12px;
		border-radius: 11px;
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
		color: var(--h-text-6);
		margin-bottom: 8px;
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		outline: none;
		font-family: inherit;
		font-size: 13px;
		color: var(--h-text-2);
	}

	.search input::placeholder {
		color: var(--h-text-6);
	}

	.kind {
		/* the gallery is a column flex scroll container - without this, the
		   ripple action's overflow:hidden drops the pressed row's automatic
		   min-size and it collapses mid-tap, so the release misses the row */
		flex: none;
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 11px 12px;
		border-radius: var(--h-radius-xs);
		border: 1px solid transparent;
		color: var(--h-text-3);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.kind-icon {
		color: var(--h-icon);
	}

	.kind-name {
		font-size: 14px;
		font-weight: 500;
	}

	.kind-sub {
		font-size: 11px;
		color: var(--h-text-6);
	}

	.kind.selected {
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.3 * var(--h-accent-scale)));
	}

	.kind.selected .kind-icon,
	.kind.selected .kind-name {
		color: var(--h-accent-icon);
	}

	.kind.selected .kind-name {
		font-weight: 600;
	}

	.no-results {
		padding: 12px;
		font-size: 13px;
		color: var(--h-text-6);
		text-align: center;
	}

	.config {
		flex: 1;
		min-width: 0;
		padding: 20px 28px 26px;
		overflow-y: auto;
	}

	.preview-well {
		border-radius: var(--h-radius-md);
		background: var(--h-inset);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		padding: 22px;
		margin-bottom: 16px;
	}

	.preview-note {
		font-size: 13px;
		color: var(--h-text-6);
		text-align: center;
	}

	.row {
		display: flex;
		gap: 12px;
	}

	.grow {
		flex: 1;
		min-width: 0;
	}

	.icon-column {
		width: 140px;
		flex: none;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin: 4px 0 14px;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 8px 13px;
		border-radius: 20px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		font-size: 13px;
		color: var(--h-text-4);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.chip.active {
		background: rgb(var(--h-accent-rgb) / calc(0.12 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.25 * var(--h-accent-scale)));
		color: var(--h-accent-icon);
	}

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

	.button {
		border: 1px solid transparent;
		padding: 9px 22px;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.button.primary {
		background: linear-gradient(135deg, var(--h-accent-bright), var(--h-accent-deep));
		color: var(--h-on-accent);
	}

	.button.primary.disabled {
		opacity: 0.4;
		cursor: default;
	}

	.button.danger {
		display: inline-block;
		background: rgb(var(--h-bad-rgb) / calc(0.16 * var(--h-accent-scale)));
		color: var(--h-bad-text);
		margin-top: 8px;
	}

	.button.danger.confirm {
		border-color: var(--h-bad-text);
	}

	@media (max-width: 700px) {
		.body {
			flex-direction: column;
			overflow-y: auto;
		}

		.gallery {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
			overflow-y: visible;
		}

		.config {
			overflow-y: visible;
		}
	}
</style>
