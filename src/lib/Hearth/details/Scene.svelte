<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { activateScene } from '$lib/core/domains/scene';

	let { entity }: { entity: string } = $props();
</script>

<div class="segments">
	<button type="button" class="segment active" onclick={() => activateScene(entity)}>
		{$lang('hearth_activate')}
	</button>
</div>
