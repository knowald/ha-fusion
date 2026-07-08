<script lang="ts">
	import { config, motion, ripple } from '$lib/Stores';
	import { onMount, tick, untrack } from 'svelte';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';
	import type { HassEntity } from 'home-assistant-js-websocket';
	let {
		onchange = undefined,
		stateObj
	}: {
		onchange?: ((value: number) => void) | undefined;
		stateObj: HassEntity;
	} = $props();
	let container: HTMLDivElement;
	let pointerDown = $state(false);
	let touch = $state<boolean>();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let touchScrolling = $state(false);
	let startY: number;
	let scrollY: number;
	let value: number = $state(0);
	// temperatures
	let temperatures: number[] = [];
	const minTemp = stateObj?.attributes?.min_temp;
	const maxTemp = stateObj?.attributes?.max_temp;
	// same default as the ha frontend when target_temp_step is absent
	const targetTempStep =
		stateObj?.attributes?.target_temp_step ??
		($config?.unit_system?.temperature === '°F' ? 1 : 0.5);
	const stepDecimals = String(targetTempStep).split('.')[1]?.length ?? 0;
	if (Number.isFinite(minTemp) && Number.isFinite(maxTemp) && targetTempStep > 0) {
		// derive each value from the index to avoid float accumulation
		const stepCount = Math.round((maxTemp - minTemp) / targetTempStep);
		for (let index = 0; index <= stepCount; index++) {
			temperatures.push(Number((maxTemp - index * targetTempStep).toFixed(stepDecimals)));
		}
	}
	let min = $derived(value === temperatures.length - 1);
	let max = $derived(value === 0);
	// `value` is the only intended trigger (a genuine user-driven change). The isMounted
	// gate is read untracked so flipping it after the initial scroll does not re-fire the
	// effect and emit a spurious onchange (which would call e.g. climate.set_temperature).
	$effect(() => {
		const current = value;
		untrack(() => {
			if (isMounted) onchange?.(temperatures[current]);
		});
	});
	let isMounted = $state(false);
	onMount(async () => {
		touch = 'ontouchstart' in window;
		// if temperature elements
		if (container.children.length > 0) {
			// clamp into minmax, then snap to the nearest step index
			const clampedTemperature = Math.max(
				minTemp,
				Math.min(maxTemp, stateObj?.attributes?.temperature)
			);
			value = Math.round((maxTemp - clampedTemperature) / targetTempStep);
			// fallback, also catches NaN from a missing temperature
			if (!(value >= 0 && value < temperatures.length)) value = 0;
			// set initial value
			await tick();
			container.scrollTo({
				top: (container.children[value] as HTMLElement).offsetTop - container.offsetTop,
				behavior: 'auto'
			});
		}
		isMounted = true;
	});
	/**
	 * Scrolls the container to the next or previous
	 * child based on the provided direction
	 */
	function handleClick(direction: 'increase' | 'decrease') {
		let child: any;
		let offset = direction === 'increase' ? 1 : -1;
		if (
			(direction === 'increase' && value < container.children.length - 1) ||
			(direction === 'decrease' && value > 0)
		) {
			child = container.children[(value += offset)];
		}
		if (child) {
			container.scrollTo({
				top: child.offsetTop - container.offsetTop,
				behavior: 'smooth'
			});
		}
	}
	/**
	 * Sets initial properties on mousedown event
	 */
	function handleMouseDown(event: MouseEvent) {
		if (!container.contains(event.target as Node)) return;
		pointerDown = true;
		startY = event.pageY - container.getBoundingClientRect().top;
		scrollY = container.scrollTop;
	}
	/**
	 * Scrolls to closest child on mouseup event
	 */
	function handleMouseUp() {
		pointerDown = false;
		const closestChild = getClosestChild() as HTMLDivElement | null;
		if (closestChild) {
			value = Array.from(container.children).indexOf(closestChild);
			container.scrollTo({
				top: closestChild.offsetTop - container.offsetTop,
				behavior: 'smooth'
			});
		}
	}
	/**
	 * Updates the container's scroll position based
	 * on the current and starting Y coordinates
	 */
	async function handleMouseMove(event: { pageY: number }) {
		if (!pointerDown) return;
		await tick();
		const y = event.pageY - container.getBoundingClientRect().top;
		const walk = y - startY;
		container.scrollTop = scrollY - walk;
	}
	/**
	 * Returns the child element that is closest
	 * to the vertical middle of the container
	 */
	function getClosestChild() {
		const containerMiddleY = container.getBoundingClientRect().top + container.clientHeight / 2;
		return Array.from(container.children).reduce((closestChild: any, child) => {
			const childRect = child.getBoundingClientRect();
			const childMiddleY = childRect.top + childRect.height / 2;
			const distance = Math.abs(childMiddleY - containerMiddleY);
			if (!closestChild || distance < closestChild.distance) return { distance, child };
			return closestChild;
		}, null)?.child;
	}
	/**
	 * Helper function for scrollend
	 */
	function handleTouchScroll() {
		if (touchScrolling) {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				handleMouseUp();
				touchScrolling = false;
			}, 100);
		}
	}
</script>

<svelte:document
	onpointerdown={handleMouseDown}
	onpointerup={handleMouseUp}
	onpointermove={handleMouseMove}
	ontouchend={() => (touchScrolling = true)}
/>
<div class="wheel">
	<button
		onclick={() => handleClick('increase')}
		style:cursor={min ? 'unset' : 'pointer'}
		style:color={min ? 'rgba(255, 255, 255, 0.1)' : 'white'}
		style:transition="color {$motion}ms ease"
		use:Ripple={{
			...$ripple,
			opacity: min ? 0 : $ripple.opacity
		}}
	>
		<Icon icon="mingcute:down-fill" height="none" />
	</button>
	<div
		class="container"
		bind:this={container}
		onwheel={(e) => e.preventDefault()}
		onscroll={handleTouchScroll}
		style:cursor={pointerDown ? 'grabbing' : 'grab'}
		style:scroll-snap-type={touch ? 'y mandatory' : 'unset'}
	>
		{#each temperatures as temperature, index (index)}
			<div
				class="item"
				data-exclude-drag-modal
				style:margin-top={index === 0 ? '1rem' : 'none'}
				style:margin-bottom={index === temperatures.length - 1 ? '1rem' : 'none'}
				style:scroll-snap-align={touch ? 'center' : 'unset'}
			>
				{temperature.toFixed(stepDecimals)}°
			</div>
		{/each}
	</div>
	<button
		onclick={() => handleClick('decrease')}
		style:cursor={max ? 'unset' : 'pointer'}
		style:color={max ? 'rgba(255, 255, 255, 0.1)' : 'white'}
		style:transition="color {$motion}ms ease"
		use:Ripple={{
			...$ripple,
			opacity: max ? 0 : $ripple.opacity
		}}
	>
		<Icon icon="mingcute:up-fill" height="none" />
	</button>
</div>

<style>
	:root {
		--width: 7.2rem;
		--height: 4.9rem;
	}
	.container {
		width: var(--width);
		height: var(--height);
		overflow: auto;
		cursor: grab;
		border-radius: 0.8rem;
		scrollbar-width: none;
		color: white;
		background-color: rgba(0, 0, 0, 0.2);
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		margin: 0.4rem;
		border: var(--border-color-button);
	}
	.container::-webkit-scrollbar {
		display: none;
	}
	.item {
		text-align: center;
		line-height: var(--height);
		font-size: 3rem;
		width: var(--width);
		height: 100%;
	}
	button {
		margin-top: 1rem;
		width: 4rem;
		height: 4rem;
		font-size: 2rem;
		border: none;
		padding-top: 0.4rem;
		color: white;
		background: transparent;
		margin: 0;
		border-radius: 1rem;
		-webkit-tap-highlight-color: transparent;
	}
	.wheel {
		margin-top: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-evenly;
	}
</style>
