<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { HearthDevice } from './config';
	import {
		editor,
		entityOn,
		hearthEditMode,
		pendingEntities,
		popup,
		sensorNumber,
		toggleDevice
	} from './store';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	// the generic 'entity' variant renders through EntityTile instead
	let {
		device,
		roomId,
		index
	}: { device: Exclude<HearthDevice, { type: 'entity' }>; roomId: string; index: number } =
		$props();

	let entity = $derived($states?.[device.entity]);
	let on = $derived(device.type === 'sensor' ? false : entityOn(device.entity, entity));
	let interactive = $derived(
		$hearthEditMode || (device.type !== 'sensor' && !(device.type === 'switch' && device.readonly))
	);
	let stateText = $derived.by(() => {
		if (device.type === 'sensor') {
			const value = sensorNumber(entity?.state);
			return value === null ? '-' : `${Math.round(value)}${device.unit ?? ''}`;
		}
		if (device.type === 'fan') {
			return on ? `On · ${Math.round(entity?.attributes?.percentage ?? 0)}%` : 'Off';
		}
		return on ? 'On' : 'Off';
	});
	let iconColor = $derived(
		device.type === 'sensor' ? 'var(--h-icon)' : on ? 'var(--h-accent-bright)' : 'var(--h-icon-dim)'
	);
	let pending = $derived($pendingEntities[device.entity] !== undefined);

	function openEditor() {
		editor.set({ kind: 'device', roomId, index });
	}

	function handleClick() {
		if ($hearthEditMode) {
			openEditor();
		} else if (device.type !== 'sensor' && !(device.type === 'switch' && device.readonly)) {
			toggleDevice(device.entity);
		}
	}
</script>

<div
	class="tile"
	class:on
	class:interactive
	class:pending
	class:pressable={interactive}
	use:Ripple={interactive ? PRESS_RIPPLE : { color: 'transparent' }}
	onclick={handleClick}
>
	<div class="content">
		<Icon name={device.icon} size={26} color={iconColor} fill={device.type === 'fan' && on} />
		<div>
			<div class="name">{device.name}</div>
			<div class="state" class:on class:sensor={device.type === 'sensor'}>{stateText}</div>
		</div>
	</div>
	{#if $hearthEditMode}
		<TuneButton icon="edit" onopen={openEditor} />
	{:else if device.type === 'fan'}
		<TuneButton
			onopen={() => popup.set({ kind: 'fan', entity: device.entity, name: device.name })}
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
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.06);
	}

	.tile.interactive {
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
	}

	.name {
		font-size: 15px;
		font-weight: 500;
		color: var(--h-text-2);
	}

	.state {
		font-size: 13px;
		color: var(--h-text-6);
	}

	.state.on {
		color: var(--h-accent-dim-text);
	}

	.state.sensor {
		color: var(--h-text-5);
	}
</style>
