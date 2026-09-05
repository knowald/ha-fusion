<script lang="ts">
	import type { EntityRef } from '../../types';
	import { moveItem } from '../../config';
	import { activateOnKeyboard } from '../../interaction';
	import type { CardEditorProps } from '../types';
	import type { EntitiesCard } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import Icon from '../../Icon.svelte';
	import IconField from '../../edit/IconField.svelte';
	import SelectField from '../../edit/SelectField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: CardEditorProps<EntitiesCard> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	// display widened to string so the per-entity select can hold '' for
	// "follow the card style"; narrowed back to the union when building
	type EditableRef = {
		entity: string;
		name: string;
		icon: string;
		display: string;
		readonly: boolean;
		slider_updates: string;
		// YAML-only field with no form control; carried so edits don't drop it
		verdict?: EntityRef['verdict'];
	};

	function editable(ref: EntityRef): EditableRef {
		return {
			entity: ref.entity ?? '',
			name: ref.name ?? '',
			icon: ref.icon ?? '',
			display: ref.display ?? '',
			readonly: ref.readonly ?? false,
			slider_updates: ref.slider_updates ?? '',
			verdict: ref.verdict
		};
	}

	let title = $state(initial?.title ?? '');
	let style = $state<string>(initial?.style ?? 'tile');
	let columns = $state<string>(initial?.columns ? String(initial.columns) : '');
	// mirrors the runtime default (titled sections count unless opted out), so
	// the checkbox state matches what the dashboard actually renders
	let showCount = $state(initial ? (initial.show_count ?? Boolean(initial.title)) : true);
	let groupActions = $state(initial ? initial.group_actions !== false : true);
	let tuneButtons = $state(initial?.tune_button ?? false);
	let verticalPadding = $state(initial?.vertical_padding ?? '');
	let readonly = $state(initial?.readonly ?? false);
	let wildcard = $state(initial?.wildcard ?? '');
	let sliderUpdates = $state(initial?.slider_updates ?? 'continuous');
	let collapsed = $state(initial?.collapsed ?? false);
	let icon = $state(initial?.icon ?? '');
	let summary = $state(initial?.summary ?? '');
	let summaryEntity = $state(initial?.summary_entity ?? '');
	let entities = $state<EditableRef[]>((initial?.entities ?? []).map(editable));
	let entitiesOpen = $state(true);
	let expandedRows = $state<number[]>([]);

	/** Applies the preview's drag order to the rows that have an entity. */
	export function applyPreviewReorder(reordered: EntityRef[]) {
		// incomplete rows are filtered out of the preview; keep them in place
		const positions = entities.flatMap((ref, position) => (ref.entity.trim() ? [position] : []));
		if (positions.length !== reordered.length) return;
		const next = entities.map((ref) => ({ ...ref }));
		for (const [order, position] of positions.entries())
			next[position] = editable(reordered[order]);
		entities = next;
		expandedRows = [];
	}

	function toggleRow(index: number) {
		expandedRows = expandedRows.includes(index)
			? expandedRows.filter((entry) => entry !== index)
			: [...expandedRows, index];
	}

	function moveRow(index: number, direction: -1 | 1) {
		moveItem(entities, index, direction);
		expandedRows = [];
	}

	function removeRow(index: number) {
		entities.splice(index, 1);
		expandedRows = expandedRows
			.filter((entry) => entry !== index)
			.map((entry) => (entry > index ? entry - 1 : entry));
	}

	function addRow() {
		entities.push({
			entity: '',
			name: '',
			icon: '',
			display: '',
			readonly: false,
			slider_updates: ''
		});
		entitiesOpen = true;
		expandedRows = [entities.length - 1];
	}

	$effect(() => {
		const columnCount = parseInt(columns, 10);
		onchange({
			fields: {
				title: title.trim() || undefined,
				style: style === 'stat' ? 'stat' : undefined,
				columns: Number.isFinite(columnCount) && columnCount >= 1 ? columnCount : undefined,
				// stored only when it differs from the default (titled sections count,
				// untitled ones do not); explicit false opts a titled section out
				show_count: showCount === Boolean(title.trim()) ? undefined : showCount,
				group_actions: groupActions ? undefined : false,
				tune_button: tuneButtons || undefined,
				vertical_padding: verticalPadding === 'compact' ? 'compact' : undefined,
				readonly: readonly || undefined,
				wildcard: wildcard.trim() || undefined,
				slider_updates:
					sliderUpdates === 'release' || sliderUpdates === 'continuous' ? sliderUpdates : undefined,
				collapsed: collapsed || undefined,
				icon: collapsed ? icon.trim() || undefined : undefined,
				summary: collapsed ? summary.trim() || undefined : undefined,
				summary_entity: collapsed ? summaryEntity.trim() || undefined : undefined,
				entities: entities
					.map((ref): EntityRef => ({
						entity: ref.entity.trim(),
						name: ref.name.trim() || undefined,
						icon: ref.icon.trim() || undefined,
						display: ref.display === 'stat' || ref.display === 'tile' ? ref.display : undefined,
						readonly: ref.readonly || undefined,
						slider_updates:
							ref.slider_updates === 'continuous' || ref.slider_updates === 'release'
								? ref.slider_updates
								: undefined,
						verdict: ref.verdict
					}))
					.filter((ref) => ref.entity)
			}
		});
	});
</script>

<TextField label="Title" bind:value={title} placeholder="Lights" />
<SelectField
	label="Style"
	bind:value={style}
	options={[
		{ value: 'tile', label: 'Tiles' },
		{ value: 'stat', label: 'Stat boxes' }
	]}
/>
<SelectField
	label="Columns"
	bind:value={columns}
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
	bind:value={verticalPadding}
	options={[
		{ value: '', label: 'Standard' },
		{ value: 'compact', label: 'Compact' }
	]}
/>
<SelectField
	label="Slider commands"
	bind:value={sliderUpdates}
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
	<input type="checkbox" bind:checked={groupActions} />
	<span>Header actions for groups (All off, Open all, Close all)</span>
</label>
<label class="check">
	<input type="checkbox" bind:checked={tuneButtons} />
	<span>Controls glyph on tiles (long-press always works)</span>
</label>
<label class="check">
	<input type="checkbox" bind:checked={readonly} />
	<span>Display only (no tile ever sends a command)</span>
</label>
<TextField label="Entity wildcard (optional)" bind:value={wildcard} placeholder="light.kitchen_*" />
<label class="check">
	<input type="checkbox" bind:checked={collapsed} />
	<span>Collapse into a summary row (details in a popover)</span>
</label>

{#if collapsed}
	<IconField label="Summary row icon (optional)" bind:value={icon} />
	<TextField label="Summary text (optional)" bind:value={summary} placeholder="5 open · 3 closed" />
	<EntityField label="Summary from entity (optional)" bind:value={summaryEntity} />
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
						aria-expanded={expandedRows.includes(refIndex)}
						onclick={() => toggleRow(refIndex)}
					>
						<Icon
							name={expandedRows.includes(refIndex) ? 'expand_more' : 'chevron_right'}
							size={19}
						/>
						<span class="entity-row-copy">
							<strong>{ref.name.trim() || ref.entity.trim() || 'New entity'}</strong>
							{#if ref.name.trim() && ref.entity.trim()}<small>{ref.entity}</small>{/if}
						</span>
					</button>
					<span class="entity-row-actions">
						<button
							type="button"
							class="reorder"
							disabled={refIndex === 0}
							aria-label="Move entity up"
							onclick={() => moveRow(refIndex, -1)}
						>
							<Icon name="keyboard_arrow_up" size={20} />
						</button>
						<button
							type="button"
							class="reorder"
							disabled={refIndex === entities.length - 1}
							aria-label="Move entity down"
							onclick={() => moveRow(refIndex, 1)}
						>
							<Icon name="keyboard_arrow_down" size={20} />
						</button>
						<button
							type="button"
							class="remove"
							aria-label="Remove entity"
							onclick={() => removeRow(refIndex)}
						>
							<Icon name="delete" size={20} />
						</button>
					</span>
				</div>
				{#if expandedRows.includes(refIndex)}
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
						{#if !readonly}
							<label class="check">
								<input type="checkbox" bind:checked={ref.readonly} />
								<span>Display only</span>
							</label>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
		<div
			class="add-filter"
			role="button"
			tabindex="0"
			onclick={addRow}
			onkeydown={(event) => activateOnKeyboard(event, addRow)}
		>
			<Icon name="add" size={18} />
			<span>Add entity</span>
		</div>
	</div>
{/if}
