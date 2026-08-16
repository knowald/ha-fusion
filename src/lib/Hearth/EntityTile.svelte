<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import { lang, states } from '$lib/Stores';
	import type { SliderUpdateMode } from '$lib/Types';
	import { domainIcon, PRESS_RIPPLE } from './config';
	import { getTogglableService } from '$lib/Utils';
	import {
		controlOverrides,
		entityActiveFor,
		entityAvailability,
		hearthEditMode,
		pendingEntities,
		popup,
		requestConfirmation,
		sensorNumber,
		toggleEntity
	} from './store';
	import { openEntityModal } from './modals';
	import BlindTile from './BlindTile.svelte';
	import Icon from './Icon.svelte';
	import LightTile from './LightTile.svelte';
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

	let domain = $derived(entity.split('.')[0]);
	let stateObj = $derived($states?.[entity]);
	let availability = $derived(entityAvailability(stateObj));
	let available = $derived(availability === 'available');
	let on = $derived(entityActiveFor(entity, stateObj, $controlOverrides));
	let pending = $derived($pendingEntities[entity] !== undefined);
	let label = $derived(name || stateObj?.attributes?.friendly_name || entity);
	let iconColor = $derived(
		!available ? 'var(--h-icon-dim)' : on ? 'var(--h-accent-icon)' : 'var(--h-icon-dim)'
	);
	let fanSpeed = $derived(
		domain === 'fan' && on ? Math.round(stateObj?.attributes?.percentage ?? 0) : null
	);

	// domains whose fusion modal only echoes the state the tile already shows
	const BARE_MODAL_DOMAINS = new Set([
		'air_quality',
		'date',
		'time',
		'event',
		'image_processing',
		'mailbox',
		'sensor',
		'binary_sensor',
		'stt',
		'weather',
		'schedule',
		'sun',
		'person',
		'zone'
	]);

	let bareModal = $derived(
		BARE_MODAL_DOMAINS.has(domain) ||
			(domain === 'device_tracker' && stateObj?.attributes?.source_type !== 'gps')
	);
	// what a tap earns: a command, a history chart, a domain modal - or, for a
	// readout whose modal would only echo the state, nothing at all
	let tapSurface = $derived(
		stateObj && getTogglableService(stateObj)
			? 'toggle'
			: bareModal
				? sensorNumber(stateObj?.state) !== null
					? 'history'
					: 'none'
				: 'modal'
	);
	let interactive = $derived($hearthEditMode || (!readonly && available && tapSurface !== 'none'));

	function handleClick() {
		if ($hearthEditMode) {
			onedit?.();
		} else if (readonly) {
			// a readout: no command, and no detail sheet either, since every one of
			// them offers controls for a controllable domain
			return;
		} else if (!available) {
			return;
		} else if (domain === 'lock') {
			const unlocking = stateObj?.state === 'locked';
			requestConfirmation({
				title: unlocking ? 'Unlock door?' : 'Lock door?',
				message: `${unlocking ? 'Unlock' : 'Lock'} ${label}?`,
				confirmLabel: unlocking ? 'Unlock' : 'Lock',
				action: () => toggleEntity(entity)
			});
		} else if (tapSurface === 'toggle') {
			toggleEntity(entity);
		} else if (tapSurface === 'history') {
			popup.set({ kind: 'sensor', entity, name: label });
		} else if (tapSurface === 'modal') {
			openEntityModal(entity, name);
		}
	}

	function openControls() {
		if ($hearthEditMode || readonly || !available) return;
		if (domain === 'fan') {
			// hearth's own fan sheet has the speed slider the fusion modal lacks
			popup.set({ kind: 'fan', entity, name: label });
		} else if (tapSurface === 'history') {
			popup.set({ kind: 'sensor', entity, name: label });
		} else if (tapSurface !== 'none') {
			openEntityModal(entity, name);
		}
	}
</script>

{#if domain === 'light'}
	<LightTile {entity} {name} {icon} {compact} {readonly} {sliderUpdates} {showTune} {onedit} />
{:else if domain === 'cover'}
	<BlindTile {entity} {name} {icon} {compact} {readonly} {sliderUpdates} {showTune} {onedit} />
{:else}
	<div
		class="tile"
		class:compact
		class:on
		class:unreachable={!available}
		class:pending
		class:pressable={interactive}
		role="button"
		tabindex={interactive ? 0 : -1}
		aria-pressed={on}
		use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
		use:longPress={{
			hold: openControls,
			disabled: $hearthEditMode || readonly || !available
		}}
		onclick={handleClick}
		onkeydown={(event) => activateOnKeyboard(event, handleClick)}
	>
		<div class="content">
			<Icon name={icon || domainIcon(entity)} size={26} color={iconColor} fill={on} />
			<div class="text">
				<div class="name">{label}</div>
				<div class="state" class:on={on && available}>
					{#if available}
						<StateLogic entity_id={entity} selected={{ entity_id: entity }} />
					{:else if availability === 'missing'}
						{$lang('hearth_missing_entity')}
					{:else}
						{$lang(availability)}
					{/if}
					{#if fanSpeed !== null}<span class="speed">· {fanSpeed}%</span>{/if}
				</div>
			</div>
		</div>
		{#if $hearthEditMode && onedit}
			<TuneButton icon="edit" onopen={onedit} alignEdge />
		{:else if showTune && !$hearthEditMode && !readonly && available && tapSurface !== 'none'}
			<TuneButton alignEdge onopen={openControls} />
		{/if}
	</div>
{/if}

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

	.speed {
		margin-left: 0.3em;
	}

	.tile.compact {
		padding-top: 9px;
		padding-bottom: 9px;
	}

	.tile.on {
		background: rgb(var(--h-accent-rgb) / calc(0.07 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.28 * var(--h-accent-scale)));
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

	.content {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 13px;
		min-width: 0;
	}

	.text {
		min-width: 0;
	}

	.name {
		font-size: 15px;
		font-weight: 500;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state {
		font-size: 13px;
		margin-top: 3px;
		color: var(--h-text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state.on {
		color: var(--h-accent-text);
	}
</style>
