<script lang="ts">
	import type { Snippet } from 'svelte';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../config';
	import Icon from '../Icon.svelte';

	let {
		title,
		children,
		onclose,
		ondone,
		doneDisabled = false,
		onremove,
		removeLabel = 'Remove',
		onmoveup,
		onmovedown,
		wide = false
	}: {
		title: string;
		children: Snippet;
		onclose: () => void;
		ondone: () => void;
		doneDisabled?: boolean;
		onremove?: () => void;
		removeLabel?: string;
		onmoveup?: () => void;
		onmovedown?: () => void;
		wide?: boolean;
	} = $props();

	let confirmRemove = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout>;

	function handleRemove() {
		clearTimeout(confirmTimer);
		if (confirmRemove) {
			onremove?.();
			return;
		}
		confirmRemove = true;
		confirmTimer = setTimeout(() => (confirmRemove = false), 4000);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="overlay" onclick={onclose}>
	<div class="sheet" class:wide onclick={(event) => event.stopPropagation()}>
		<div class="header">
			<div class="title">{title}</div>
			{#if onmoveup || onmovedown}
				<div class="move-actions">
					{#if onmoveup}
						<span class="icon-button" title="Move up" onclick={onmoveup}>
							<Icon name="arrow_upward" size={20} />
						</span>
					{/if}
					{#if onmovedown}
						<span class="icon-button" title="Move down" onclick={onmovedown}>
							<Icon name="arrow_downward" size={20} />
						</span>
					{/if}
				</div>
			{/if}
			<div
				class="button primary pressable"
				class:disabled={doneDisabled}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => !doneDisabled && ondone()}
			>
				Done
			</div>
			<span class="icon-button" onclick={onclose}><Icon name="close" size={24} /></span>
		</div>
		<div class="body">
			{@render children()}
		</div>
		{#if onremove}
			<div class="footer">
				<div
					class="button danger pressable"
					class:confirm={confirmRemove}
					use:Ripple={PRESS_RIPPLE}
					onclick={handleRemove}
				>
					{confirmRemove ? `${removeLabel} - are you sure?` : removeLabel}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 60;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet {
		width: min(760px, calc(100vw - 32px));
		height: min(760px, calc(100dvh - 48px));
		display: flex;
		flex-direction: column;
		background: radial-gradient(680px 440px at 25% -10%, var(--h-sheet-0), var(--h-sheet-1) 60%);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		border-radius: var(--h-radius-xl);
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
		overflow: hidden;
	}

	.sheet.wide {
		width: min(1120px, calc(100vw - 32px));
	}

	.header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 22px 28px 18px;
		border-bottom: 1px solid rgb(var(--h-surface-rgb) / 0.06);
		flex: none;
	}

	.title {
		flex: 1;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.3px;
		color: var(--h-text-1);
	}

	.move-actions {
		display: flex;
		align-items: center;
		padding: 2px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.05);
	}

	.icon-button {
		display: flex;
		color: var(--h-icon);
		cursor: pointer;
		padding: 8px;
		border-radius: var(--h-radius-xs);
		transition: transform 120ms ease;
	}

	.icon-button:active {
		transform: scale(0.9);
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.body {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-content: start;
		column-gap: 18px;
		overflow-y: auto;
		scrollbar-gutter: stable;
		padding: 22px 28px 28px;
	}

	/* Structural content keeps the full workspace width; ordinary form fields
	   naturally flow into the two columns. These classes come from the editor
	   snippets rendered into this shared shell. */
	.body > :global(.group-label),
	.body > :global(.type-gallery),
	.body > :global(.preview),
	.body > :global(.filter-row),
	.body > :global(.add-filter),
	.body > :global(.visibility-row),
	.body > :global(.add-row),
	.body > :global(.hint),
	.body > :global(.error),
	.body > :global(.advanced-toggle),
	.body > :global(.elements-editor),
	.body > :global(.presets),
	.body > :global(.save-row),
	.body > :global(.saved-themes),
	.body > :global(.picker-grid),
	.body > :global(.reset),
	.body > :global(.settings),
	.body > :global(.yaml-field),
	.body > :global(.code-workspace),
	.body > :global(.card-editor-layout) {
		grid-column: 1 / -1;
	}

	.footer {
		display: flex;
		align-items: center;
		padding: 14px 28px 18px;
		border-top: 1px solid rgb(var(--h-surface-rgb) / 0.06);
		flex: none;
	}

	.button {
		border: 1px solid transparent;
		padding: 12px 22px;
		border-radius: var(--h-radius-xs);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		color: var(--h-on-accent);
	}

	.button.primary.disabled {
		opacity: 0.4;
		cursor: default;
	}

	.button.danger {
		background: rgb(var(--h-bad-rgb) / 0.16);
		color: var(--h-bad-text);
	}

	.button.danger.confirm {
		border-color: var(--h-bad-text);
	}

	@media (max-width: 700px) {
		.overlay {
			align-items: stretch;
			padding: 8px;
		}

		.sheet {
			width: 100%;
			height: calc(100dvh - 16px);
			border-radius: var(--h-radius-md);
		}

		.header {
			padding: 14px 14px 12px 18px;
		}

		.title {
			font-size: 19px;
		}

		.body {
			grid-template-columns: 1fr;
			padding: 18px;
		}

		.footer {
			padding: 12px 18px 16px;
		}
	}
</style>
