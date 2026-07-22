<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang, states } from '$lib/Stores';
	import { capitalize, PRESS_RIPPLE } from './config';
	import { horizontalDrag } from './drag';
	import Icon from './Icon.svelte';
	import {
		controlOverrides,
		hearthEditMode,
		lightViewFor,
		pendingEntities,
		popup,
		setLightLevel,
		toggleLight
	} from './store';
	import TuneButton from './TuneButton.svelte';

	let {
		entity,
		name = undefined,
		icon = undefined,
		dragId = undefined,
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		/** data-id for a surrounding sortable grid; also shows the drag handle */
		dragId?: string;
		onedit?: () => void;
	} = $props();

	let view = $derived(lightViewFor(entity, $states, $controlOverrides));
	let label = $derived(name || $states?.[entity]?.attributes?.friendly_name || entity);
	let iconColor = $derived(
		view.on ? (view.colorCss ?? 'var(--h-accent-bright)') : 'var(--h-icon-dim)'
	);
	let pending = $derived($pendingEntities[entity] !== undefined);
</script>

<div
	class="tile pressable"
	class:on={view.on}
	class:pending
	data-id={dragId ?? entity}
	use:Ripple={PRESS_RIPPLE}
	onclick={() => $hearthEditMode && onedit?.()}
	use:horizontalDrag={{
		set: (value) => setLightLevel(entity, value),
		tap: () => toggleLight(entity),
		disabled: $hearthEditMode,
		ignore: '.tune, .tile-edit'
	}}
>
	<div class="fill" style:width="{view.on ? view.level : 0}%"></div>
	<div class="content">
		<Icon name={icon || 'lightbulb'} size={26} color={iconColor} fill={view.on} />
		<div>
			<div class="name">{label}</div>
			<div class="state">{view.on ? `${view.level}%` : capitalize($lang('off'))}</div>
		</div>
	</div>
	{#if $hearthEditMode && onedit}
		<span class="tile-edit">
			{#if dragId}
				<span class="drag-handle"><Icon name="drag_indicator" size={19} /></span>
			{/if}
			<TuneButton icon="edit" onopen={onedit} />
		</span>
	{:else if !$hearthEditMode}
		<TuneButton onopen={() => popup.set({ kind: 'light', entity, name: label })} />
	{/if}
</div>

<style>
	.tile {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px 16px;
		border-radius: var(--h-radius-md);
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
	}

	.tile.on {
		background: rgb(var(--h-accent-rgb) / 0.07);
		border-color: rgb(var(--h-accent-rgb) / 0.28);
		box-shadow: 0 8px 30px rgb(var(--h-accent-rgb) / 0.1);
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			rgb(var(--h-accent-rgb) / 0.32),
			rgb(var(--h-accent-rgb) / 0.1)
		);
	}

	.content {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 13px;
		min-width: 0;
	}

	.name {
		font-size: 15px;
		font-weight: 500;
		color: var(--h-text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.on .name {
		font-weight: 600;
		color: var(--h-text-1);
	}

	.state {
		font-size: 13px;
		color: var(--h-text-6);
	}

	.on .state {
		color: var(--h-accent-dim-text);
	}

	.tile-edit {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--h-icon);
	}

	.drag-handle {
		cursor: grab;
		display: inline-flex;
	}
</style>
