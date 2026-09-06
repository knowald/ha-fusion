<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { get } from 'svelte/store';
	import Ripple from '$lib/ui/actions/ripple';
	import { activateOnKeyboard } from '../interaction';
	import type { RailWidget, VisibilityCondition } from '../types';
	import { normalizeVisibility, PRESS_RIPPLE, slugify, uniqueId } from '../config';
	import { RAIL_WIDGET_TYPES, widgetDescriptor, type WidgetDraft } from '../widgets';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import Icon from '../Icon.svelte';
	import RailWidgetRenderer from '../RailWidgetRenderer.svelte';
	import VisibilityField from './VisibilityField.svelte';

	let { index }: { index: number | null } = $props();

	// initial value only - the sheet is remounted per editor target via {#key}
	// svelte-ignore state_referenced_locally
	const initial = index !== null ? get(hearthConfig).rail[index] : undefined;

	let type = $state<RailWidget['type']>(initial?.type ?? 'status');
	let hideMobile = $state(initial?.hide_mobile ?? false);
	let visibility = $state<VisibilityCondition[]>(
		(initial?.visibility ?? []).map((condition) => ({ ...condition }))
	);
	let search = $state('');
	// svelte-ignore state_referenced_locally
	let conditionsOpen = $state(visibility.length > 0);
	let draft = $state<WidgetDraft<RailWidget>>({ fields: {} as WidgetDraft<RailWidget>['fields'] });

	let descriptor = $derived(widgetDescriptor(type));
	let editorInitial = $derived(initial?.type === type ? initial : undefined);

	let filteredGallery = $derived.by(() => {
		const query = search.trim().toLowerCase();
		if (!query) return RAIL_WIDGET_TYPES;
		return RAIL_WIDGET_TYPES.filter(
			(kind) =>
				$lang(kind.name).toLowerCase().includes(query) ||
				$lang(kind.sub).toLowerCase().includes(query)
		);
	});

	let alwaysVisible = $derived(!hideMobile && visibility.length === 0);

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

	function buildWidget(id: string): RailWidget {
		// unknown extension keys survive a no-op edit; a type switch starts fresh
		return {
			...(initial?.type === type ? initial : {}),
			...$state.snapshot(draft.fields),
			id,
			type,
			hide_mobile: hideMobile || undefined,
			visibility: normalizeVisibility($state.snapshot(visibility))
		} as RailWidget;
	}

	let previewWidget = $derived.by(() => buildWidget('preview'));

	function done() {
		updateConfig((config) => {
			if (index !== null) {
				config.rail[index] = buildWidget(config.rail[index].id);
			} else {
				const taken = config.rail.map((widget) => widget.id);
				config.rail.push(buildWidget(uniqueId(slugify(type), taken)));
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
	doneDisabled={draft.valid === false}
	onremove={index !== null ? remove : undefined}
	wide
	split
>
	<div class="rail-editor">
		<div class="gallery">
			<label class="search">
				<Icon name="search" size={17} />
				<input type="text" bind:value={search} placeholder="Search widgets" spellcheck="false" />
			</label>
			{#each filteredGallery as kind (kind.type)}
				<div
					class="kind pressable"
					class:selected={type === kind.type}
					use:Ripple={PRESS_RIPPLE}
					use:scrollSelectedIntoView={type === kind.type}
					role="button"
					tabindex="0"
					onclick={() => (type = kind.type)}
					onkeydown={(event) => activateOnKeyboard(event, () => (type = kind.type))}
				>
					<span class="kind-icon"><Icon name={kind.icon} size={20} /></span>
					<div>
						<div class="kind-name">{$lang(kind.name)}</div>
						<div class="kind-sub">{$lang(kind.sub)}</div>
					</div>
				</div>
			{:else}
				<div class="no-results">{$lang('hearth_no_widgets_match')}</div>
			{/each}
		</div>
		<div class="config editor-fields">
			<div class="preview-well" style="pointer-events: none">
				{#if type === 'spacer'}
					<div class="preview-note">{$lang('hearth_flexible_gap_pushes_the_widgets_around')}</div>
				{:else}
					<RailWidgetRenderer widget={previewWidget} />
				{/if}
			</div>

			{#key type}
				{#if descriptor.editor}
					{#await descriptor.editor() then Editor}
						<Editor.default initial={editorInitial} onchange={(next) => (draft = next)} />
					{/await}
				{/if}
			{/key}

			<div class="chips">
				<span
					class="chip pressable"
					class:active={alwaysVisible}
					use:Ripple={PRESS_RIPPLE}
					role="button"
					tabindex="0"
					onclick={setAlwaysVisible}
					onkeydown={(event) => activateOnKeyboard(event, setAlwaysVisible)}
				>
					<Icon name="visibility" size={16} />
					{$lang('hearth_always_visible')}
				</span>
				<span
					class="chip pressable"
					class:active={hideMobile}
					use:Ripple={PRESS_RIPPLE}
					role="button"
					tabindex="0"
					onclick={() => (hideMobile = !hideMobile)}
					onkeydown={(event) => activateOnKeyboard(event, () => (hideMobile = !hideMobile))}
				>
					<Icon name="smartphone" size={16} />
					{$lang('hearth_hide_on_mobile')}
				</span>
				<span
					class="chip pressable"
					class:active={visibility.length > 0 || conditionsOpen}
					use:Ripple={PRESS_RIPPLE}
					role="button"
					tabindex="0"
					onclick={() => (conditionsOpen = !conditionsOpen)}
					onkeydown={(event) => activateOnKeyboard(event, () => (conditionsOpen = !conditionsOpen))}
				>
					<Icon name="rule" size={16} />
					{$lang('conditions')}{visibility.length ? ` (${visibility.length})` : ''}
				</span>
			</div>

			{#if conditionsOpen}
				<VisibilityField bind:value={visibility} />
			{/if}
		</div>
	</div>
</EditSheet>

<style>
	.rail-editor {
		display: flex;
		flex: 1;
		min-height: 0;
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

	@media (max-width: 700px) {
		.rail-editor {
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
