<script lang="ts">
	import Ripple from '$lib/ui/actions/ripple';
	import { lang } from '$lib/core/i18n';
	import { PRESS_RIPPLE } from '../config';
	import {
		cancelEdit,
		canRedo,
		canUndo,
		editor,
		enterEditMode,
		hearthConfig,
		hearthEditMode,
		hearthLoadError,
		redoConfig,
		requestConfirmation,
		saveState,
		saveFailure,
		saveWithFeedback,
		undoConfig
	} from '../store';
	import Icon from '../Icon.svelte';

	let { hideEditToggle = false, onsetup }: { hideEditToggle?: boolean; onsetup: () => void } =
		$props();

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
			title: $lang('hearth_overwrite_newer_hearth_configuration'),
			message: $lang('hearth_this_replaces_the_version_saved_by'),
			confirmLabel: $lang('hearth_overwrite'),
			action: () => void saveWithFeedback(true)
		});
	}
</script>

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
				{$lang('hearth_copy_edits')}
			</button>
			<button
				type="button"
				class="bar-button dangerous pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={confirmOverwrite}
			>
				{$lang('hearth_overwrite')}
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
			<span class="save-error">
				{$lang('hearth_save_failed')}{#if $saveFailure}: {$saveFailure}{/if}
			</span>
		{/if}
		<button
			type="button"
			class="bar-icon pressable"
			aria-label={$lang('hearth_setup')}
			onclick={onsetup}
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
			onclick={() => saveWithFeedback()}>{$lang('save')}</button
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
		<span>{$lang('hearth_edit_configuration')}</span>
	</button>
{/if}

<style>
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
