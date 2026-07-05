<script lang="ts">
	import { connection } from '$lib/Stores';
	import RangeSlider from '$lib/Components/RangeSlider.svelte';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';
	import { onDestroy } from 'svelte';

	let {
		entity,
		attribute,
		index,
		current = $bindable()
	}: {
		entity: HassEntity;
		attribute: 'rgbw_color' | 'rgbww_color';
		index: number;
		current?: number;
	} = $props();

	const SEND_INTERVAL = 250;
	let sendTimer: ReturnType<typeof setTimeout> | undefined;
	let pendingValue: number | undefined;
	let lastSentValue: number | undefined;

	let debounce = $state(false);
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let rangeValue = $state(0);

	let channelValue = $derived(entity?.attributes?.[attribute]?.[index] ?? 0);

	$effect(() => {
		if (!debounce) rangeValue = channelValue || 0;
	});

	$effect(() => {
		current = Math.round(rangeValue / 2.55);
	});

	/**
	 * Adjusts one white channel of an rgbw/rgbww light.
	 *
	 * Same throttle/debounce scheme as LightSlider: sends are throttled by
	 * time with a trailing call, and slider feedback is debounced so grouped
	 * or slow lights don't make the handle jump while dragging.
	 */
	function handleChange(value: number) {
		debounce = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			debounce = false;
			rangeValue = channelValue || 0;
		}, 2500);

		throttledSend(value);
	}

	function throttledSend(value: number) {
		if (sendTimer) {
			pendingValue = value;
			return;
		}

		send(value);

		sendTimer = setTimeout(() => {
			sendTimer = undefined;
			if (pendingValue !== undefined) {
				const pending = pendingValue;
				pendingValue = undefined;
				throttledSend(pending);
			} else {
				// interaction settled, allow resending the same value later
				lastSentValue = undefined;
			}
		}, SEND_INTERVAL);
	}

	function send(value: number) {
		if (value === lastSentValue) return;
		lastSentValue = value;

		const color = [...(entity?.attributes?.[attribute] ?? [])];
		while (color.length <= index) color.push(0);
		color[index] = value;

		callService($connection, 'light', 'turn_on', {
			entity_id: entity?.entity_id,
			[attribute]: color
		}).catch((error) => {
			console.error('Failed to change white channel:', error);
		});
	}

	/**
	 * Sends the final value immediately, skipping the throttle window
	 */
	function flush(value: number) {
		clearTimeout(sendTimer);
		sendTimer = undefined;
		pendingValue = undefined;
		send(value);
	}

	onDestroy(() => {
		clearTimeout(timeout);
		clearTimeout(sendTimer);
	});
</script>

{#if entity}
	<RangeSlider
		value={rangeValue}
		min={0}
		max={255}
		oninput={(event) => {
			rangeValue = Math.round(event);
			handleChange(Math.round(event));
		}}
		onchange={(event) => {
			flush(Math.round(event));
		}}
	/>
{/if}
