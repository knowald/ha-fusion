<script lang="ts">
	import { fade } from 'svelte/transition';
	import { motion } from '$lib/core/app/motion';
	import { connected } from '$lib/core/ha/connection';
	import { commandFailure, dismissCommandFailure } from '$lib/core/ha/commands';
	import { lang } from '$lib/core/i18n';
	import { hearthLoadError, saveState } from '../store';
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
			<span>{$lang('hearth_editing_is_disabled_to_protect_the')}</span>
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
</style>
