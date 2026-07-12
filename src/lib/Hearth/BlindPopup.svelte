<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from './config';
	import { blindViews, setBlindPosition } from './store';
	import PopupSlider from './PopupSlider.svelte';

	let { id }: { id: string } = $props();
</script>

<PopupSlider
	label="POSITION"
	icon="blinds"
	value={$blindViews[id] ?? 0}
	variant="blue"
	onchange={(value) => setBlindPosition(id, value)}
/>

<div class="buttons">
	<div class="button pressable" use:Ripple={PRESS_RIPPLE} onclick={() => setBlindPosition(id, 0)}>
		Close
	</div>
	<div
		class="button primary pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => setBlindPosition(id, 100)}
	>
		Open fully
	</div>
</div>

<style>
	.buttons {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.button {
		flex: 1;
		text-align: center;
		padding: 15px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
		font-size: 15px;
		font-weight: 600;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.button.primary {
		background: linear-gradient(135deg, rgb(var(--h-cool-rgb)), var(--h-cool-light));
		border: none;
		color: var(--h-on-cool);
	}
</style>
