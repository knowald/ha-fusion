<script lang="ts">
	import {
		cancelEdit,
		canRedo,
		canUndo,
		currentRoom,
		editor,
		enterEditMode,
		hearthConfig,
		hearthEditMode,
		redoConfig,
		saveEdit,
		saveState,
		undoConfig
	} from './store';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import Ripple from '$lib/Actions/ripple';
	import {
		PRESS_RIPPLE,
		THEME_BRIDGE_CSS,
		THEME_DEFAULTS,
		THEME_PRESETS,
		themeStyle,
		type HearthTheme
	} from './config';
	import ControlPopup from './ControlPopup.svelte';
	import EditorHost from './edit/EditorHost.svelte';
	import HomeOverview from './HomeOverview.svelte';
	import Icon from './Icon.svelte';
	import Rail from './Rail.svelte';
	import RoomDetail from './RoomDetail.svelte';
	import Screensaver from './Screensaver.svelte';
	import SetupWizard from './SetupWizard.svelte';
	import { wakeLock } from './wakeLock';

	let showSetupWizard = $state(false);

	let roomExists = $derived(
		$currentRoom === 'home' || $hearthConfig.rooms.some((room) => room.id === $currentRoom)
	);

	async function handleSave() {
		$saveState = 'idle';
		try {
			await saveEdit();
		} catch (error) {
			console.error(error);
			$saveState = 'error';
		}
	}

	// display-only theme override via ?theme=<preset id>: the matched preset
	// entry (theme null = default look) replaces the stored theme without
	// touching the config or undo history
	let presetOverride = $state<{ theme: HearthTheme | null } | undefined>(undefined);

	onMount(() => {
		const presetId = new URLSearchParams(location.search).get('theme');
		presetOverride = THEME_PRESETS.find((preset) => preset.id === presetId);
	});

	// the override would mask theme edits, so drop it while editing
	$effect(() => {
		if ($hearthEditMode) presetOverride = undefined;
	});

	let activeTheme = $derived(
		presetOverride ? (presetOverride.theme ?? undefined) : $hearthConfig.theme
	);

	// tokens live on :root (not .frame) so modals portaled outside the frame
	// resolve them too; base first, user theme overrides second
	let rootCss = $derived(
		`:root { ${themeStyle(THEME_DEFAULTS)} ${themeStyle(activeTheme)} ${THEME_BRIDGE_CSS} ` +
			`--h-pad-x: ${Math.max(0, $hearthConfig.padding_x ?? 0)}px; ` +
			`--h-pad-y: ${Math.max(0, $hearthConfig.padding_y ?? 0)}px; }`
	);

	function handleKeydown(event: KeyboardEvent) {
		if (!$hearthEditMode || !(event.metaKey || event.ctrlKey)) return;
		const target = event.target as HTMLElement;
		const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
		if (event.key === 's') {
			event.preventDefault();
			handleSave();
		} else if (event.key.toLowerCase() === 'z' && !typing) {
			event.preventDefault();
			if (event.shiftKey) redoConfig();
			else undoConfig();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	{@html `<style>${rootCss}</style>`}
</svelte:head>

<section class="frame" use:wakeLock={$hearthConfig.keep_screen_on ?? true}>
	<div class="layout" class:editing={$hearthEditMode}>
		<div class="rail-scroll">
			<Rail />
		</div>
		<main class="main">
			{#if $currentRoom === 'home' || !roomExists}
				<HomeOverview />
			{:else}
				<RoomDetail roomId={$currentRoom} />
			{/if}
		</main>
	</div>
	<ControlPopup />
	<EditorHost />
	{#if ($hearthConfig.screensaver_minutes ?? 0) > 0}
		<Screensaver minutes={$hearthConfig.screensaver_minutes} />
	{/if}
	{#if showSetupWizard}
		<SetupWizard onclose={() => (showSetupWizard = false)} />
	{/if}
	{#if $saveState === 'saved'}
		<div class="save-toast" transition:fade={{ duration: 250 }}>
			<Icon name="check_circle" size={18} />
			Saved
		</div>
	{/if}
	{#if $hearthEditMode}
		<div class="edit-bar">
			{#if $saveState === 'conflict'}
				<span class="save-error">Config changed elsewhere</span>
				<div
					class="bar-button pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => location.reload()}
				>
					Reload
				</div>
			{:else if $saveState === 'error'}
				<span class="save-error">Save failed</span>
			{/if}
			<span class="bar-icon pressable" onclick={() => (showSetupWizard = true)}>
				<Icon name="auto_awesome" size={20} />
			</span>
			<span class="bar-icon pressable" onclick={() => editor.set({ kind: 'settings' })}>
				<Icon name="settings" size={20} />
			</span>
			<span class="bar-icon pressable" onclick={() => editor.set({ kind: 'theme' })}>
				<Icon name="palette" size={20} />
			</span>
			<span class="bar-icon" class:disabled={!$canUndo} onclick={undoConfig}>
				<Icon name="undo" size={20} />
			</span>
			<span class="bar-icon" class:disabled={!$canRedo} onclick={redoConfig}>
				<Icon name="redo" size={20} />
			</span>
			<div class="bar-button pressable" use:Ripple={PRESS_RIPPLE} onclick={cancelEdit}>Cancel</div>
			<div class="bar-button primary pressable" use:Ripple={PRESS_RIPPLE} onclick={handleSave}>
				Save
			</div>
		</div>
	{:else}
		<div class="edit-toggle pressable" onclick={enterEditMode}>
			<Icon name="edit" size={18} />
		</div>
	{/if}
</section>

<style>
	/* shared touch feedback for everything tappable: scale + amber glow that
	   fades back out after release (transition, so quick taps complete) */
	.frame :global(.pressable) {
		transition:
			transform 120ms ease,
			filter 350ms ease;
	}

	.frame :global(.pressable:active) {
		transform: scale(0.96);
		filter: drop-shadow(0 0 9px rgb(var(--h-accent-rgb) / 0.45));
		transition:
			transform 120ms ease,
			filter 60ms ease;
	}

	/* command sent, waiting for the entity to confirm */
	.frame :global(.pending) {
		animation: hearth-pending 1.1s ease-in-out infinite;
	}

	@keyframes -global-hearth-pending {
		0%,
		100% {
			filter: drop-shadow(0 0 0 rgb(var(--h-accent-rgb) / 0));
			opacity: 1;
		}
		50% {
			filter: drop-shadow(0 0 10px rgb(var(--h-accent-rgb) / 0.55));
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

	/* scroll containers clip on both axes, which would crop the tiles' glow -
	   the padding/negative-margin pair moves the clip edge outward */
	.rail-scroll {
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
		display: flex;
		flex-direction: column;
		padding: 16px;
		margin: -16px;
	}

	.rail-scroll::-webkit-scrollbar {
		display: none;
	}

	.main {
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
		padding: 16px;
		margin: -16px;
	}

	.main::-webkit-scrollbar {
		display: none;
	}

	/* keep scrolled content clear of the floating save bar */
	.layout.editing :global(.main > *),
	.layout.editing .rail-scroll :global(.rail) {
		padding-bottom: 76px;
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
	}

	.edit-toggle {
		position: absolute;
		right: calc(14px + var(--h-pad-x));
		bottom: calc(14px + var(--h-pad-y));
		z-index: 30;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--h-radius-xs);
		color: var(--h-text-6);
		cursor: pointer;
		opacity: 0.6;
	}

	.edit-toggle:hover {
		opacity: 1;
		color: var(--h-text-3);
		background: rgb(var(--h-surface-rgb) / 0.06);
	}

	.edit-bar {
		position: absolute;
		bottom: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.save-toast {
		position: absolute;
		bottom: calc(84px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		color: var(--h-good-text);
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.save-error {
		font-size: 13px;
		color: var(--h-bad-text);
		padding: 0 8px;
	}

	.bar-icon {
		display: inline-flex;
		color: var(--h-text-3);
		cursor: pointer;
		padding: 4px;
	}

	.bar-icon.disabled {
		color: var(--h-icon-dim);
		cursor: default;
	}

	.bar-button {
		padding: 10px 20px;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		color: var(--h-text-3);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		user-select: none;
		-webkit-user-select: none;
	}

	.bar-button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
	}
</style>
