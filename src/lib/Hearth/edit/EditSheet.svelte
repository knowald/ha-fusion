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
		onmoveup,
		onmovedown
	}: {
		title: string;
		children: Snippet;
		onclose: () => void;
		ondone: () => void;
		doneDisabled?: boolean;
		onremove?: () => void;
		onmoveup?: () => void;
		onmovedown?: () => void;
	} = $props();
</script>

<div class="overlay" onclick={onclose}>
	<div class="sheet" onclick={(event) => event.stopPropagation()}>
		<div class="header">
			<div class="title">{title}</div>
			{#if onmoveup}
				<span class="icon-button" onclick={onmoveup}><Icon name="arrow_upward" size={20} /></span>
			{/if}
			{#if onmovedown}
				<span class="icon-button" onclick={onmovedown}>
					<Icon name="arrow_downward" size={20} />
				</span>
			{/if}
			<span class="icon-button" onclick={onclose}><Icon name="close" size={24} /></span>
		</div>
		<div class="body">
			{@render children()}
		</div>
		<div class="footer">
			{#if onremove}
				<div class="button danger pressable" use:Ripple={PRESS_RIPPLE} onclick={onremove}>
					Remove
				</div>
			{/if}
			<div class="spacer"></div>
			<div
				class="button primary pressable"
				class:disabled={doneDisabled}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => !doneDisabled && ondone()}
			>
				Done
			</div>
		</div>
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
		width: 440px;
		max-height: 680px;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		border-radius: var(--h-radius-xl);
		padding: 24px 28px;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 18px;
	}

	.title {
		flex: 1;
		font-size: 20px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.icon-button {
		color: var(--h-icon);
		cursor: pointer;
		transition: transform 120ms ease;
	}

	.icon-button:active {
		transform: scale(0.9);
	}

	.icon-button:hover {
		color: var(--h-text-3);
	}

	.body {
		overflow-y: auto;
		margin: 0 -6px;
		padding: 0 6px;
	}

	.footer {
		display: flex;
		gap: 10px;
		margin-top: 18px;
	}

	.spacer {
		flex: 1;
	}

	.button {
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
</style>
