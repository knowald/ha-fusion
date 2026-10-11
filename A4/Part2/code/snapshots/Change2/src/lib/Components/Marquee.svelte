<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		duration = 15,
		repeat = 2,
		paused = false,
		pauseOnHover = false,
		children
	}: {
		duration?: number;
		repeat?: number;
		paused?: boolean;
		pauseOnHover?: boolean;
		children: Snippet;
	} = $props();

	let hovered = $state(false);

	function handleHover(event: MouseEvent | FocusEvent) {
		if (event?.type === 'mouseover' || event?.type === 'focus') {
			hovered = true;
		} else if (event?.type === 'mouseout' || event?.type === 'blur') {
			hovered = false;
		}
	}
</script>

<div
	role="none"
	onpointerover={handleHover}
	onpointerout={handleHover}
	onfocus={handleHover}
	onblur={handleHover}
>
	<div class="content" class:paused={paused || (pauseOnHover && hovered)}>
		{#each Array(repeat) as i, index (index)}
			<div class="text" style:animation-duration="{duration}s" title={i}>
				{@render children()}
			</div>
		{/each}
	</div>
</div>

<style>
	.content {
		width: 100000px;
	}

	.text {
		animation-name: animation;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		float: left;
	}

	.paused .text {
		animation-play-state: paused;
	}

	@keyframes animation {
		100% {
			transform: translateX(-100%);
		}
	}
</style>
