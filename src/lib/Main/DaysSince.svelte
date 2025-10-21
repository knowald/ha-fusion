<script lang="ts">
	import { editMode, itemHeight, lang, ripple, timer, states } from '$lib/Stores';
	import Icon, { loadIcon } from '@iconify/svelte';
	import { openModal } from 'svelte-modals';
	import Ripple from 'svelte-ripple';

	export let sel: any;
	export let sectionName: string | undefined = undefined;

	$: icon = sel?.icon || 'mdi:calendar-clock';
	$: name = sel?.name || 'Days Since';
	$: color = sel?.color || 'rgb(75, 166, 237)';
	$: entity_id = sel?.entity_id;

	// Get timestamp from entity state
	$: entityState = entity_id ? $states?.[entity_id] : undefined;
	$: last_reset = entityState?.state;

	// Calculate days since last reset
	$: daysSince = calculateDaysSince(last_reset, $timer);

	function calculateDaysSince(lastReset: string | undefined, currentTime: Date): number {
		if (!lastReset) return 0;
		const resetDate = new Date(lastReset);
		const now = currentTime;
		const diffTime = Math.abs(now.getTime() - resetDate.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	// Icon is image if extension, e.g. test.png
	$: image = icon?.includes('.');

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/DaysSinceConfig.svelte'), {
				sel,
				sectionName
			});
		} else {
			// Open the modal for viewing/resetting
			openModal(() => import('$lib/Modal/DaysSinceModal.svelte'), {
				sel
			});
		}
	}
</script>

<div
	class="container"
	tabindex="-1"
	style:cursor={!$editMode ? 'pointer' : ''}
	style:min-height="{$itemHeight}px"
	on:click={handleClick}
	on:keydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}}
	role="button"
	use:Ripple={$ripple}
>
	<!-- ICON -->
	<div class="left">
		<div
			class="icon"
			style:--icon-color={color}
			style:background-color={color}
			style:background-image={image && icon ? `url(${icon})` : 'none'}
			class:image
		>
			{#if image}
				&nbsp;
			{:else if icon}
				{#await loadIcon(icon)}
					<Icon icon="mdi:calendar-clock" height="none" width="100%" />
				{:then resolvedIcon}
					<Icon icon={resolvedIcon} height="none" width="100%" />
				{:catch}
					<Icon icon="mdi:calendar-clock" height="none" width="100%" />
				{/await}
			{:else}
				<Icon icon="mdi:calendar-clock" height="none" width="100%" />
			{/if}
		</div>
	</div>

	<div class="right">
		<!-- NAME -->
		<div class="name">
			{name}
		</div>

		<!-- DAYS COUNT -->
		<div class="state">
			{#if daysSince === 0}
				{$lang('today') || 'Today'}
			{:else if daysSince === 1}
				1 {$lang('day') || 'day'}
			{:else}
				{daysSince} {$lang('days') || 'days'}
			{/if}
		</div>
	</div>
</div>

<style>
	.container {
		background-color: var(--theme-button-background-color-off);
		font-family: inherit;
		width: 100%;
		height: 100%;
		display: grid;
		border-radius: 0.65rem;
		margin: 0;
		grid-template-columns: min-content auto;
		grid-auto-flow: row;
		grid-template-areas: 'left right';
		--container-padding: 0.72rem;

		/* fix ripple */
		transform: translateZ(0);
		overflow: hidden;
	}

	.image {
		background-size: cover;
		background-repeat: no-repeat;
	}

	.left {
		display: inherit;
		padding: var(--container-padding);
	}

	.right {
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
		padding-right: var(--container-padding);
	}

	.icon {
		--icon-size: 2.4rem;
		height: var(--icon-size);
		width: var(--icon-size);
		color: white;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: 50%;
		display: grid;
		align-items: center;
		display: flex;
		padding: 0.5rem;
		background-position: center center;
		background-size: cover;
		background-repeat: no-repeat;
	}

	.name {
		font-weight: 500;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.95rem;
		margin-top: -1px;
	}

	.state {
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--theme-button-state-color-off);
		font-size: 0.925rem;
		margin-top: 1px;
	}

	/* Phone and Tablet (portrait) */
	@media all and (max-width: 768px) {
		.container {
			width: calc(50vw - 1.45rem);
		}
	}
</style>
