<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang } from '$lib/Stores';
	import { capitalize, PRESS_RIPPLE } from './config';
	import { horizontalDrag } from './drag';
	import Icon from './Icon.svelte';
	import {
		editor,
		hearthConfig,
		hearthEditMode,
		lightViews,
		pendingEntities,
		popup,
		setLightLevel,
		toggleLight
	} from './store';
	import TuneButton from './TuneButton.svelte';

	let { id }: { id: string } = $props();

	let light = $derived($hearthConfig.lights.find((entry) => entry.id === id));
	let view = $derived($lightViews[id]);
	let iconColor = $derived(
		view?.on ? (view.colorCss ?? 'var(--h-accent-bright)') : 'var(--h-icon-dim)'
	);
	let pending = $derived(light !== undefined && $pendingEntities[light.entity] !== undefined);

	function openEditor() {
		editor.set({ kind: 'light', id });
	}
</script>

<div
	class="tile pressable"
	class:on={view?.on}
	class:pending
	data-id={id}
	use:Ripple={PRESS_RIPPLE}
	onclick={() => $hearthEditMode && openEditor()}
	use:horizontalDrag={{
		set: (value) => setLightLevel(id, value),
		tap: () => toggleLight(id),
		disabled: $hearthEditMode,
		ignore: '.tune, .tile-edit'
	}}
>
	<div class="fill" style:width="{view?.on ? view.level : 0}%"></div>
	<div class="content">
		<Icon name="lightbulb" size={26} color={iconColor} fill={view?.on} />
		<div>
			<div class="name">{light?.name ?? id}</div>
			<div class="state">{view?.on ? `${view.level}%` : capitalize($lang('off'))}</div>
		</div>
	</div>
	{#if $hearthEditMode}
		<span class="tile-edit">
			<span class="drag-handle"><Icon name="drag_indicator" size={19} /></span>
			<TuneButton icon="edit" onopen={openEditor} />
		</span>
	{:else}
		<TuneButton onopen={() => popup.set({ kind: 'light', id, name: light?.name ?? id })} />
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
	}

	.name {
		font-size: 15px;
		font-weight: 500;
		color: var(--h-text-3);
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
