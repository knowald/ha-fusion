<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang, states } from '$lib/Stores';
	import type { SliderUpdateMode } from '$lib/Types';
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
		compact = false,
		readonly = false,
		sliderUpdates = 'continuous',
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		compact?: boolean;
		/** display only: taps never send a command */
		readonly?: boolean;
		sliderUpdates?: SliderUpdateMode;
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
	let interactive = $derived($hearthEditMode || !readonly);
</script>

<div
	class="tile"
	class:compact
	class:pressable={interactive}
	class:open
	class:pending
	data-id={entity}
	use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
	onclick={() => ($hearthEditMode ? onedit?.() : readonly || toggleBlind(entity))}
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
		<TuneButton icon="edit" onopen={onedit} />
	{:else if !$hearthEditMode && !readonly}
		<!-- a readonly tile shows position but offers no way to change it -->
		<TuneButton onopen={() => popup.set({ kind: 'blind', entity, name: label, sliderUpdates })} />
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

	.tile.open {
		border-color: rgb(var(--h-cool-rgb) / calc(0.22 * var(--h-accent-scale)));
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			rgb(var(--h-cool-rgb) / calc(0.24 * var(--h-accent-scale))),
			rgb(var(--h-cool-rgb) / calc(0.07 * var(--h-accent-scale)))
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
</style>
