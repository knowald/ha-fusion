<script lang="ts">
	let attempt = $state(0);
	import { lang } from '$lib/core/i18n';
	import { loadLegacyCamera } from '$lib/legacy/bridge/camera';
	import type { OverviewCard } from '../../config';

	let { card }: { card: Extract<OverviewCard, { type: 'camera' }> } = $props();
</script>

<div class="section">
	{#if card.title}
		<div class="section-title">{card.title}</div>
	{/if}
	{#if card.entity}
		<div class="camera">
			{#key attempt}
				{#await loadLegacyCamera() then Camera}
					<Camera.default
						sel={{
							id: card.id,
							type: 'camera',
							entity_id: card.entity,
							stream: card.stream
						} as any}
						responsive={true}
						muted={true}
						controls={false}
						allowEditStream={true}
					/>
				{:catch}
					<button type="button" class="retry" onclick={() => (attempt += 1)}>
						{$lang('hearth_could_not_load_component')}
						{$lang('hearth_retry')}
					</button>
				{/await}
			{/key}
		</div>
	{:else}
		<div class="placeholder">{$lang('hearth_pick_a_camera_entity_in_the')}</div>
	{/if}
</div>

<style>
	.retry {
		padding: 10px 14px;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.12 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: none;
		color: var(--h-accent-text);
		font: inherit;
		cursor: pointer;
	}

	.section-title {
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-2);
		margin-bottom: 14px;
	}

	.camera {
		border-radius: var(--h-radius-md);
		overflow: hidden;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	.placeholder {
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: var(--h-type-body);
		text-align: center;
	}
</style>
