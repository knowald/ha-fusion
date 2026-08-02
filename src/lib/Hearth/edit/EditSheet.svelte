<script lang="ts">
	import type { Snippet } from 'svelte';
	import Ripple from '$lib/Actions/ripple';
	import { lang } from '$lib/Stores';
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
		wide = false,
		split = false
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
		split?: boolean;
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

<div
	class="overlay"
	role="presentation"
	onpointerdown={(event) => event.target === event.currentTarget && onclose()}
>
	<div class="sheet" class:wide role="dialog" aria-modal="true" aria-label={title}>
		<div class="header">
			<div class="title">{title}</div>
			{#if onmoveup || onmovedown}
				<div class="move-actions">
					{#if onmoveup}
						<button type="button" class="icon-button" title="Move up" onclick={onmoveup}>
							<Icon name="arrow_upward" size={20} />
						</button>
					{/if}
					{#if onmovedown}
						<button type="button" class="icon-button" title="Move down" onclick={onmovedown}>
							<Icon name="arrow_downward" size={20} />
						</button>
					{/if}
				</div>
			{/if}
			<button
				type="button"
				class="button primary pressable"
				disabled={doneDisabled}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => !doneDisabled && ondone()}
			>
				{$lang('done')}
			</button>
			<button
				type="button"
				class="icon-button"
				aria-label={$lang('hearth_close')}
				onclick={onclose}
			>
				<Icon name="close" size={24} />
			</button>
		</div>
		<div class="body" class:split>
			{@render children()}
		</div>
		{#if onremove}
			<div class="footer">
				<button
					type="button"
					class="button danger pressable"
					class:confirm={confirmRemove}
					use:Ripple={PRESS_RIPPLE}
					onclick={handleRemove}
				>
					{confirmRemove
						? `${removeLabel} — ${$lang('hearth_are_you_sure')}`
						: removeLabel === 'Remove'
							? $lang('remove')
							: removeLabel}
				</button>
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
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
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
		border-bottom: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
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
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
	}

	.icon-button {
		display: flex;
		color: var(--h-icon);
		cursor: pointer;
		padding: 8px;
		border-radius: var(--h-radius-xs);
		transition: transform 120ms ease;
		border: 0;
		background: none;
		font: inherit;
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

	.body.split {
		display: flex;
		padding: 0;
		overflow: hidden;
	}

	.body.split > :global(*) {
		width: 100%;
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
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
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
		font-family: inherit;
	}

	.button.primary {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
		color: var(--h-on-accent);
	}

	.button.primary:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.button.danger {
		background: rgb(var(--h-bad-rgb) / calc(0.16 * var(--h-accent-scale)));
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
