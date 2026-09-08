<script lang="ts">
	import { ICON } from '../iconSizes';
	import { fade } from 'svelte/transition';
	import { motion } from '$lib/core/app/motion';
	import { connected } from '$lib/core/ha/connection';
	import { commandFailure, dismissCommandFailure } from '$lib/core/ha/commands';
	import { lang } from '$lib/core/i18n';
	import { hearthEditMode, hearthLoadError, saveState } from '../store';
	import Icon from '../Icon.svelte';

	/** How far the current fill-screen page overflows while editing, in px. */
	let { overflowBy = 0 }: { overflowBy?: number } = $props();

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
</script>

{#if showDisconnected}
	<div class="connection-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
		<Icon name="cloud_off" size={ICON.control} />
		{$lang('hearth_connection_lost')}
	</div>
{/if}
{#if $hearthLoadError}
	<div class="load-error" role="alert">
		<Icon name="error" size={ICON.control} />
		<div>
			<strong>{$lang('hearth_config_unreadable')}</strong>
			<span>{$hearthLoadError}</span>
			<span>{$lang('hearth_editing_is_disabled_to_protect_the')}</span>
		</div>
	</div>
{/if}
{#if $saveState === 'saved'}
	<div class="save-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
		<Icon name="check_circle" size={ICON.control} />
		{$lang('saved')}
	</div>
{/if}
{#if $commandFailure}
	<div
		class="command-error"
		class:editing={$hearthEditMode}
		role="alert"
		transition:fade={{ duration: $motion ? 250 : 0 }}
	>
		<Icon name="error" size={ICON.control} />
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
			<Icon name="close" size={ICON.control} />
		</button>
	</div>
{/if}
{#if overflowBy > 0}
	<div class="overflow-toast" transition:fade={{ duration: $motion ? 250 : 0 }}>
		<Icon name="unfold_less" size={ICON.control} />
		{$lang('hearth_page_overflows_this_screen_by')}
		{overflowBy}px
	</div>
{/if}

<style>
	.connection-toast {
		position: absolute;
		top: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--h-layer-toast);
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-bad-text);
		font-size: var(--h-type-body);
		font-weight: 600;
		box-shadow: 0 20px 60px var(--h-scrim);
	}

	.load-error {
		position: absolute;
		top: calc(18px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: calc(var(--h-layer-toast) + 2);
		display: flex;
		align-items: flex-start;
		gap: 10px;
		width: min(620px, calc(100vw - 32px));
		padding: 14px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-bad-rgb) / 0.5);
		color: var(--h-bad-text);
		box-shadow: 0 20px 60px var(--h-scrim);
	}

	.load-error div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.load-error strong {
		font-size: var(--h-type-body);
	}

	.load-error span {
		font-size: var(--h-type-small);
		overflow-wrap: anywhere;
	}

	.save-toast {
		position: absolute;
		bottom: calc(40px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--h-layer-toast);
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-good-text);
		font-size: var(--h-type-body);
		font-weight: 600;
		box-shadow: 0 20px 60px var(--h-scrim);
	}

	.command-error {
		position: absolute;
		bottom: calc(40px + var(--h-pad-y));
		left: 50%;
		transform: translateX(-50%);
		z-index: calc(var(--h-layer-toast) + 3);
		display: flex;
		align-items: flex-start;
		gap: 10px;
		width: min(560px, calc(100vw - 32px));
		padding: 12px 12px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-bad-rgb) / 0.55);
		color: var(--h-bad-text);
		box-shadow: 0 20px 60px var(--h-scrim);
	}

	.command-error > div {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
	}

	.command-error strong {
		font-size: var(--h-type-body);
	}

	.command-error span {
		font-size: var(--h-type-small);
		overflow-wrap: anywhere;
	}

	.toast-dismiss {
		display: inline-flex;
		padding: 4px;
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
		z-index: var(--h-layer-toast);
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: var(--h-radius-md);
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		color: var(--h-accent-text);
		font-size: var(--h-type-body);
		font-weight: 600;
		box-shadow: 0 20px 60px var(--h-scrim);
	}
	/* the edit bar sits along the bottom while editing; the toast moves above it */
	.command-error.editing {
		bottom: calc(104px + var(--h-pad-y)); /* literal ok: edit bar height plus its gap */
	}
</style>
