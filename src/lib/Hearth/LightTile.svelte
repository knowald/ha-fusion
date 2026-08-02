<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang, states } from '$lib/Stores';
	import type { SliderUpdateMode } from '$lib/Types';
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
		compact = false,
		readonly = false,
		sliderUpdates = 'continuous',
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		compact?: boolean;
		/** display only: neither the tap nor the brightness drag sends a command */
		readonly?: boolean;
		sliderUpdates?: SliderUpdateMode;
		onedit?: () => void;
	} = $props();

	let view = $derived(lightViewFor(entity, $states, $controlOverrides));
	let label = $derived(name || $states?.[entity]?.attributes?.friendly_name || entity);
	let iconColor = $derived(
		view.on ? (view.colorCss ?? 'var(--h-accent-icon)') : 'var(--h-icon-dim)'
	);
	let pending = $derived($pendingEntities[entity] !== undefined);
	let interactive = $derived($hearthEditMode || !readonly);
</script>

<div
	class="tile"
	class:compact
	class:pressable={interactive}
	class:on={view.on}
	class:pending
	data-id={entity}
	use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
	onclick={() => $hearthEditMode && onedit?.()}
	use:horizontalDrag={{
		set: (value, commit) => setLightLevel(entity, value, commit),
		updateMode: sliderUpdates,
		tap: () => toggleLight(entity),
		disabled: $hearthEditMode || readonly,
		ignore: '.tune'
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
		<TuneButton icon="edit" onopen={onedit} />
	{:else if !$hearthEditMode && !readonly}
		<!-- a readonly tile shows brightness but offers no way to change it -->
		<TuneButton onopen={() => popup.set({ kind: 'light', entity, name: label, sliderUpdates })} />
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
		/* pan-y, not none: the horizontal gesture stays ours while a vertical
		   swipe still scrolls the page or an enclosing popover */
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	.tile.pressable {
		cursor: pointer;
	}

	.tile.compact {
		padding-top: 9px;
		padding-bottom: 9px;
	}

	.tile.on {
		background: rgb(var(--h-accent-rgb) / calc(0.07 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.28 * var(--h-accent-scale)));
		box-shadow: 0 8px 30px rgb(var(--h-accent-rgb) / calc(0.1 * var(--h-accent-scale)));
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			rgb(var(--h-accent-rgb) / calc(0.32 * var(--h-accent-scale))),
			rgb(var(--h-accent-rgb) / calc(0.1 * var(--h-accent-scale)))
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
</style>
