<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();
	let domain = $derived(entity.split('.')[0]);
</script>

<div class="segments">
	<button
		type="button"
		class="segment active"
		onclick={() => callEntityService(domain, 'press', entity)}
	>
		{$lang('press')}
	</button>
</div>
