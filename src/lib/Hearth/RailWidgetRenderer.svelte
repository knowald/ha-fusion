<script lang="ts">
	import type { RailWidget } from './config';
	import CalendarWidget from './CalendarWidget.svelte';
	import ClockWidget from './ClockWidget.svelte';
	import EnergyWidget from './EnergyWidget.svelte';
	import EntityTile from './EntityTile.svelte';
	import FusionWidget from './FusionWidget.svelte';
	import NavWidget from './NavWidget.svelte';
	import ProgressWidget from './ProgressWidget.svelte';
	import StatusWidget from './StatusWidget.svelte';
	import WeatherCard from './WeatherCard.svelte';

	let { widget }: { widget: RailWidget } = $props();
</script>

{#if widget.type === 'clock'}
	<ClockWidget city={widget.city} />
{:else if widget.type === 'weather'}
	<WeatherCard entity={widget.entity} />
{:else if widget.type === 'nav'}
	<NavWidget />
{:else if widget.type === 'label'}
	<div class="section-label">{widget.text ?? ''}</div>
{:else if widget.type === 'energy'}
	<EnergyWidget {widget} />
{:else if widget.type === 'progress'}
	<ProgressWidget {widget} />
{:else if widget.type === 'calendar'}
	{#if widget.entities?.length}
		<CalendarWidget {widget} />
	{:else}
		<div class="widget-placeholder">Pick calendar entities in the widget editor</div>
	{/if}
{:else if widget.type === 'status'}
	<StatusWidget icon={widget.icon} text={widget.text} entity={widget.entity} />
{:else if widget.type === 'entity'}
	{#if widget.entity}
		<EntityTile
			entity={widget.entity}
			name={widget.name}
			icon={widget.icon}
			compact={widget.vertical_padding === 'compact'}
		/>
	{:else}
		<div class="widget-placeholder">Pick an entity in the widget editor</div>
	{/if}
{:else if widget.type === 'fusion'}
	<FusionWidget {widget} />
{/if}

<style>
	.section-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--h-text-6);
		margin: 18px 0 10px;
	}

	.widget-placeholder {
		padding: 14px;
		border-radius: var(--h-radius-sm);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 13px;
		text-align: center;
	}
</style>
