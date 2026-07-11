<script lang="ts">
	import { connection } from '$lib/Stores';
	import RangeSlider from '$lib/Components/RangeSlider.svelte';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';
	import { onDestroy } from 'svelte';

	let {
		entity,
		brightness,
		current = $bindable(),
		debounce = $bindable(),
		timeout = $bindable(),
		rangeValue = $bindable()
	}: {
		entity: HassEntity;
		brightness: number;
		current: number;
		debounce: boolean;
		timeout: ReturnType<typeof setTimeout> | undefined;
		rangeValue: number;
	} = $props();

	const SEND_INTERVAL = 250;
	let sendTimer: ReturnType<typeof setTimeout> | undefined;
	let pendingBrightness: number | undefined;
	let lastSentBrightness: number | undefined;

	$effect(() => {
		if (!debounce) rangeValue = brightness || 0;
	});

	/**
	 * Adjusts the brightness via a service call.
	 *
	 * Sends are throttled by time instead of waiting on the previous request,
	 * so slow devices (e.g. cloud lights in a group) don't reduce the update
	 * rate while dragging. The latest value is always sent as a trailing call.
	 *
	 * The `rangeValue` update is debounced to enhance UI responsiveness with grouped lights.
	 * This minimizes unwanted feedback on the slider, preventing it from jumping erratically.
	 */
	function handleChange(brightness: number) {
		debounce = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			debounce = false;
			rangeValue = brightness || 0;
		}, 2500);

		throttledSend(brightness);
	}

	function throttledSend(value: number) {
		if (sendTimer) {
			pendingBrightness = value;
			return;
		}

		send(value);

		sendTimer = setTimeout(() => {
			sendTimer = undefined;
			if (pendingBrightness !== undefined) {
				const pending = pendingBrightness;
				pendingBrightness = undefined;
				throttledSend(pending);
			} else {
				// interaction settled, allow resending the same value later
				lastSentBrightness = undefined;
			}
		}, SEND_INTERVAL);
	}

	function send(value: number) {
		if (value === lastSentBrightness) return;
		lastSentBrightness = value;

		callService($connection, 'light', 'turn_on', {
			entity_id: entity?.entity_id,
			brightness: value
		}).catch((error) => {
			console.error('Failed to change brightness:', error);
		});
	}

	/**
	 * Sends the final value immediately, skipping the throttle window
	 */
	function flush(value: number) {
		clearTimeout(sendTimer);
		sendTimer = undefined;
		pendingBrightness = undefined;
		send(value);
	}

	onDestroy(() => {
		clearTimeout(sendTimer);
	});
</script>

{#if entity}
	<RangeSlider
		value={rangeValue}
		min={0}
		max={255}
		oninput={(event) => {
			current = Math.round(event / 2.55);
			handleChange(Math.round(event));
		}}
		onchange={(event) => {
			flush(Math.round(event));
		}}
	/>
{/if}
