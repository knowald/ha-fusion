<script lang="ts">
	import { sortable } from '$lib/Actions/sortable';
	import { slugify, takenCardIds, uniqueId, type OverviewCard } from './config';
	import { editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import AddTile from './AddTile.svelte';
	import BlindTile from './BlindTile.svelte';
	import CardRenderer from './CardRenderer.svelte';
	import DeviceTile from './DeviceTile.svelte';
	import EditChip from './EditChip.svelte';
	import EntityTile from './EntityTile.svelte';
	import HeaderCard from './HeaderCard.svelte';
	import LightTile from './LightTile.svelte';
	import VisibilityGate from './VisibilityGate.svelte';

	let { roomId }: { roomId: string } = $props();

	let room = $derived($hearthConfig.rooms.find((entry) => entry.id === roomId));
	let empty = $derived(
		room !== undefined && room.devices.length === 0 && room.blinds.length === 0 && !$hearthEditMode
	);
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
		<div class="grid devices">
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

		{#if (room.cards?.length ?? 0) > 0 || $hearthEditMode}
			<div class="section-title cards-title">Cards</div>
			<div
				class="cards"
				use:sortable={{
					group: `hearth-room-cards-${roomId}`,
					handle: '.drag-handle',
					filter: '.add-tile',
					disabled: !$hearthEditMode,
					clone: true,
					cloneItem: (card: OverviewCard) => {
						const cloned = structuredClone(card);
						cloned.id = uniqueId(slugify(cloned.type), takenCardIds($hearthConfig));
						return cloned;
					},
					items: room.cards ?? [],
					onFinalize: (items: OverviewCard[]) =>
						updateConfig((config) => {
							const target = config.rooms.find((entry) => entry.id === roomId);
							if (target) target.cards = items.filter(Boolean);
						})
				}}
			>
				{#each room.cards ?? [] as card, index (card.id)}
					<VisibilityGate conditions={card.visibility}>
						{#snippet children(visible)}
							{#if $hearthEditMode || visible}
								<div
									class="card-slot"
									data-id={card.id}
									class:visibility-dimmed={$hearthEditMode && !visible}
								>
									{#if $hearthEditMode}
										<EditChip
											onedit={() => editor.set({ kind: 'card', column: 0, index, roomId })}
										/>
									{/if}
									<CardRenderer {card} />
								</div>
							{/if}
						{/snippet}
					</VisibilityGate>
				{/each}
				{#if $hearthEditMode}
					<AddTile
						label="Add card"
						onadd={() => editor.set({ kind: 'card', column: 0, index: null, roomId })}
					/>
				{/if}
			</div>
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

	.grid.lighting {
		margin-bottom: 30px;
	}

	.grid.devices {
		align-content: start;
	}

	.cards-title {
		margin-top: 30px;
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.card-slot {
		position: relative;
	}

	.card-slot.visibility-dimmed {
		opacity: 0.45;
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
