<script lang="ts">
	import { states } from '$lib/Stores';
	import { getSupport } from '$lib/Utils';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from './config';
	import { blindPositionFor, callEntityService, controlOverrides, setBlindPosition } from './store';
	import PopupSlider from './PopupSlider.svelte';

	let { entity }: { entity: string } = $props();

	let attributes = $derived($states?.[entity]?.attributes);

	let supports = $derived(
		getSupport(attributes?.supported_features, {
			STOP: 8,
			OPEN_TILT: 16,
			CLOSE_TILT: 32,
			STOP_TILT: 64,
			SET_TILT_POSITION: 128
		})
	);

	// mirrors setBlindPosition's optimistic override, but scoped to this
	// popup since tilt has no dedicated entry in the shared blind store
	let tiltOverride: number | undefined = $state(undefined);
	let tiltOverrideTimer: ReturnType<typeof setTimeout> | undefined;

	let tiltPosition = $derived(
		tiltOverride ?? Math.max(0, Math.min(100, Math.round(attributes?.current_tilt_position ?? 0)))
	);

	function callCoverService(service: string, data: Record<string, unknown> = {}) {
		callEntityService('cover', service, entity, data);
	}

	function setTiltPosition(value: number) {
		const target = Math.max(0, Math.min(100, Math.round(value)));
		clearTimeout(tiltOverrideTimer);
		tiltOverride = target;
		tiltOverrideTimer = setTimeout(() => (tiltOverride = undefined), 2000);
		callCoverService('set_cover_tilt_position', { tilt_position: target });
	}
</script>

<PopupSlider
	label="POSITION"
	icon="blinds"
	value={blindPositionFor(entity, $states, $controlOverrides)}
	variant="blue"
	onchange={(value) => setBlindPosition(entity, value)}
/>

<div class="buttons">
	<div
		class="button pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => setBlindPosition(entity, 0)}
	>
		Close
	</div>
	{#if supports?.STOP}
		<div
			class="button pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => callCoverService('stop_cover')}
		>
			Stop
		</div>
	{/if}
	<div
		class="button primary pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => setBlindPosition(entity, 100)}
	>
		Open fully
	</div>
</div>

{#if supports?.SET_TILT_POSITION}
	<PopupSlider
		label="TILT"
		icon="tune"
		value={tiltPosition}
		variant="blue"
		onchange={setTiltPosition}
	/>
{/if}

{#if supports?.CLOSE_TILT || supports?.STOP_TILT || supports?.OPEN_TILT}
	<div class="buttons">
		{#if supports?.CLOSE_TILT}
			<div
				class="button pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('close_cover_tilt')}
			>
				Close tilt
			</div>
		{/if}
		{#if supports?.STOP_TILT}
			<div
				class="button pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('stop_cover_tilt')}
			>
				Stop tilt
			</div>
		{/if}
		{#if supports?.OPEN_TILT}
			<div
				class="button primary pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('open_cover_tilt')}
			>
				Open tilt
			</div>
		{/if}
	</div>
{/if}

<style>
	.buttons {
		display: flex;
		gap: 10px;
		margin-top: 16px;
	}

	.button {
		flex: 1;
		text-align: center;
		padding: 15px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: 15px;
		font-weight: 600;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.button.primary {
		background: linear-gradient(135deg, rgb(var(--h-cool-rgb)), var(--h-cool-light));
		border: none;
		color: var(--h-on-cool);
	}
</style>
