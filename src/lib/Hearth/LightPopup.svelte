<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE, SWATCH_COLORS } from './config';
	import { horizontalDrag } from './drag';
	import { hexToRgb, lightViews, setLightColor, setLightLevel, setLightTemp } from './store';
	import PopupSlider from './PopupSlider.svelte';

	let { id }: { id: string } = $props();

	let view = $derived($lightViews[id]);
	// tab choice is local UI state; the light's actual mode is the default
	let tabChoice = $state<'temp' | 'color' | null>(null);
	let mode = $derived(tabChoice ?? view.mode);
	let kelvinLabel = $derived(
		`${view.kelvin}K · ${view.kelvin < 3300 ? 'Warm white' : view.kelvin < 5000 ? 'Neutral' : 'Cool white'}`
	);

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
	onchange={(value) => setLightLevel(id, value)}
/>

<div class="presets">
	{#each [25, 50, 100] as preset (preset)}
		<div
			class="preset pressable"
			use:Ripple={PRESS_RIPPLE}
			onclick={() => setLightLevel(id, preset)}
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
	</div>
</div>

{#if mode === 'temp'}
	<div class="temp-bar" use:horizontalDrag={{ set: (value) => setLightTemp(id, value) }}>
		<div class="temp-thumb" style:left="calc({view.tempPct}% - 9px)"></div>
	</div>
	<div class="temp-labels">
		<span>Candle</span>
		<span class="kelvin">{kelvinLabel}</span>
		<span>Daylight</span>
	</div>
{:else}
	<div class="swatches">
		{#each SWATCH_COLORS as swatch (swatch)}
			<div
				class="swatch pressable"
				class:selected={swatchSelected(swatch)}
				style:background={swatch}
				onclick={() => setLightColor(id, swatch)}
			></div>
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
		background: rgb(var(--h-surface-rgb) / 0.06);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.08);
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
		background: rgb(var(--h-accent-rgb) / 0.2);
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
</style>
