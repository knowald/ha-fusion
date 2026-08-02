<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { sortable } from '$lib/Actions/sortable';
	import { lang } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { HearthRoom } from './config';
	import { currentRoom, editor, hearthConfig, hearthEditMode, updateConfig } from './store';
	import Icon from './Icon.svelte';
</script>

<div class="divider"></div>
<div class="rooms-label">{$lang('hearth_pages')}</div>

<div
	class="room-list"
	use:sortable={{
		group: 'hearth-rooms',
		disabled: !$hearthEditMode,
		filter: '.add',
		items: $hearthConfig.rooms,
		onFinalize: (items: HearthRoom[]) =>
			updateConfig((config) => {
				config.rooms = items;
			})
	}}
>
	{#each $hearthConfig.rooms as room (room.id)}
		<button
			type="button"
			class="nav-item pressable"
			data-id={room.id}
			class:active={$currentRoom === room.id}
			use:Ripple={PRESS_RIPPLE}
			onclick={() => currentRoom.set(room.id)}
		>
			<Icon name={room.icon} size={21} />
			<span class="nav-name">{room.name}</span>
		</button>
	{/each}
	{#if $hearthEditMode}
		<button
			type="button"
			class="nav-item add pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => editor.set({ kind: 'room', id: null })}
		>
			<Icon name="add" size={21} />
			<span class="nav-name">{$lang('hearth_add_page')}</span>
		</button>
	{/if}
</div>

<style>
	.divider {
		height: 1px;
		background: rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		margin: 24px 0;
	}

	.rooms-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-text-6);
		margin-bottom: 12px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 14px;
		border-radius: var(--h-radius-sm);
		cursor: pointer;
		border: 1px solid transparent;
		color: var(--h-text-4);
		width: 100%;
		background: none;
		font: inherit;
		text-align: left;
	}

	.nav-item.active {
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		border-color: rgb(var(--h-accent-rgb) / calc(0.22 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	.nav-item.add {
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
	}

	.nav-name {
		font-size: 15px;
		font-weight: 500;
	}

	/* phones: rooms become a horizontal chip row instead of a tall list */
	@media (max-width: 700px) {
		.divider {
			margin: 16px 0;
		}

		.room-list {
			display: flex;
			overflow-x: auto;
			gap: 8px;
			padding-bottom: 4px;
			scrollbar-width: none;
		}

		.room-list::-webkit-scrollbar {
			display: none;
		}

		.room-list .nav-item {
			flex: none;
			white-space: nowrap;
			padding: 10px 14px;
		}
	}
</style>
