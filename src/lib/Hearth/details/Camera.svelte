<script lang="ts">
	import { LegacyCamera } from '$lib/legacy/bridge/camera';

	let { entity }: { entity: string } = $props();
</script>

<div class="frame">
	<LegacyCamera
		sel={{ entity_id: entity, stream: true }}
		responsive={true}
		muted={true}
		controls={true}
	/>
</div>

<style>
	.frame {
		margin-top: 12px;
		border-radius: var(--h-radius-sm);
		overflow: hidden;
	}
</style>
