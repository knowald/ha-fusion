<script lang="ts">
	import { states } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE, SWATCH_COLORS } from './config';
	import { horizontalDrag } from './drag';
	import {
		callEntityService,
		controlOverrides,
		hexToRgb,
		lightViewFor,
		setLightColor,
		setLightLevel,
		setLightTemp
	} from './store';
	import PopupSlider from './PopupSlider.svelte';

	let { entity }: { entity: string } = $props();

	let view = $derived(lightViewFor(entity, $states, $controlOverrides));
	// tab choice is local UI state; the light's actual mode is the default
	let tabChoice = $state<'temp' | 'color' | 'white' | null>(null);
	let mode = $derived(tabChoice ?? view.mode);
	let kelvinLabel = $derived(
		`${view.kelvin}K · ${view.kelvin < 3300 ? 'Warm white' : view.kelvin < 5000 ? 'Neutral' : 'Cool white'}`
	);

	let attributes = $derived($states?.[entity]?.attributes ?? {});
	let colorModes: string[] = $derived(
		Array.isArray(attributes.supported_color_modes) ? attributes.supported_color_modes : []
	);
	let supportsWhite = $derived(colorModes.includes('white'));
	let effectList: string[] = $derived(
		Array.isArray(attributes.effect_list) ? attributes.effect_list : []
	);
	let currentEffect = $derived(attributes.effect);

	function callLightService(name: string, data: Record<string, unknown>) {
		callEntityService('light', name, entity, data);
	}

	function selectWhite() {
		tabChoice = 'white';
		callLightService('turn_on', { white: true });
	}

	function selectEffect(effect: string) {
		callLightService('turn_on', { effect });
	}

	function swatchSelected(swatch: string) {
		if (!view.colorCss) return false;
		const current = view.colorCss.match(/\d+/g)?.map(Number);
		if (!current) return false;
		const target = hexToRgb(swatch);
		return current.every((channel, index) => Math.abs(channel - target[index]) <= 15);
	}
</script>

<PopupSlider
	label="BRIGHTNESS"
	icon="light_mode"
	value={view.on ? view.level : 0}
	variant="amber"
	onchange={(value) => setLightLevel(entity, value)}
/>

<div class="presets">
	{#each [25, 50, 100] as preset (preset)}
		<div
			class="preset pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => setLightLevel(entity, preset)}
		>
			{preset}%
		</div>
	{/each}
</div>

<div class="color-header">
	<div class="color-label">COLOR</div>
	<div class="tabs">
		<div class="tab pressable" class:active={mode === 'temp'} onclick={() => (tabChoice = 'temp')}>
			Temperature
		</div>
		<div
			class="tab pressable"
			class:active={mode === 'color'}
			onclick={() => (tabChoice = 'color')}
		>
			Color
		</div>
		{#if supportsWhite}
			<div class="tab pressable" class:active={mode === 'white'} onclick={selectWhite}>White</div>
		{/if}
	</div>
</div>

{#if mode === 'temp'}
	<div class="temp-bar" use:horizontalDrag={{ set: (value) => setLightTemp(entity, value) }}>
		<div class="temp-thumb" style:left="calc({view.tempPct}% - 9px)"></div>
	</div>
	<div class="temp-labels">
		<span>Candle</span>
		<span class="kelvin">{kelvinLabel}</span>
		<span>Daylight</span>
	</div>
{:else if mode === 'color'}
	<div class="swatches">
		{#each SWATCH_COLORS as swatch (swatch)}
			<div
				class="swatch pressable"
				class:selected={swatchSelected(swatch)}
				style:background={swatch}
				onclick={() => setLightColor(entity, swatch)}
			></div>
		{/each}
	</div>
{/if}

{#if effectList.length}
	<div class="color-header">
		<div class="color-label">EFFECT</div>
	</div>
	<div class="effects">
		{#each effectList as effect (effect)}
			<div
				class="effect-chip pressable"
				class:active={currentEffect === effect}
				use:Ripple={PRESS_RIPPLE}
				onclick={() => selectEffect(effect)}
			>
				{effect}
			</div>
		{/each}
	</div>
{/if}

<style>
	.presets {
		display: flex;
		gap: 10px;
		margin-top: 12px;
	}

	.preset {
		flex: 1;
		text-align: center;
		padding: 12px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: 14px;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.color-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 24px 0 10px;
	}

	.color-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 11px;
		background: var(--h-track);
	}

	.tab {
		padding: 8px 14px;
		border-radius: 8px;
		font-size: 13px;
		cursor: pointer;
		color: var(--h-icon);
	}

	.tab.active {
		background: rgb(var(--h-accent-rgb) / calc(0.2 * var(--h-accent-scale)));
		color: var(--h-accent-text);
		font-weight: 600;
	}

	.temp-bar {
		position: relative;
		height: 44px;
		border-radius: var(--h-radius-sm);
		overflow: hidden;
		background: linear-gradient(90deg, #ff9d4d, #ffc98a, #fff0dc, #eef4ff, #c9ddff);
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.temp-thumb {
		position: absolute;
		top: 4px;
		bottom: 4px;
		width: 18px;
		border-radius: 9px;
		background: rgba(255, 255, 255, 0.95);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		border: 2px solid var(--h-sheet-0);
	}

	.temp-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		font-size: 12px;
		color: var(--h-icon);
	}

	.kelvin {
		color: var(--h-text-2);
		font-weight: 600;
	}

	.swatches {
		display: flex;
		gap: 10px;
	}

	.swatch {
		flex: 1;
		height: 44px;
		border-radius: var(--h-radius-sm);
		cursor: pointer;
		opacity: 0.85;
	}

	.swatch.selected {
		outline: 2px solid var(--h-text-1);
		outline-offset: 3px;
		opacity: 1;
	}

	.effects {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.effect-chip {
		padding: 8px 14px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		font-size: 13px;
		color: var(--h-text-3);
		cursor: pointer;
	}

	.effect-chip.active {
		background: rgb(var(--h-accent-rgb) / calc(0.2 * var(--h-accent-scale)));
		color: var(--h-accent-text);
		font-weight: 600;
		border-color: transparent;
	}
</style>
