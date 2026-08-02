<script lang="ts">
	import { motion } from '$lib/Stores';
	import type { SliderUpdateMode } from '$lib/Types';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	let {
		value = $bindable(),
		min,
		max,
		step = undefined,
		onchange = undefined,
		oninput = undefined,
		updateMode = undefined
	}: {
		value: number;
		min: number;
		max: number;
		step?: number | undefined;
		onchange?: ((value: number) => void) | undefined;
		oninput?: ((value: number) => void) | undefined;
		/** When set to release, guarantees onchange fires only after pointerup. */
		updateMode?: SliderUpdateMode;
	} = $props();

	let pointerActive = false;
	let ignoreChange = false;

	// value in range 0 to 1
	let normalized = $derived((value - min) / (max - min));
	// initial tween value; the effect below keeps it in sync
	// svelte-ignore state_referenced_locally
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
		// Some touch browsers emit change events during a range gesture. When
		// release mode is selected, pointerup below is the sole commit point.
		if (updateMode === 'release') {
			if (pointerActive) return;
			if (ignoreChange) {
				ignoreChange = false;
				return;
			}
		}
		const val = event.currentTarget.value;
		onchange?.(Number(val));
	}

	function handlePointerUp() {
		if (!pointerActive) return;
		if (updateMode === 'release') {
			onchange?.(Number(value));
			// Suppress a native change event if this browser emits it after pointerup.
			ignoreChange = true;
			queueMicrotask(() => (ignoreChange = false));
		}
		pointerActive = false;
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
		onpointerdown={() => (pointerActive = true)}
		onpointerup={handlePointerUp}
		onpointercancel={() => (pointerActive = false)}
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
