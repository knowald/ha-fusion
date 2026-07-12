<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import { states } from '$lib/Stores';
	import { editor, hearthConfig, hearthEditMode, sensorNumber, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import BlindTile from './BlindTile.svelte';
	import DeviceTile from './DeviceTile.svelte';
	import EntityTile from './EntityTile.svelte';
	import Icon from './Icon.svelte';
	import LightTile from './LightTile.svelte';

	let { roomId }: { roomId: string } = $props();

	let room = $derived($hearthConfig.rooms.find((entry) => entry.id === roomId));
	let climate = $derived.by(() => {
		const tempEntity = room?.temp_entity;
		const humidityEntity = room?.humidity_entity;
		const temp = sensorNumber(tempEntity ? $states?.[tempEntity]?.state : undefined);
		const humidity = sensorNumber(humidityEntity ? $states?.[humidityEntity]?.state : undefined);
		return {
			temp: temp === null ? '-' : `${temp.toFixed(1)}°`,
			humidity: humidity === null ? '-' : `${Math.round(humidity)}%`
		};
	});
	let empty = $derived(
		room !== undefined && room.devices.length === 0 && room.blinds.length === 0 && !$hearthEditMode
	);
</script>

{#if room}
	<div class="detail">
		<div
			class="header"
			class:editable={$hearthEditMode}
			onclick={() => $hearthEditMode && editor.set({ kind: 'room', id: roomId })}
		>
			<div class="icon-tile">
				<Icon name={room.icon} size={32} color="var(--h-accent-text)" />
			</div>
			<div class="titles">
				<div class="name">{room.name}</div>
				<div class="summary">{room.summary ?? ''}</div>
			</div>
			{#if $hearthEditMode}
				<div class="edit-hint">
					<Icon name="edit" size={20} />
				</div>
			{/if}
			<div class="chips">
				<div class="chip">
					<div class="chip-value">{climate.temp}</div>
					<div class="chip-label">Temp</div>
				</div>
				<div class="chip">
					<div class="chip-value">{climate.humidity}</div>
					<div class="chip-label">Humidity</div>
				</div>
			</div>
		</div>

		<div class="section-title">Lighting</div>
		<div
			class="grid lighting"
			use:sortable={{
				group: `hearth-room-lights-${roomId}`,
				handle: '.drag-handle',
				disabled: !$hearthEditMode,
				filter: '.add-tile',
				items: room.lights,
				onFinalize: (items: string[]) =>
					updateConfig((config) => {
						const target = config.rooms.find((entry) => entry.id === roomId);
						if (target) target.lights = items.filter(Boolean);
					})
			}}
		>
			{#each room.lights as lightId (lightId)}
				<LightTile id={lightId} />
			{/each}
			{#if $hearthEditMode}
				<AddTile label="Assign lights" onadd={() => editor.set({ kind: 'room', id: roomId })} />
			{/if}
		</div>

		<div class="section-title">Devices</div>
		<div class="grid devices">
			{#each room.blinds as blindId (blindId)}
				<BlindTile id={blindId} />
			{/each}
			{#each room.devices as device, index (index)}
				{#if device.type === 'entity'}
					<EntityTile
						entity={device.entity}
						name={device.name}
						icon={device.icon}
						onedit={() => editor.set({ kind: 'device', roomId, index })}
					/>
				{:else}
					<DeviceTile {device} {roomId} {index} />
				{/if}
			{/each}
			{#if $hearthEditMode}
				<AddTile
					label="Add device"
					onadd={() => editor.set({ kind: 'device', roomId, index: null })}
				/>
			{/if}
		</div>

		{#if empty}
			<div class="empty">No other devices in this room</div>
		{/if}
	</div>
{/if}

<style>
	.detail {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-bottom: 30px;
	}

	.header.editable {
		cursor: pointer;
	}

	.edit-hint {
		color: var(--h-icon);
	}

	.icon-tile {
		width: 64px;
		height: 64px;
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-accent-rgb) / 0.14);
		border: 1px solid rgb(var(--h-accent-rgb) / 0.22);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.titles {
		flex: 1;
	}

	.name {
		font-size: 30px;
		font-weight: 600;
		color: var(--h-text-1);
		letter-spacing: -0.5px;
	}

	.summary {
		font-size: 14px;
		color: var(--h-text-5);
	}

	.chips {
		display: flex;
		gap: 12px;
	}

	.chip {
		padding: 12px 18px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
		text-align: center;
	}

	.chip-value {
		font-size: 22px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.chip-label {
		font-size: 12px;
		color: var(--h-text-5);
	}

	.section-title {
		font-size: 17px;
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 14px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}

	.grid.lighting {
		margin-bottom: 30px;
	}

	.grid.devices {
		align-content: start;
	}

	.empty {
		margin-top: 20px;
		padding: 28px;
		border-radius: var(--h-radius-card);
		background: rgb(var(--h-surface-rgb) / 0.03);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.1);
		text-align: center;
		font-size: 14px;
		color: var(--h-text-6);
	}
</style>
