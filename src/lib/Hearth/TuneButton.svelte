<script lang="ts">
	import Icon from './Icon.svelte';

	let { onopen, icon = 'tune' }: { onopen: () => void; icon?: string } = $props();
</script>

<!-- pointerdown must not bubble, otherwise the tile starts a drag/tap gesture -->
<button
	type="button"
	class="tune pressable"
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

<style>
	.tune {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 44px;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--h-icon);
		cursor: pointer;
		font: inherit;
	}
</style>
