<script lang="ts">
	import type { RailWidget } from './config';
	import CalendarWidget from './CalendarWidget.svelte';
	import ClockWidget from './ClockWidget.svelte';
	import EnergyWidget from './EnergyWidget.svelte';
	import EntityTile from './EntityTile.svelte';
	import FusionWidget from './FusionWidget.svelte';
	import NavWidget from './NavWidget.svelte';
	import ProgressWidget from './ProgressWidget.svelte';
	import SearchWidget from './SearchWidget.svelte';
	import StatusWidget from './StatusWidget.svelte';
	import WeatherWidget from './WeatherWidget.svelte';
	import ConfigurationPlaceholder from './ConfigurationPlaceholder.svelte';
	import { railConfigurationLabel, railWidgetNeedsConfiguration } from './configurationState';

	let { widget, onsearch = () => {} }: { widget: RailWidget; onsearch?: () => void } = $props();
</script>

{#if railWidgetNeedsConfiguration(widget)}
	<ConfigurationPlaceholder label={railConfigurationLabel(widget)} compact context="widget" />
{:else if widget.type === 'clock'}
	<ClockWidget
		timezone={widget.timezone}
		hour_format={widget.hour_format}
		show_seconds={widget.show_seconds}
	/>
{:else if widget.type === 'weather'}
	<WeatherWidget entity={widget.entity} />
{:else if widget.type === 'search'}
	<SearchWidget onclick={onsearch} />
{:else if widget.type === 'nav'}
	<NavWidget />
{:else if widget.type === 'label'}
	<div class="section-label">{widget.text ?? ''}</div>
{:else if widget.type === 'energy'}
	<EnergyWidget {widget} />
{:else if widget.type === 'progress'}
	<ProgressWidget {widget} />
{:else if widget.type === 'calendar'}
	<CalendarWidget {widget} />
{:else if widget.type === 'status'}
	<StatusWidget icon={widget.icon} text={widget.text} entity={widget.entity} />
{:else if widget.type === 'entity'}
	<EntityTile
		entity={widget.entity!}
		name={widget.name}
		icon={widget.icon}
		compact={widget.vertical_padding === 'compact'}
	/>
{:else if widget.type === 'fusion'}
	<FusionWidget {widget} />
{:else if widget.type === 'spacer'}
	<!-- Spacer layout is supplied by Rail.svelte. -->
{:else}
	{@const _exhaustive: never = widget}
	{_exhaustive}
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
</style>
