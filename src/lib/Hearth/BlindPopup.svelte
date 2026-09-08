<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from './interaction';
	import { states } from '$lib/core/ha/entities';
	import type { SliderUpdateMode } from '$lib/Types';
	import { getSupport } from '$lib/Utils';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from './config';
	import {
		blindPositionFor,
		blindTiltFor,
		setBlindPosition,
		setBlindTiltPosition
	} from '$lib/core/domains/cover';
	import { callEntityService, controlOverrides } from '$lib/core/ha/commands';
	import PopupSlider from './PopupSlider.svelte';

	let {
		entity,
		sliderUpdates = 'continuous'
	}: { entity: string; sliderUpdates?: SliderUpdateMode } = $props();

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

	let tiltPosition = $derived(blindTiltFor(entity, $states, $controlOverrides));

	function callCoverService(service: string, data: Record<string, unknown> = {}) {
		callEntityService('cover', service, entity, data);
	}
</script>

<PopupSlider
	label={$lang('hearth_position')}
	icon="blinds"
	value={blindPositionFor(entity, $states, $controlOverrides)}
	variant="blue"
	updateMode={sliderUpdates}
	onchange={(value, commit) => setBlindPosition(entity, value, commit)}
/>

<div class="buttons">
	<div
		class="button pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => setBlindPosition(entity, 0)}
		role="button"
		tabindex="0"
		onkeydown={(event) => activateOnKeyboard(event, () => setBlindPosition(entity, 0))}
	>
		{$lang('hearth_close')}
	</div>
	{#if supports?.STOP}
		<div
			class="button pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => callCoverService('stop_cover')}
			role="button"
			tabindex="0"
			onkeydown={(event) => activateOnKeyboard(event, () => callCoverService('stop_cover'))}
		>
			{$lang('stop')}
		</div>
	{/if}
	<div
		class="button primary pressable"
		use:Ripple={PRESS_RIPPLE}
		onclick={() => setBlindPosition(entity, 100)}
		role="button"
		tabindex="0"
		onkeydown={(event) => activateOnKeyboard(event, () => setBlindPosition(entity, 100))}
	>
		{$lang('hearth_open_fully')}
	</div>
</div>

{#if supports?.SET_TILT_POSITION}
	<PopupSlider
		label={$lang('hearth_tilt')}
		icon="tune"
		value={tiltPosition}
		variant="blue"
		updateMode={sliderUpdates}
		onchange={(value, commit) => setBlindTiltPosition(entity, value, commit)}
	/>
{/if}

{#if supports?.CLOSE_TILT || supports?.STOP_TILT || supports?.OPEN_TILT}
	<div class="buttons">
		{#if supports?.CLOSE_TILT}
			<div
				class="button pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('close_cover_tilt')}
				role="button"
				tabindex="0"
				onkeydown={(event) => activateOnKeyboard(event, () => callCoverService('close_cover_tilt'))}
			>
				{$lang('hearth_close_tilt')}
			</div>
		{/if}
		{#if supports?.STOP_TILT}
			<div
				class="button pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('stop_cover_tilt')}
				role="button"
				tabindex="0"
				onkeydown={(event) => activateOnKeyboard(event, () => callCoverService('stop_cover_tilt'))}
			>
				{$lang('hearth_stop_tilt')}
			</div>
		{/if}
		{#if supports?.OPEN_TILT}
			<div
				class="button primary pressable"
				use:Ripple={PRESS_RIPPLE}
				onclick={() => callCoverService('open_cover_tilt')}
				role="button"
				tabindex="0"
				onkeydown={(event) => activateOnKeyboard(event, () => callCoverService('open_cover_tilt'))}
			>
				{$lang('hearth_open_tilt')}
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
