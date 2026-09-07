<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import type { RailWidget } from '../../config';
	import { hearthEditMode } from '../../store';
	import { activateOnKeyboard } from '../../interaction';
	import { fusionWidgetEmbeds, openFusionWidgetModal } from '$lib/legacy/bridge/embeds';

	let { widget }: { widget: Extract<RailWidget, { type: 'fusion' }> } = $props();

	let item = $derived({ id: widget.id, ...widget.config } as Record<string, any>);

	const components = fusionWidgetEmbeds;

	let load = $derived(item?.type ? components[item.type] : undefined);

	// same non-edit interactions the original sidebar offers
	let tappable = $derived(item?.type === 'camera');
	function handleClick() {
		if ($hearthEditMode) return;
		openFusionWidgetModal(item);
	}

	// mirrors the per-type prop spreading in Sidebar/Index.svelte
	let embedProps = $derived.by((): Record<string, any> => {
		switch (item?.type) {
			case 'date':
				return {
					short_day: item.short_day,
					short_month: item.short_month,
					hide: item.hide,
					layout: item.layout
				};
			case 'divider':
				return { mode: item.mode, size: item.size };
			case 'image':
				return { entity_id: item.entity_id, url: item.url };
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

{#snippet embed()}
	{#if !load}
		<div class="placeholder">{$lang('hearth_fusion_widget_set_a_type_in')}</div>
	{:else}
		{#key item.type}
			{#await load() then module}
				{@const Embed = module.default}
				<Embed {...embedProps} />
			{/await}
		{/key}
	{/if}
{/snippet}

{#if tappable && !$hearthEditMode}
	<div
		class="fusion"
		class:sized={widget.height}
		style:--fusion-height={widget.height ? `${widget.height}px` : undefined}
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={(event) => activateOnKeyboard(event, handleClick)}
	>
		{@render embed()}
	</div>
{:else}
	<div
		class="fusion"
		class:sized={widget.height}
		style:--fusion-height={widget.height ? `${widget.height}px` : undefined}
	>
		{@render embed()}
	</div>
{/if}

<style>
	.fusion {
		font-size: var(
			--theme-sidebar-font-size,
			var(--h-type-body)
		); /* literal ok: original sidebar variable */
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
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: var(--h-type-secondary);
		text-align: center;
	}
</style>
