<script lang="ts">
	let {
		name,
		size = 24,
		color,
		fill = false
	}: { name: string; size?: number; color?: string; fill?: boolean } = $props();
</script>

<span class="mi" class:fill style:font-size="{size}px" style:color>{name}</span>

<style>
	.mi {
		font-family: 'Material Symbols Rounded';
		font-weight: 400;
		font-style: normal;
		line-height: 1;
		letter-spacing: normal;
		text-transform: none;
		display: inline-block;
		white-space: nowrap;
		word-wrap: normal;
		direction: ltr;
		-webkit-font-smoothing: antialiased;
		font-feature-settings: 'liga';
		font-variation-settings: 'FILL' 0;
	}

	.fill {
		font-variation-settings: 'FILL' 1;
	}
</style>
