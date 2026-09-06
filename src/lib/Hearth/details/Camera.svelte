<script lang="ts">
	import { loadLegacyCamera } from '$lib/legacy/bridge/camera';

	let { entity }: { entity: string } = $props();
</script>

<div class="frame">
	{#await loadLegacyCamera() then Camera}
		<Camera.default
			sel={{ entity_id: entity, stream: true }}
			responsive={true}
			muted={true}
			controls={true}
		/>
	{/await}
</div>

<style>
	.frame {
		margin-top: 12px;
		border-radius: var(--h-radius-sm);
		overflow: hidden;
	}
</style>
