<script lang="ts">
	import { motion } from '$lib/Stores';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	let {
		value = $bindable(),
		min,
		max,
		step = undefined,
		onchange = undefined,
		oninput = undefined
	}: {
		value: number;
		min: number;
		max: number;
		step?: number | undefined;
		onchange?: ((value: number) => void) | undefined;
		oninput?: ((value: number) => void) | undefined;
	} = $props();

	// value in range 0 to 1
	let normalized = $derived((value - min) / (max - min));
	const fill = tweened(normalized, {
		duration: $motion,
		easing: cubicOut
	});
	$effect(() => {
		fill.set(normalized);
	});
	/**
	 * Dispatches value on input end
	 */
	function handleChange(event: { currentTarget: HTMLInputElement }) {
		const val = event.currentTarget.value;
		onchange?.(Number(val));
	}
</script>

<div>
	<span style:width="{$fill * 100}%"></span>
	<input
		name="slider"
		type="range"
		{step}
		{min}
		{max}
		bind:value
		oninput={() => {
			oninput?.(value);
		}}
		onchange={handleChange}
	/>
</div>

<style>
	:root {
		--slider-height: 3rem;
	}
	div {
		position: relative;
		height: var(--slider-height);
		border-radius: 0.8rem;
		overflow: hidden;
	}
	span {
		border-top: var(--slider-height) solid white;
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
	}
	input[type='range'] {
		appearance: none;
		background-color: rgba(0, 0, 0, 0.5);
		margin: 0;
		width: 100%;
		height: 100%;
	}
	input[type='range']::-webkit-slider-thumb {
		width: 0;
		appearance: none;
	}
	input[type='range']::-moz-range-thumb {
		width: 0;
		appearance: none;
		border: none;
		background: transparent;
	}
</style>
