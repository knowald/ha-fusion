<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import { states } from '$lib/Stores';
	import { domainIcon, PRESS_RIPPLE } from './config';
	import { entityOn, hearthEditMode, pendingEntities, toggleEntity } from './store';
	import { openEntityModal } from './modals';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	let {
		entity,
		name = undefined,
		icon = undefined,
		onedit = undefined
	}: {
		entity: string;
		name?: string;
		icon?: string;
		onedit?: () => void;
	} = $props();

	let stateObj = $derived($states?.[entity]);
	let on = $derived(entityOn(entity, stateObj));
	let pending = $derived($pendingEntities[entity] !== undefined);
	let label = $derived(name || stateObj?.attributes?.friendly_name || entity);
	let iconColor = $derived(on ? 'var(--h-accent-bright)' : 'var(--h-icon-dim)');

	function handleClick() {
		if ($hearthEditMode) {
			onedit?.();
		} else if (!toggleEntity(entity)) {
			openEntityModal(entity, name);
		}
	}
</script>

<div class="tile pressable" class:on class:pending use:Ripple={PRESS_RIPPLE} onclick={handleClick}>
	<div class="content">
		<Icon name={icon || domainIcon(entity)} size={26} color={iconColor} fill={on} />
		<div class="text">
			<div class="name">{label}</div>
			<div class="state" class:on>
				<StateLogic entity_id={entity} selected={{ entity_id: entity }} />
			</div>
		</div>
	</div>
	{#if $hearthEditMode && onedit}
		<TuneButton icon="edit" onopen={onedit} />
	{:else if !$hearthEditMode}
		<TuneButton onopen={() => openEntityModal(entity, name)} />
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
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
		cursor: pointer;
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
