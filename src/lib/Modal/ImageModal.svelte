<script lang="ts">
	import { states } from '$lib/Stores';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { getName } from '$lib/Utils';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states[sel?.entity_id]);
	let attributes = $derived(entity?.attributes);
	let entity_picture = $derived(attributes?.entity_picture);
	let name = $derived(getName(sel, entity));
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{name}</h1>{/snippet}

		<img src={entity_picture} alt={name} />

		<ConfigButtons />
	</Modal>
{/if}

<style>
	img {
		margin-top: 1rem;
		border-radius: 0.6rem;
		width: 100%;
	}
</style>
