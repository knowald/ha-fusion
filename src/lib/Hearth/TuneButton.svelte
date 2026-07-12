<script lang="ts">
	import Icon from './Icon.svelte';

	let { onopen, icon = 'tune' }: { onopen: () => void; icon?: string } = $props();
</script>

<!-- pointerdown must not bubble, otherwise the tile starts a drag/tap gesture -->
<span
	class="tune pressable"
	onclick={(event) => {
		event.stopPropagation();
		onopen();
	}}
	onpointerdown={(event) => event.stopPropagation()}
	onpointerup={(event) => event.stopPropagation()}
>
	<Icon name={icon} size={19} />
</span>

<style>
	.tune {
		position: relative;
		z-index: 1;
		color: var(--h-icon);
		cursor: pointer;
	}
</style>
