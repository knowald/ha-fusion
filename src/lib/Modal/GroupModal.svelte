<script lang="ts">
	import { states } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName } from '$lib/Utils';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states?.[sel?.entity_id]);
	let group = $derived(entity?.attributes?.entity_id);
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		{#each group as child_entity_id (child_entity_id)}
			<h2>{getName(undefined, $states?.[child_entity_id])}</h2>

			<StateLogic entity_id={child_entity_id} selected={undefined} />
		{/each}

		<ConfigButtons />
	</Modal>
{/if}
