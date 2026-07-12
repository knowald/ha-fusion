<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang } from '$lib/Stores';
	import { capitalize, PRESS_RIPPLE } from './config';
	import {
		blindViews,
		editor,
		hearthConfig,
		hearthEditMode,
		pendingEntities,
		popup,
		toggleBlind
	} from './store';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	let { id }: { id: string } = $props();

	let blind = $derived($hearthConfig.blinds.find((entry) => entry.id === id));
	let position = $derived($blindViews[id] ?? 0);
	let open = $derived(position > 0);
	let stateText = $derived(
		position === 100
			? capitalize($lang('open'))
			: position === 0
				? capitalize($lang('closed'))
				: `${position}% open`
	);

	let pending = $derived(blind !== undefined && $pendingEntities[blind.entity] !== undefined);

	function openEditor() {
		editor.set({ kind: 'blind', id });
	}
</script>

<div
	class="tile pressable"
	class:open
	class:pending
	data-id={id}
	use:Ripple={PRESS_RIPPLE}
	onclick={() => ($hearthEditMode ? openEditor() : toggleBlind(id))}
>
	<div class="fill" style:width="{position}%"></div>
	<div class="content">
		<Icon name="blinds" size={26} color={open ? 'var(--h-cool-light)' : 'var(--h-icon-dim)'} />
		<div>
			<div class="name">{blind?.name ?? id}</div>
			<div class="state" class:open>{stateText}</div>
		</div>
	</div>
	{#if $hearthEditMode}
		<span class="tile-edit">
			<span class="drag-handle"><Icon name="drag_indicator" size={19} /></span>
			<TuneButton icon="edit" onopen={openEditor} />
		</span>
	{:else}
		<TuneButton
			onopen={() => popup.set({ kind: 'blind', id, name: `Blinds · ${blind?.name ?? id}` })}
		/>
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
	}

	.name {
		font-size: 15px;
		font-weight: 500;
		color: var(--h-text-3);
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
