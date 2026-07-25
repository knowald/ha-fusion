<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import { type HearthConfig, type OverviewItem } from './config';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import BlindTile from './BlindTile.svelte';
	import CardColumns from './CardColumns.svelte';
	import DeviceTile from './DeviceTile.svelte';
	import EntityTile from './EntityTile.svelte';
	import HeaderCard from './HeaderCard.svelte';
	import LightTile from './LightTile.svelte';

	let { roomId }: { roomId: string } = $props();

	let room = $derived($hearthConfig.rooms.find((entry) => entry.id === roomId));
	let empty = $derived(
		room !== undefined && room.devices.length === 0 && room.blinds.length === 0 && !$hearthEditMode
	);

	// display columns; an unset/empty cards list still renders the room's
	// column count worth of drop targets in edit mode
	let cardColumns = $derived(
		room?.cards?.length
			? room.cards
			: Array.from({ length: room?.columns ?? 1 }, (): OverviewItem[] => [])
	);

	// resolves (and initializes) the room's card columns inside a config draft
	function locateRoomCards(config: HearthConfig): OverviewItem[][] {
		const target = config.rooms.find((entry) => entry.id === roomId);
		if (!target) return [];
		if (!target.cards?.length) {
			target.cards = Array.from({ length: target.columns ?? 1 }, (): OverviewItem[] => []);
		}
		return target.cards;
	}
</script>

{#if room}
	<div class="detail">
		{#if !room.hide_header || $hearthEditMode}
			<div class="header-slot" class:hidden-header={room.hide_header}>
				<HeaderCard
					icon={room.icon}
					title={room.name}
					subtitle={room.summary}
					tempEntity={room.temp_entity}
					humidityEntity={room.humidity_entity}
					onedit={() => editor.set({ kind: 'room', id: roomId })}
				/>
			</div>
		{/if}

		<div class="section-title">Lighting</div>
		<div
			class="grid lighting"
			class:fixed-columns={room.columns !== undefined}
			style:--room-columns={room.columns}
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
				{@const light = $hearthConfig.lights.find((entry) => entry.id === lightId)}
				<LightTile
					entity={light?.entity ?? ''}
					name={light?.name ?? lightId}
					dragId={lightId}
					onedit={() => editor.set({ kind: 'light', id: lightId })}
				/>
			{/each}
			{#if $hearthEditMode}
				<AddTile label="Assign lights" onadd={() => editor.set({ kind: 'room', id: roomId })} />
			{/if}
		</div>

		<div class="section-title">Devices</div>
		<div
			class="grid devices"
			class:fixed-columns={room.columns !== undefined}
			style:--room-columns={room.columns}
		>
			{#each room.blinds as blindId (blindId)}
				{@const blind = $hearthConfig.blinds.find((entry) => entry.id === blindId)}
				<BlindTile
					entity={blind?.entity ?? ''}
					name={blind?.name ?? blindId}
					onedit={() => editor.set({ kind: 'blind', id: blindId })}
				/>
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

		{#if cardColumns.flat().length > 0 || $hearthEditMode}
			<div class="section-title cards-title">Cards</div>
			<CardColumns
				columns={cardColumns}
				locate={locateRoomCards}
				groupName={`hearth-room-cards-${roomId}`}
				{roomId}
			/>
		{/if}

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

	.header-slot {
		margin-bottom: 30px;
	}

	/* hidden headers stay visible in edit mode so the room remains reachable */
	.header-slot.hidden-header {
		opacity: 0.45;
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

	.grid.fixed-columns {
		grid-template-columns: repeat(var(--room-columns), minmax(0, 1fr));
	}

	.grid.lighting {
		margin-bottom: 30px;
	}

	.grid.devices {
		align-content: start;
	}

	/* Room grids collapse at the same tablet breakpoint as the Home overview. */
	@media (max-width: 1200px) {
		.grid.fixed-columns {
			grid-template-columns: 1fr;
		}
	}

	.cards-title {
		margin-top: 30px;
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
