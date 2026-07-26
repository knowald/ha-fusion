<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import { states } from '$lib/Stores';
	import { domainIcon, PRESS_RIPPLE } from './config';
	import { entityOn, hearthEditMode, pendingEntities, popup, toggleEntity } from './store';
	import { openEntityModal } from './modals';
	import BlindTile from './BlindTile.svelte';
	import Icon from './Icon.svelte';
	import LightTile from './LightTile.svelte';
	import TuneButton from './TuneButton.svelte';

	let {
		entity,
		name = undefined,
		icon = undefined,
		compact = false,
		readonly = false,
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		compact?: boolean;
		/** display only: taps never send a command */
		readonly?: boolean;
		onedit?: () => void;
	} = $props();

	let domain = $derived(entity.split('.')[0]);
	let stateObj = $derived($states?.[entity]);
	let on = $derived(entityOn(entity, stateObj));
	let pending = $derived($pendingEntities[entity] !== undefined);
	let label = $derived(name || stateObj?.attributes?.friendly_name || entity);
	let iconColor = $derived(on ? 'var(--h-accent-bright)' : 'var(--h-icon-dim)');
	let fanSpeed = $derived(
		domain === 'fan' && on ? Math.round(stateObj?.attributes?.percentage ?? 0) : null
	);
	let interactive = $derived($hearthEditMode || !readonly);

	function handleClick() {
		if ($hearthEditMode) {
			onedit?.();
		} else if (readonly) {
			// a readout: no command, and no detail sheet either, since every one of
			// them offers controls for a controllable domain
			return;
		} else if (!toggleEntity(entity)) {
			openEntityModal(entity, name);
		}
	}
</script>

{#if domain === 'light'}
	<LightTile {entity} {name} {icon} {compact} {readonly} {onedit} />
{:else if domain === 'cover'}
	<BlindTile {entity} {name} {icon} {compact} {readonly} {onedit} />
{:else}
	<div
		class="tile"
		class:compact
		class:on
		class:pending
		class:pressable={interactive}
		use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
		onclick={handleClick}
	>
		<div class="content">
			<Icon name={icon || domainIcon(entity)} size={26} color={iconColor} fill={on} />
			<div class="text">
				<div class="name">{label}</div>
				<div class="state" class:on>
					<StateLogic entity_id={entity} selected={{ entity_id: entity }} />
					{#if fanSpeed !== null}<span class="speed">· {fanSpeed}%</span>{/if}
				</div>
			</div>
		</div>
		{#if $hearthEditMode && onedit}
			<TuneButton icon="edit" onopen={onedit} />
		{:else if $hearthEditMode || readonly}
			<!-- readout: no way in to a control surface from this tile -->
		{:else if domain === 'fan'}
			<!-- hearth's own fan sheet has the speed slider the fusion modal lacks -->
			<TuneButton onopen={() => popup.set({ kind: 'fan', entity, name: label })} />
		{:else}
			<TuneButton onopen={() => openEntityModal(entity, name)} />
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
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
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
		background: rgb(var(--h-accent-rgb) / 0.07);
		border-color: rgb(var(--h-accent-rgb) / 0.28);
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
		color: var(--h-text-6);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state.on {
		color: var(--h-accent-dim-text);
	}
</style>
