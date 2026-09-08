<script lang="ts">
	import { ICON } from './iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import StateLogic from '$lib/ui/StateLogic.svelte';
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import type { SliderUpdateMode } from '$lib/core/app/configuration';
	import { PRESS_RIPPLE } from './config';
	import { domainDescriptor, domainIcon, entityIsReadout } from '$lib/core/domains';
	import { getTogglableService } from '$lib/core/ha/entities';
	import { hearthEditMode, popup, requestConfirmation } from './store';
	import { controlOverrides, pendingEntities } from '$lib/core/ha/commands';
	import { entityActiveFor, entityAvailability, sensorNumber } from '$lib/core/ha/entities';
	import { toggleEntity } from '$lib/core/domains/entity';
	import { openEntityDetail } from '$lib/Hearth/details';
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

	let bareModal = $derived(entityIsReadout(entity, stateObj));
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
			const verb = $lang(unlocking ? 'hearth_unlock' : 'hearth_lock');
			requestConfirmation({
				title: $lang(unlocking ? 'hearth_unlock_door_question' : 'hearth_lock_door_question'),
				message: `${verb} ${label}?`,
				confirmLabel: verb,
				action: () => toggleEntity(entity)
			});
		} else if (tapSurface === 'toggle') {
			toggleEntity(entity);
		} else if (tapSurface === 'history') {
			popup.set({ kind: 'sensor', entity, name: label });
		} else if (tapSurface === 'modal') {
			openEntityDetail(entity, name);
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
			openEntityDetail(entity, name);
		}
	}
</script>

{#if domainDescriptor(domain).tile === 'light'}
	<LightTile {entity} {name} {icon} {compact} {readonly} {sliderUpdates} {showTune} {onedit} />
{:else if domainDescriptor(domain).tile === 'cover'}
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
		onkeydown={(event) => activateOnKeyboard(event, event.shiftKey ? openControls : handleClick)}
	>
		<div class="content">
			<Icon name={icon || domainIcon(entity)} size={ICON.tile} color={iconColor} fill={on} />
			<div class="text">
				<div class="name">{label}</div>
				<div class="state" class:on={on && available}>
					{#if available}
						<StateLogic
							editing={$hearthEditMode}
							entity_id={entity}
							selected={{ entity_id: entity }}
						/>
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
		padding: 16px 16px;
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
		padding-top: 10px;
		padding-bottom: 10px;
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
		z-index: var(--h-layer-raised);
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}

	.text {
		min-width: 0;
	}

	.name {
		font-size: var(--h-type-emphasis);
		font-weight: 500;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state {
		font-size: var(--h-type-secondary);
		margin-top: 4px;
		color: var(--h-text-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state.on {
		color: var(--h-accent-text);
	}
</style>
