<script lang="ts">
	import { ICON } from '../iconSizes';
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
	import TypeGallery from './TypeGallery.svelte';
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
	let typeOpen = $state(index === null);
	// svelte-ignore state_referenced_locally
	let conditionsOpen = $state(visibility.length > 0);
	let draft = $state<WidgetDraft<RailWidget>>({ fields: {} as WidgetDraft<RailWidget>['fields'] });

	let descriptor = $derived(widgetDescriptor(type));
	let editorInitial = $derived(initial?.type === type ? initial : undefined);

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
		const fields = {
			...(initial?.type === type ? initial : {}),
			...$state.snapshot(draft.fields)
		};
		return {
			...fields,
			// the editor loads on demand; normalizing gives the preview typed
			// defaults until it reports its fields
			...(descriptor.normalize?.(fields) ?? {}),
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
>
	<TypeGallery
		kinds={RAIL_WIDGET_TYPES}
		selected={type}
		label="hearth_widget_type"
		searchPlaceholder={$lang('hearth_search_widgets')}
		noMatch={$lang('hearth_no_widgets_match')}
		bind:open={typeOpen}
		onselect={(value) => (type = value as RailWidget['type'])}
	/>
	<div class="rail-editor editor-layout" class:hidden={typeOpen}>
		<div class="config editor-fields">
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
					<Icon name="visibility" size={ICON.inline} />
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
					<Icon name="smartphone" size={ICON.inline} />
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
					<Icon name="rule" size={ICON.inline} />
					{$lang('conditions')}{visibility.length ? ` (${visibility.length})` : ''}
				</span>
			</div>

			{#if conditionsOpen}
				<VisibilityField bind:value={visibility} />
			{/if}
		</div>
		<aside class="pane">
			<div class="pane-label">{$lang('hearth_live_preview')}</div>
			<div class="preview-well" style="pointer-events: none">
				{#if type === 'spacer'}
					<div class="preview-note">{$lang('hearth_flexible_gap_pushes_the_widgets_around')}</div>
				{:else}
					<RailWidgetRenderer widget={previewWidget} />
				{/if}
			</div>
		</aside>
	</div>
</EditSheet>

<style>
	.rail-editor {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 0.7fr);
		align-items: start;
		gap: 28px;
	}

	.rail-editor.hidden {
		display: none;
	}

	.pane {
		position: sticky;
		top: 0;
	}

	.pane-label {
		font-family: var(--h-font-mono);
		font-size: var(--h-type-label);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--h-label);
		margin-bottom: 10px;
	}

	.config {
		min-width: 0;
	}

	.preview-well {
		border-radius: var(--h-radius-md);
		background: var(--h-inset);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		padding: 22px;
		margin-bottom: 16px;
	}

	.preview-note {
		font-size: var(--h-type-secondary);
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
		gap: 8px;
		padding: 8px 14px;
		border-radius: var(--h-radius-card);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		font-size: var(--h-type-secondary);
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

	@media (max-width: 820px) {
		.rail-editor {
			grid-template-columns: 1fr;
			gap: 18px;
		}

		.pane {
			position: static;
		}
	}
</style>
