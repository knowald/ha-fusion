<script lang="ts">
	import { connection } from '$lib/Stores';
	import RangeSlider from '$lib/Components/RangeSlider.svelte';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';

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
		timeout: ReturnType<typeof setTimeout>;
		rangeValue: number;
	} = $props();

	let request: Promise<unknown> | undefined = undefined;

	$effect(() => {
		if (!debounce) rangeValue = brightness || 0;
	});

	/**
	 * Adjusts the brightness via a service call.
	 *
	 * If a service request is already active, subsequent changes won't trigger additional
	 * requests. This prevents potential overload from multiple concurrent calls.
	 *
	 * The `rangeValue` update is debounced to enhance UI responsiveness with grouped lights.
	 * This minimizes unwanted feedback on the slider, preventing it from jumping erratically.
	 */
	async function handleChange(brightness: number) {
		if (request) return;

		debounce = true;
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			debounce = false;
			rangeValue = brightness || 0;
		}, 2500);

		request = callService($connection, 'light', 'turn_on', {
			entity_id: entity?.entity_id,
			brightness: brightness
		});

		try {
			await request;
		} catch (error) {
			console.error('Failed to change brightness:', error);
		} finally {
			request = undefined;
		}
	}
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
			request = undefined;
			handleChange(Math.round(event));
		}}
	/>
{/if}
