<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		onopen,
		icon = 'tune',
		alignEdge = false
	}: { onopen: () => void; icon?: string; alignEdge?: boolean } = $props();
</script>

<span class="anchor" class:align-edge={alignEdge}>
	<!-- pointerdown must not bubble, otherwise the tile starts a drag/tap gesture -->
	<button
		type="button"
		class="tune"
		aria-label={icon === 'edit' ? 'Edit' : 'Open controls'}
		onclick={(event) => {
			event.stopPropagation();
			onopen();
		}}
		onpointerdown={(event) => event.stopPropagation()}
		onpointerup={(event) => event.stopPropagation()}
	>
		<Icon name={icon} size={19} />
	</button>
</span>

<style>
	.anchor {
		display: inline-flex;
		flex: 0 0 44px;
	}

	.tune {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--h-icon);
		cursor: pointer;
		font: inherit;
		touch-action: manipulation;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.tune:hover {
		background: rgb(var(--h-surface-rgb) / calc(0.08 * var(--h-fill-scale)));
	}

	.tune:active {
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		color: var(--h-accent-text);
	}

	/* The wrapper detaches tile-edge controls from layout while the button keeps
	   its complete 44px hit area. */
	.anchor.align-edge {
		position: absolute;
		top: 50%;
		right: 4px;
		transform: translateY(-50%);
		z-index: 2;
	}
</style>
