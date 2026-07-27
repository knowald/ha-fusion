<script lang="ts">
	import type { RailWidget } from './config';
	import { hearthEditMode } from './store';
	import { openModal } from '$lib/Modals';

	let { widget }: { widget: Extract<RailWidget, { type: 'fusion' }> } = $props();

	let item = $derived({ id: widget.id, ...widget.config } as Record<string, any>);

	const components: Record<string, () => Promise<{ default: any }>> = {
		bar: () => import('$lib/Sidebar/Bar.svelte'),
		camera: () => import('$lib/Sidebar/Camera.svelte'),
		date: () => import('$lib/Sidebar/Date.svelte'),
		divider: () => import('$lib/Sidebar/Divider.svelte'),
		graph: () => import('$lib/Sidebar/Graph.svelte'),
		history: () => import('$lib/Sidebar/History.svelte'),
		iframe: () => import('$lib/Sidebar/Iframe.svelte'),
		image: () => import('$lib/Sidebar/Image.svelte'),
		notifications: () => import('$lib/Sidebar/Notifications.svelte'),
		radial: () => import('$lib/Sidebar/Radial.svelte'),
		sensor: () => import('$lib/Sidebar/Sensor.svelte'),
		template: () => import('$lib/Sidebar/Template.svelte'),
		time: () => import('$lib/Sidebar/Time.svelte'),
		timer: () => import('$lib/Sidebar/Timer.svelte'),
		weather: () => import('$lib/Sidebar/Weather.svelte'),
		weather_forecast: () => import('$lib/Sidebar/WeatherForecast.svelte')
	};

	let load = $derived(item?.type ? components[item.type] : undefined);

	// same non-edit interactions the original sidebar offers
	function handleClick() {
		if ($hearthEditMode) return;
		if (item?.type === 'camera') {
			openModal(() => import('$lib/Modal/CameraModal.svelte'), { sel: item });
		} else if (item?.type === 'timer') {
			openModal(() => import('$lib/Modal/TimerModal.svelte'), { sel: item });
		}
	}

	// mirrors the per-type prop spreading in Sidebar/Index.svelte
	let embedProps = $derived.by((): Record<string, any> => {
		switch (item?.type) {
			case 'bar':
				return { entity_id: item.entity_id, name: item.name, math: item.math, id: item.id };
			case 'date':
				return {
					short_day: item.short_day,
					short_month: item.short_month,
					hide: item.hide,
					layout: item.layout
				};
			case 'divider':
				return { mode: item.mode, size: item.size };
			case 'graph':
				return {
					entity_id: item.entity_id,
					name: item.name,
					period: item.period,
					stroke: item.stroke
				};
			case 'history':
				return { entity_id: item.entity_id || '', period: item.period };
			case 'iframe':
				return { url: item.url, size: item.size };
			case 'image':
				return { entity_id: item.entity_id, url: item.url };
			case 'radial':
				return { entity_id: item.entity_id, name: item.name, strokeWidth: item.stroke };
			case 'sensor':
				return {
					entity_id: item.entity_id,
					prefix: item.prefix,
					suffix: item.suffix,
					date: item.date || false
				};
			case 'time':
				return { seconds: item.seconds, hour12: item.hour12 || false };
			default:
				return { sel: item };
		}
	});
</script>

<div
	class="fusion"
	class:sized={widget.height}
	style:--fusion-height={widget.height ? `${widget.height}px` : undefined}
	onclick={handleClick}
>
	{#if !load}
		<div class="placeholder">Fusion widget: set a type in the widget editor</div>
	{:else}
		{#key item.type}
			{#await load() then module}
				{@const Embed = module.default}
				<Embed {...embedProps} />
			{/await}
		{/key}
	{/if}
</div>

<style>
	.fusion {
		font-size: var(--theme-sidebar-font-size, 1rem);
		color: var(--h-text-2);
	}

	/* the drawing area, not the widget's label row: the graph's timeline, an
	   iframe, a camera still or an image */
	.fusion.sized :global(.timeline),
	.fusion.sized :global(iframe),
	.fusion.sized :global(img),
	.fusion.sized :global(video) {
		height: var(--fusion-height) !important;
	}

	.placeholder {
		padding: 14px;
		border-radius: var(--h-radius-sm);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 13px;
		text-align: center;
	}
</style>
