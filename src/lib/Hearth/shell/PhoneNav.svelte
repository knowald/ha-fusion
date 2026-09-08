<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { ICON } from '../iconSizes';
	import { currentRoom, hearthConfig, hearthEditMode } from '../store';
	import Icon from '../Icon.svelte';

	/**
	 * Page switcher for narrow viewports, where the rail folds under the page
	 * and its navigation widget would be a screen away. Sticky at the top of
	 * the scroll container; hidden by CSS above the rail-folds breakpoint.
	 */
	let { onsearch }: { onsearch: () => void } = $props();

	let hasSearch = $derived(
		$hearthConfig.rail.some((widget) => widget.type === 'search' && widget.hide_mobile !== true)
	);
</script>

<nav class="phone-nav" aria-label={$lang('hearth_pages')}>
	<div class="pages">
		{#each $hearthConfig.rooms as room (room.id)}
			<button
				type="button"
				class="page pressable"
				class:active={$currentRoom === room.id}
				aria-current={$currentRoom === room.id ? 'page' : undefined}
				onclick={() => currentRoom.set(room.id)}
			>
				<Icon name={room.icon} size={ICON.inline} />
				<span>{room.name}</span>
			</button>
		{/each}
	</div>
	{#if hasSearch && !$hearthEditMode}
		<button type="button" class="search pressable" aria-label={$lang('search')} onclick={onsearch}>
			<Icon name="search" size={ICON.control} />
		</button>
	{/if}
</nav>

<style>
	.phone-nav {
		display: none;
	}

	@media (max-width: 900px) {
		.phone-nav {
			min-width: 0;
			position: sticky;
			top: 0;
			z-index: var(--h-layer-bar);
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 0 calc(-1 * var(--h-pad-x));
			padding: 8px calc(12px + var(--h-pad-x));
			background: linear-gradient(180deg, var(--h-bg-1) 70%, transparent);
		}

		.pages {
			display: flex;
			gap: 8px;
			overflow-x: auto;
			scrollbar-width: none;
			flex: 1;
			min-width: 0;
			padding: 2px;
		}

		.pages::-webkit-scrollbar {
			display: none;
		}

		.page,
		.search {
			flex: none;
			display: flex;
			align-items: center;
			gap: 8px;
			min-height: 44px;
			padding: 0 14px;
			border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
			border-radius: var(--h-radius-pill);
			background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
			color: var(--h-text-3);
			font: inherit;
			font-size: var(--h-type-body);
			white-space: nowrap;
			cursor: pointer;
		}

		.search {
			width: 44px;
			padding: 0;
			justify-content: center;
		}

		.page.active {
			background: rgb(var(--h-accent-rgb) / calc(0.16 * var(--h-accent-scale)));
			border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
			color: var(--h-accent-text);
		}
	}
</style>
