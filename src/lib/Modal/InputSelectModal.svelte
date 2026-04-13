<script lang="ts">
	import { states, lang, connection } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getDomain, getName } from '$lib/Utils';
	import Select from '$lib/Components/Select.svelte';
	import { callService } from 'home-assistant-js-websocket';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states[sel?.entity_id]);

	let options = $derived(entity?.attributes?.options?.map((option: string) => ({
		id: option,
		label: option
	})));

	function handleChange(option: string) {
		if (!option || !entity) return;
		const service = getDomain(entity?.entity_id) as string;

		callService($connection, service, 'select_option', {
			entity_id: entity?.entity_id,
			option
		});
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		{#if options}
			<h2>{$lang('options')}</h2>

			<Select
				{options}
				placeholder={$lang('options')}
				value={entity?.state}
				onchange={(event) => {
					handleChange(event);
				}}
			/>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}
