<script lang="ts">
	import { lang } from '$lib/core/i18n';
	let attempt = $state(0);
	import { loadLegacyCamera } from '$lib/legacy/bridge/camera';

	let { entity }: { entity: string } = $props();
</script>

<div class="frame">
	{#key attempt}
		{#await loadLegacyCamera() then Camera}
			<Camera.default
				sel={{ entity_id: entity, stream: true }}
				responsive={true}
				muted={true}
				controls={true}
			/>
		{:catch}
			<button type="button" class="retry" onclick={() => (attempt += 1)}>
				{$lang('hearth_could_not_load_component')}
				{$lang('hearth_retry')}
			</button>
		{/await}
	{/key}
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

	.frame {
		margin-top: 12px;
		border-radius: var(--h-radius-sm);
		overflow: hidden;
	}
</style>
