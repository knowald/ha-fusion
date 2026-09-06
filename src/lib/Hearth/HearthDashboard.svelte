<script lang="ts">
	import { onMount } from 'svelte';
	import { mirrorLegacyEditMode } from '$lib/legacy/bridge/editMode';
	import { THEME_PRESETS, type HearthTheme } from '$lib/core/theme';
	import {
		currentRoom,
		hearthConfig,
		hearthEditMode,
		hearthLoadError,
		hearthNeedsSetup
	} from './store';
	import ControlPopup from './ControlPopup.svelte';
	import Rail from './Rail.svelte';
	import RoomDetail from './RoomDetail.svelte';
	import Screensaver from './Screensaver.svelte';
	import SearchOverlay from './SearchOverlay.svelte';
	import SetupWizard from './SetupWizard.svelte';
	import ConfirmDialog from './shell/ConfirmDialog.svelte';
	import EditBar from './shell/EditBar.svelte';
	import Keyboard from './shell/Keyboard.svelte';
	import ThemeStyle from './shell/ThemeStyle.svelte';
	import Toasts from './shell/Toasts.svelte';
	import { wakeLock } from './wakeLock';

	let showSetupWizard = $state(false);
	let showSearch = $state(false);

	$effect(() => mirrorLegacyEditMode($hearthEditMode));

	// the selected page, or the first one when it was renamed away or deleted
	let activeRoomId = $derived(
		$hearthConfig.rooms.some((room) => room.id === $currentRoom)
			? $currentRoom
			: ($hearthConfig.rooms[0]?.id ?? '')
	);

	let activeRoom = $derived($hearthConfig.rooms.find((room) => room.id === activeRoomId));

	// a fill page clips whatever does not fit, which is invisible until you walk
	// to the tablet - so while editing, measure and say by how much
	let mainElement = $state<HTMLElement | undefined>();
	let overflowBy = $state(0);

	$effect(() => {
		if (!mainElement || !$hearthEditMode || !activeRoom?.fill_screen) {
			overflowBy = 0;
			return;
		}
		const element = mainElement;
		// the clipping happens per column, not on <main>, so <main> always looks
		// like it fits - measure the columns and report the worst one
		const measure = () => {
			// a column can overflow, and so can a filling card clipping its own
			// grid - report whichever is worse
			const clipped = [...element.querySelectorAll<HTMLElement>('.column, .card-slot')];
			overflowBy = clipped.reduce(
				(worst, node) => Math.max(worst, node.scrollHeight - node.clientHeight),
				Math.max(0, element.scrollHeight - element.clientHeight)
			);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		for (const node of element.querySelectorAll('.column, .card-slot')) observer.observe(node);
		return () => observer.disconnect();
	});

	// keep the selection on the page actually being rendered, so the rail
	// highlights it and editor targets resolve against it
	$effect(() => {
		if (activeRoomId && activeRoomId !== $currentRoom) currentRoom.set(activeRoomId);
	});

	// display-only theme override via ?theme=<preset id>: the matched preset
	// entry (theme null = default look) replaces the stored theme without
	// touching the config or undo history
	let presetOverride = $state<{ theme: HearthTheme | null } | undefined>(undefined);

	// ?menu=false hides the edit-toggle pencil for kiosk frames; edit mode
	// stays reachable if already active, it just can't be entered from here
	let hideEditToggle = $state(false);

	onMount(() => {
		const params = new URLSearchParams(location.search);
		if ($hearthNeedsSetup && !$hearthLoadError) showSetupWizard = true;

		const presetId = params.get('theme');
		presetOverride = THEME_PRESETS.find((preset) => preset.id === presetId);

		const roomId = params.get('room');
		if (roomId && $hearthConfig.rooms.some((room) => room.id === roomId)) {
			currentRoom.set(roomId);
		}

		hideEditToggle = params.get('menu') === 'false';
	});

	// the override would mask theme edits, so drop it while editing
	$effect(() => {
		if ($hearthEditMode) presetOverride = undefined;
	});

	// the search overlay only opens outside edit mode; entering edit mode
	// while it happens to be open (not reachable via the UI today, but cheap
	// to guard) closes it rather than leaving it stranded above the edit bar
	$effect(() => {
		if ($hearthEditMode) showSearch = false;
	});
</script>

<Keyboard searchOpen={showSearch} onsearch={() => (showSearch = true)} />
<ThemeStyle {presetOverride} />

<section class="frame" use:wakeLock={$hearthConfig.keep_screen_on ?? true}>
	<div class="layout">
		<div class="rail-scroll">
			<Rail onsearch={() => (showSearch = true)} />
		</div>
		<main class="main" class:fill={activeRoom?.fill_screen} bind:this={mainElement}>
			<RoomDetail roomId={activeRoomId} fillScreen={activeRoom?.fill_screen ?? false} />
		</main>
	</div>
	<ControlPopup />
	{#if $hearthEditMode}
		<!-- the edit sheets and their editors load with edit mode, not the dashboard -->
		{#await import('./edit/EditorHost.svelte') then EditorHost}
			<EditorHost.default />
		{/await}
	{/if}
	{#if showSearch}
		<SearchOverlay onclose={() => (showSearch = false)} />
	{/if}
	{#if ($hearthConfig.screensaver_minutes ?? 0) > 0}
		<Screensaver minutes={$hearthConfig.screensaver_minutes} />
	{/if}
	{#if showSetupWizard}
		<SetupWizard onclose={() => (showSetupWizard = false)} />
	{/if}
	<ConfirmDialog />
	<Toasts {overflowBy} />
	<EditBar {hideEditToggle} onsetup={() => (showSetupWizard = true)} />
</section>

<style>
	.frame :global(.pressable:active) {
		transform: scale(0.96);
		filter: drop-shadow(0 0 9px rgb(var(--h-accent-rgb) / calc(0.45 * var(--h-accent-scale))));
		transition:
			transform 120ms ease,
			filter 60ms ease;
	}

	@keyframes -global-hearth-pending {
		0%,
		100% {
			filter: drop-shadow(0 0 0 rgb(var(--h-accent-rgb) / calc(0 * var(--h-accent-scale))));
			opacity: 1;
		}
		50% {
			filter: drop-shadow(0 0 10px rgb(var(--h-accent-rgb) / calc(0.55 * var(--h-accent-scale))));
			opacity: 0.88;
		}
	}

	.frame {
		/* theme tokens are injected on :root via svelte:head (see rootCss) so
		   portaled modals resolve them too */
		width: 100%;
		height: 100dvh;
		position: relative;
		overflow: hidden;
		background:
			var(--h-bg-image), radial-gradient(1000px 700px at 14% -5%, var(--h-bg-0), var(--h-bg-1) 62%);
		background-size: cover;
		background-position: center;
		color: var(--h-text-1);
		font-family: var(--h-font-ui);
	}

	.layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 30px;
		padding: calc(40px + var(--h-pad-y)) calc(40px + var(--h-pad-x));
		height: 100%;
	}

	.rail-scroll::-webkit-scrollbar {
		display: none;
	}

	.main {
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
		padding: 30px;
		margin: -30px;
	}

	.main::-webkit-scrollbar {
		display: none;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
			padding: calc(24px + var(--h-pad-y)) calc(24px + var(--h-pad-x));
			gap: 24px;
			overflow-y: auto;
		}

		.rail-scroll,
		.main {
			overflow-y: visible;
			min-height: auto;
		}

		/* On short wall tablets the active page is the primary glance surface;
		   the rail follows it instead of consuming the entire first viewport. */
		.main {
			order: 1;
		}

		.main.fill {
			overflow-y: visible;
		}

		.rail-scroll {
			order: 2;
		}
	}
</style>
