<script lang="ts">
	import { ICON } from '../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { confirmRequestedAction, dismissConfirmation, requestedConfirmation } from '../store';
	import Icon from '../Icon.svelte';
	import { layer } from '$lib/ui/layers';

	let cancelButton: HTMLButtonElement | undefined = $state();
	let confirmButton: HTMLButtonElement | undefined = $state();

	// the safe action takes focus; the layer stack hands focus back on close
	$effect(() => {
		if ($requestedConfirmation) cancelButton?.focus();
	});

	function trapTab(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !cancelButton || !confirmButton) return;
		event.preventDefault();
		(document.activeElement === cancelButton ? confirmButton : cancelButton).focus();
	}
</script>

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
			use:layer={dismissConfirmation}
			onkeydown={trapTab}
		>
			<Icon name="warning" size={ICON.tile} color="var(--h-bad-text)" />
			<div class="confirm-copy">
				<strong id="hearth-confirm-title">{$requestedConfirmation.title}</strong>
				<span>{$requestedConfirmation.message}</span>
			</div>
			<div class="confirm-actions">
				<button
					type="button"
					class="confirm-button"
					bind:this={cancelButton}
					onclick={dismissConfirmation}
				>
					{$lang('cancel')}
				</button>
				<button
					type="button"
					class="confirm-button dangerous"
					bind:this={confirmButton}
					onclick={confirmRequestedAction}
				>
					{$requestedConfirmation.confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirm-backdrop {
		position: absolute;
		inset: 0;
		z-index: var(--h-layer-confirm);
		display: grid;
		place-items: center;
		padding: 20px;
		background: var(--h-scrim);
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
		box-shadow: 0 24px 80px var(--h-scrim);
	}

	.confirm-copy {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.confirm-copy strong {
		font-size: var(--h-type-subtitle);
		color: var(--h-text-1);
	}

	.confirm-copy span {
		font-size: var(--h-type-body);
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
		padding: 10px 18px;
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
</style>
