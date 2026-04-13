<script lang="ts">
	import { states, connection, lang } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Toggle from '$lib/Components/Toggle.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { getName } from '$lib/Utils';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states[sel?.entity_id]);
	let toggle = $derived(entity?.state === 'on');

	/**
	 * Calls switch.toggle service
	 */
	function handleClick() {
		callService($connection, 'homeassistant', 'toggle', {
			entity_id: entity?.entity_id
		});
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		<h2>{$lang('toggle')}</h2>

		<Toggle bind:checked={toggle} onchange={handleClick} />

		<ConfigButtons />
	</Modal>
{/if}
