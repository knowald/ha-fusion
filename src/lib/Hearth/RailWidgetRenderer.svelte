<script lang="ts">
	import type { RailWidget } from './types';
	import {
		railConfigurationLabel,
		railWidgetNeedsConfiguration,
		widgetDescriptor
	} from './widgets';
	import ConfigurationPlaceholder from './ConfigurationPlaceholder.svelte';

	let { widget, onsearch = () => {} }: { widget: RailWidget; onsearch?: () => void } = $props();

	let descriptor = $derived(widgetDescriptor(widget.type));
</script>

{#if !descriptor}
	<ConfigurationPlaceholder
		label={`Unknown widget type "${widget.type}"`}
		compact
		context="widget"
	/>
{:else if railWidgetNeedsConfiguration(widget)}
	<ConfigurationPlaceholder label={railConfigurationLabel(widget)} compact context="widget" />
{:else if descriptor.component}
	<descriptor.component {widget} {onsearch} />
{/if}
