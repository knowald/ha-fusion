<script lang="ts">
	import { states } from '$lib/core/ha/entities';
	import { callEntityService } from '$lib/core/ha/commands';

	let { entity }: { entity: string } = $props();

	let stateObj = $derived($states?.[entity]);
	let domain = $derived(entity.split('.')[0]);
	let options = $derived<string[]>(
		Array.isArray(stateObj?.attributes?.options) ? stateObj.attributes.options : []
	);
</script>

<div class="segments">
	{#each options as option (option)}
		<button
			type="button"
			class="segment"
			class:active={stateObj?.state === option}
			onclick={() => callEntityService(domain, 'select_option', entity, { option })}
		>
			{option}
		</button>
	{/each}
</div>
