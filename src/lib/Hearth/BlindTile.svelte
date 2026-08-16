<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { lang, states } from '$lib/Stores';
	import type { SliderUpdateMode } from '$lib/Types';
	import { capitalize, PRESS_RIPPLE } from './config';
	import {
		blindPositionFor,
		controlOverrides,
		entityAvailability,
		hearthEditMode,
		pendingEntities,
		popup,
		requestConfirmation,
		toggleBlind
	} from './store';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';
	import { activateOnKeyboard, longPress } from './interaction';

	let {
		entity,
		name = undefined,
		icon = undefined,
		compact = false,
		readonly = false,
		sliderUpdates = 'continuous',
		showTune = false,
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		compact?: boolean;
		/** display only: taps never send a command */
		readonly?: boolean;
		sliderUpdates?: SliderUpdateMode;
		/** restores the controls glyph beside the long-press gesture */
		showTune?: boolean;
		onedit?: () => void;
	} = $props();

	let position = $derived(blindPositionFor(entity, $states, $controlOverrides));
	let availability = $derived(entityAvailability($states?.[entity]));
	let available = $derived(availability === 'available');
	let open = $derived(position > 0);
	let label = $derived(name || $states?.[entity]?.attributes?.friendly_name || entity);
	let stateText = $derived(
		!available
			? availability === 'missing'
				? $lang('hearth_missing_entity')
				: capitalize($lang(availability))
			: position === 0
				? capitalize($lang('closed'))
				: `${capitalize($lang('open'))} · ${position}%`
	);

	let pending = $derived($pendingEntities[entity] !== undefined);
	let interactive = $derived($hearthEditMode || (!readonly && available));
	let disruptive = $derived(
		['door', 'garage', 'garage_door', 'gate'].includes(
			String($states?.[entity]?.attributes?.device_class ?? '')
		)
	);

	function handleClick() {
		if ($hearthEditMode) return onedit?.();
		if (readonly || !available) return;
		if (disruptive) {
			const action = open ? 'Close' : 'Open';
			requestConfirmation({
				title: `${action} ${label}?`,
				message: `This cover controls an access point. Confirm before continuing.`,
				confirmLabel: action,
				action: () => toggleBlind(entity)
			});
			return;
		}
		toggleBlind(entity);
	}
</script>

<div
	class="tile"
	class:compact
	class:pressable={interactive}
	class:open
	class:unreachable={!available}
	class:pending
	data-id={entity}
	role="button"
	tabindex={interactive ? 0 : -1}
	aria-pressed={open}
	use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
	use:longPress={{
		hold: () => popup.set({ kind: 'blind', entity, name: label, sliderUpdates }),
		disabled: $hearthEditMode || readonly || !available
	}}
	onclick={handleClick}
	onkeydown={(event) => activateOnKeyboard(event, handleClick)}
>
	<div class="fill" style:width="{position}%"></div>
	<div class="content">
		<Icon
			name={icon || 'blinds'}
			size={26}
			color={!available
				? 'var(--h-icon-dim)'
				: open
					? 'var(--h-accent-dim-text)'
					: 'var(--h-icon-dim)'}
		/>
		<div>
			<div class="name">{label}</div>
			<div class="state" class:open>{stateText}</div>
		</div>
	</div>
	{#if $hearthEditMode && onedit}
		<TuneButton icon="edit" onopen={onedit} alignEdge />
	{:else if showTune && !$hearthEditMode && !readonly && available}
		<TuneButton
			alignEdge
			onopen={() => popup.set({ kind: 'blind', entity, name: label, sliderUpdates })}
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

	/* blinds sit in the warm palette like everything else; only their fill
	   intensity separates them from lights */
	.tile.open {
		border-color: rgb(var(--h-line-rgb) / calc(0.09 * var(--h-line-scale)));
	}

	/* offline is a fact, not an alarm: dashed and muted rather than red */
	.tile.unreachable {
		border-style: dashed;
		border-color: rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.015 * var(--h-fill-scale)));
	}

	.tile.unreachable .name {
		color: var(--h-text-5);
	}

	.tile.unreachable .state {
		color: var(--h-text-6);
	}

	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: rgb(var(--h-accent-rgb) / calc(0.09 * var(--h-accent-scale)));
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
		margin-top: 3px;
		color: var(--h-text-3);
	}

	.state.open {
		color: var(--h-accent-dim-text);
	}
</style>
