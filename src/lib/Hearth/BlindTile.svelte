<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang, states } from '$lib/Stores';
	import { capitalize, PRESS_RIPPLE } from './config';
	import {
		blindPositionFor,
		controlOverrides,
		hearthEditMode,
		pendingEntities,
		popup,
		toggleBlind
	} from './store';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	let {
		entity,
		name = undefined,
		icon = undefined,
		dragId = undefined,
		compact = false,
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		/** data-id for a surrounding sortable grid; also shows the drag handle */
		dragId?: string;
		compact?: boolean;
		onedit?: () => void;
	} = $props();

	let position = $derived(blindPositionFor(entity, $states, $controlOverrides));
	let open = $derived(position > 0);
	let label = $derived(name || $states?.[entity]?.attributes?.friendly_name || entity);
	let stateText = $derived(
		position === 100
			? capitalize($lang('open'))
			: position === 0
				? capitalize($lang('closed'))
				: `${position}% open`
	);

	let pending = $derived($pendingEntities[entity] !== undefined);
</script>

<div
	class="tile pressable"
	class:compact
	class:open
	class:pending
	data-id={dragId ?? entity}
	use:Ripple={PRESS_RIPPLE}
	onclick={() => ($hearthEditMode ? onedit?.() : toggleBlind(entity))}
>
	<div class="fill" style:width="{position}%"></div>
	<div class="content">
		<Icon
			name={icon || 'blinds'}
			size={26}
			color={open ? 'var(--h-cool-light)' : 'var(--h-icon-dim)'}
		/>
		<div>
			<div class="name">{label}</div>
			<div class="state" class:open>{stateText}</div>
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
		<TuneButton onopen={() => popup.set({ kind: 'blind', entity, name: label })} />
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

	.tile.compact {
		padding-top: 9px;
		padding-bottom: 9px;
	}

	.tile.open {
		border-color: rgb(var(--h-cool-rgb) / 0.22);
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			rgb(var(--h-cool-rgb) / 0.24),
			rgb(var(--h-cool-rgb) / 0.07)
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

	.state {
		font-size: 13px;
		color: var(--h-text-6);
	}

	.state.open {
		color: var(--h-cool-text);
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
