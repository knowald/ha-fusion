<script lang="ts">
	import {
		cancelEdit,
		canRedo,
		canUndo,
		commandFailure,
		confirmRequestedAction,
		currentRoom,
		dismissCommandFailure,
		dismissConfirmation,
		editedThemeSlot,
		editor,
		enterEditMode,
		hearthConfig,
		hearthEditMode,
		hearthLoadError,
		hearthNeedsSetup,
		openPopovers,
		requestConfirmation,
		requestedConfirmation,
		redoConfig,
		saveEdit,
		saveState,
		undoConfig
	} from './store';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { connected, editMode as fusionEditMode, lang, motion, states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import {
		isNightState,
		PRESS_RIPPLE,
		THEME_BRIDGE_CSS,
		THEME_DEFAULTS,
		THEME_PRESETS,
		themeStyle,
		type HearthTheme
	} from './config';
	import ControlPopup from './ControlPopup.svelte';
	import EditorHost from './edit/EditorHost.svelte';
	import Icon from './Icon.svelte';
	import Rail from './Rail.svelte';
	import RoomDetail from './RoomDetail.svelte';
	import Screensaver from './Screensaver.svelte';
	import SearchOverlay from './SearchOverlay.svelte';
	import SetupWizard from './SetupWizard.svelte';
	import { wakeLock } from './wakeLock';

	let showSetupWizard = $state(false);
	let showSearch = $state(false);

	// Fusion embeds still consult the legacy edit-mode store before sending
	// services. Mirror Hearth's mode while this route is mounted so embedded
	// objects obey the same safety boundary as native Hearth controls.
	$effect(() => {
		fusionEditMode.set($hearthEditMode);
		return () => fusionEditMode.set(false);
	});

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

	async function handleSave(force = false) {
		$saveState = 'idle';
		try {
			await saveEdit(force);
		} catch (error) {
			console.error(error);
			$saveState = 'error';
		}
	}

	async function copySessionEdits() {
		const text = JSON.stringify($hearthConfig, null, 2);
		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(text);
			} else {
				const area = document.createElement('textarea');
				area.value = text;
				area.style.position = 'fixed';
				area.style.opacity = '0';
				document.body.append(area);
				area.select();
				document.execCommand('copy');
				area.remove();
			}
		} catch (error) {
			console.error(error);
			$saveState = 'error';
		}
	}

	function confirmOverwrite() {
		requestConfirmation({
			title: 'Overwrite newer Hearth configuration?',
			message: 'This replaces the version saved by the other session with your current edits.',
			confirmLabel: 'Overwrite',
			action: () => void handleSave(true)
		});
	}

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

	// only surface a disconnect once it has lasted 2s, so brief websocket
	// blips (reload, sleep/wake) don't flash the banner
	let showDisconnected = $state(false);

	$effect(() => {
		if ($connected) {
			showDisconnected = false;
			return;
		}
		const timer = setTimeout(() => (showDisconnected = true), 2000);
		return () => clearTimeout(timer);
	});

	// While editing, preview the selected slot. At runtime the configured HA
	// entity decides whether the full day or night theme is active.
	let night = $derived(
		$hearthEditMode && $editor?.kind === 'theme'
			? $editedThemeSlot === 'night'
			: isNightState(
					$states?.[$hearthConfig.day_night?.entity ?? '']?.state,
					$hearthConfig.day_night
				)
	);

	let storedTheme = $derived(
		night ? ($hearthConfig.theme_night ?? $hearthConfig.theme) : $hearthConfig.theme
	);

	let activeTheme = $derived(presetOverride ? (presetOverride.theme ?? undefined) : storedTheme);

	// CSS custom properties do not transition by themselves. Briefly blanket
	// the rendered tree when the switch changes, then release component styles.
	let lastNight: boolean | undefined;

	$effect(() => {
		const switched = lastNight !== undefined && lastNight !== night;
		lastNight = night;
		if (!switched || !$motion) return;
		const root = document.documentElement;
		root.classList.add('theme-fade');
		const timer = setTimeout(() => root.classList.remove('theme-fade'), 700);
		return () => {
			clearTimeout(timer);
			root.classList.remove('theme-fade');
		};
	});

	// tokens live on :root (not .frame) so modals portaled outside the frame
	// resolve them too; base first, user theme overrides second
	let rootCss = $derived(
		`:root { ${themeStyle(THEME_DEFAULTS)} ${themeStyle(activeTheme)} ${THEME_BRIDGE_CSS} ` +
			`--h-pad-x: ${Math.max(0, $hearthConfig.padding_x ?? 0)}px; ` +
			`--h-pad-y: ${Math.max(0, $hearthConfig.padding_y ?? 0)}px; }`
	);

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

		if (
			!typing &&
			!$hearthEditMode &&
			$hearthConfig.rail.some((widget) => widget.type === 'search') &&
			!showSearch &&
			!$openPopovers &&
			event.key === 'f' &&
			!event.metaKey &&
			!event.ctrlKey &&
			!event.altKey
		) {
			event.preventDefault();
			showSearch = true;
			return;
		}

		if (!$hearthEditMode || !(event.metaKey || event.ctrlKey)) return;
		// an open edit sheet owns these: saving would drop its unsubmitted form and
		// undo would shift the card it is bound to out from under it
		if ($editor) return;
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
	<div class="layout">
		<div class="rail-scroll">
			<Rail onsearch={() => (showSearch = true)} />
		</div>
		<main class="main" class:fill={activeRoom?.fill_screen} bind:this={mainElement}>
			<RoomDetail roomId={activeRoomId} fillScreen={activeRoom?.fill_screen ?? false} />
		</main>
	</div>
	<ControlPopup />
	<EditorHost />
	{#if showSearch}
		<SearchOverlay onclose={() => (showSearch = false)} />
	{/if}
	{#if ($hearthConfig.screensaver_minutes ?? 0) > 0}
		<Screensaver minutes={$hearthConfig.screensaver_minutes} />
	{/if}
	{#if showSetupWizard}
		<SetupWizard onclose={() => (showSetupWizard = false)} />
	{/if}
	{#if $requestedConfirmation}
		<div
			class="confirm-backdrop"
			role="presentation"
			onclick={(event) => event.target === event.currentTarget && dismissConfirmation()}
		>
			<div
				class="confirm-dialog"
				role="alertdialog"
				tabindex="-1"
				aria-modal="true"
				aria-labelledby="hearth-confirm-title"
			>
				<Icon name="warning" size={28} color="var(--h-bad-text)" />
				<div class="confirm-copy">
					<strong id="hearth-confirm-title">{$requestedConfirmation.title}</strong>
					<span>{$requestedConfirmation.message}</span>
				</div>
				<div class="confirm-actions">
					<button type="button" class="confirm-button" onclick={dismissConfirmation}>
						{$lang('cancel')}
					</button>
					<button type="button" class="confirm-button dangerous" onclick={confirmRequestedAction}>
						{$requestedConfirmation.confirmLabel}
					</button>
				</div>
			</div>
		</div>
	{/if}
	{#if showDisconnected}
		<div class="connection-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
			<Icon name="cloud_off" size={18} />
			{$lang('hearth_connection_lost')}
		</div>
	{/if}
	{#if $hearthLoadError}
		<div class="load-error" role="alert">
			<Icon name="error" size={20} />
			<div>
				<strong>{$lang('hearth_config_unreadable')}</strong>
				<span>{$hearthLoadError}</span>
				<span>Editing is disabled to protect the existing file.</span>
			</div>
		</div>
	{/if}
	{#if $saveState === 'saved'}
		<div class="save-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
			<Icon name="check_circle" size={18} />
			{$lang('saved')}
		</div>
	{/if}
	{#if $commandFailure}
		<div class="command-error" role="alert" transition:fade={{ duration: $motion ? 250 : 0 }}>
			<Icon name="error" size={18} />
			<div>
				<strong>{$lang('hearth_command_failed')}</strong>
				<span>
					{#if $commandFailure.entityId}{$commandFailure.entityId}:
					{/if}{$commandFailure.detail}
				</span>
			</div>
			<button
				type="button"
				class="toast-dismiss"
				aria-label={$lang('hearth_close')}
				onclick={dismissCommandFailure}
			>
				<Icon name="close" size={18} />
			</button>
		</div>
	{/if}
	{#if overflowBy > 0}
		<div class="overflow-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
			<Icon name="unfold_less" size={18} />
			Page overflows this screen by {overflowBy}px
		</div>
	{/if}
	{#if $hearthEditMode}
		<div class="edit-bar">
			{#if $saveState === 'conflict'}
				<span class="save-error">{$lang('hearth_config_changed')}</span>
				<button
					type="button"
					class="bar-button pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={copySessionEdits}
				>
					Copy edits
				</button>
				<button
					type="button"
					class="bar-button dangerous pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={confirmOverwrite}
				>
					Overwrite
				</button>
				<button
					type="button"
					class="bar-button pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => location.reload()}
				>
					{$lang('hearth_reload')}
				</button>
			{:else if $saveState === 'error'}
				<span class="save-error">{$lang('hearth_save_failed')}</span>
			{/if}
			<button
				type="button"
				class="bar-icon pressable"
				aria-label={$lang('hearth_setup')}
				onclick={() => (showSetupWizard = true)}
			>
				<Icon name="auto_awesome" size={20} />
			</button>
			<button
				type="button"
				class="bar-icon pressable"
				aria-label={$lang('settings')}
				onclick={() => editor.set({ kind: 'settings' })}
			>
				<Icon name="settings" size={20} />
			</button>
			<button
				type="button"
				class="bar-icon pressable"
				aria-label={$lang('theme')}
				onclick={() => editor.set({ kind: 'theme' })}
			>
				<Icon name="palette" size={20} />
			</button>
			<button
				type="button"
				class="bar-icon"
				disabled={!$canUndo}
				aria-label={$lang('undo')}
				onclick={undoConfig}
			>
				<Icon name="undo" size={20} />
			</button>
			<button
				type="button"
				class="bar-icon"
				disabled={!$canRedo}
				aria-label={$lang('hearth_redo')}
				onclick={redoConfig}
			>
				<Icon name="redo" size={20} />
			</button>
			<button
				type="button"
				class="bar-button pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={cancelEdit}>{$lang('cancel')}</button
			>
			<button
				type="button"
				class="bar-button primary pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => handleSave()}>{$lang('save')}</button
			>
		</div>
	{:else if !hideEditToggle && !$hearthLoadError}
		<button
			type="button"
			class="edit-toggle pressable"
			aria-label={$lang('hearth_edit_configuration')}
			onclick={enterEditMode}
		>
			<Icon name="edit" size={18} />
			<span>Edit dashboard</span>
		</button>
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
		filter: drop-shadow(0 0 9px rgb(var(--h-accent-rgb) / calc(0.45 * var(--h-accent-scale))));
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
			filter: drop-shadow(0 0 0 rgb(var(--h-accent-rgb) / calc(0 * var(--h-accent-scale))));
			opacity: 1;
		}
		50% {
			filter: drop-shadow(0 0 10px rgb(var(--h-accent-rgb) / calc(0.55 * var(--h-accent-scale))));
			opacity: 0.88;
		}
	}

	/* Theme changes animate only the composited dashboard backdrop. Descendant
	   tokens switch atomically instead of forcing a four-property repaint of
	   every node in the tree. */
	:global(html.theme-fade) .frame {
		transition:
			background-color 600ms ease,
			color 600ms ease;
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

	.confirm-backdrop {
		position: absolute;
		inset: 0;
		z-index: 90;
		display: grid;
		place-items: center;
		padding: 20px;
		background: rgba(0, 0, 0, 0.58);
		backdrop-filter: blur(8px);
	}

	.confirm-dialog {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 14px;
		width: min(430px, 100%);
		padding: 20px;
		border-radius: var(--h-radius-lg);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-bad-rgb) / 0.48);
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
	}

	.confirm-copy {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.confirm-copy strong {
		font-size: 18px;
		color: var(--h-text-1);
	}

	.confirm-copy span {
		font-size: 14px;
		color: var(--h-text-4);
	}

	.confirm-actions {
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 6px;
	}

	.confirm-button {
		min-height: 44px;
		padding: 9px 18px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / 0.15);
		background: rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-text-2);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.confirm-button.dangerous {
		border-color: rgb(var(--h-bad-rgb) / 0.55);
		background: rgb(var(--h-bad-rgb) / 0.16);
		color: var(--h-bad-text);
	}

	.layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 30px;
		padding: calc(40px + var(--h-pad-y)) calc(40px + var(--h-pad-x));
		height: 100%;
	}

	/* scroll containers clip on both axes, which would crop the tiles' glow -
	   the padding/negative-margin pair moves the clip edge outward. The offset
	   matches the column gap so the widest glow (30px blur) fades out before
	   the clip edge without either box painting into its neighbour's content. */
	.rail-scroll {
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
		display: flex;
		flex-direction: column;
		padding: 30px;
		margin: -30px;
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

	/* Filling cards absorb leftover height, but unexpected runtime overflow
	   remains scrollable instead of making controls unreachable. */
	.main.fill {
		overflow-y: auto;
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

	/* a labeled row at the rail's foot rather than an anonymous floating pencil */
	.edit-toggle {
		position: absolute;
		left: calc(14px + var(--h-pad-x));
		bottom: calc(14px + var(--h-pad-y));
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 11px 15px;
		border-radius: var(--h-radius-sm);
		color: var(--h-text-4);
		font-size: 13.5px;
		cursor: pointer;
		opacity: 0.75;
		border: 0;
		background: rgb(var(--h-surface-rgb) / calc(0.035 * var(--h-fill-scale)));
		font-family: inherit;
	}

	.edit-toggle:hover {
		opacity: 1;
		color: var(--h-text-3);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
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
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.connection-toast {
		position: absolute;
		top: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-bad-text);
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.load-error {
		position: absolute;
		top: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 42;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		width: min(620px, calc(100vw - 32px));
		padding: 14px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-bad-rgb) / 0.5);
		color: var(--h-bad-text);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.load-error div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.load-error strong {
		font-size: 14px;
	}

	.load-error span {
		font-size: 12px;
		overflow-wrap: anywhere;
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
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-good-text);
		font-size: 14px;
		font-weight: 600;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.command-error {
		position: absolute;
		bottom: calc(84px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 43;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		width: min(560px, calc(100vw - 32px));
		padding: 11px 12px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-bad-rgb) / 0.55);
		color: var(--h-bad-text);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.command-error > div {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	.command-error strong {
		font-size: 14px;
	}

	.command-error span {
		font-size: 12px;
		overflow-wrap: anywhere;
	}

	.toast-dismiss {
		display: inline-flex;
		padding: 3px;
		border: 0;
		background: none;
		color: inherit;
		cursor: pointer;
	}

	.overflow-toast {
		position: absolute;
		top: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-accent-text);
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
		border: 0;
		background: none;
		font: inherit;
	}

	.bar-icon:disabled {
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
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		user-select: none;
		-webkit-user-select: none;
		font-family: inherit;
	}

	.bar-button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		border: none;
		color: var(--h-on-accent);
	}

	.bar-button.dangerous {
		color: var(--h-bad-text);
		border-color: rgb(var(--h-bad-rgb) / 0.35);
	}
</style>
