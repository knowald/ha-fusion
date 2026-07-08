<script lang="ts">
	import { states, lang } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getDomain, getName } from '$lib/Utils';

	let { isOpen, selected }: { isOpen: boolean; selected: any } = $props();

	let entity = $derived($states?.[selected?.entity_id]);
	let domain = $derived(getDomain(selected?.entity_id));

	let attributes = $derived(
		Object.entries(entity?.attributes ?? {}).filter(([key]) => key !== 'friendly_name')
	);

	function formatAttributeValue(value: unknown) {
		return typeof value === 'string' ? value : JSON.stringify(value);
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}
			<h1>{getName(selected, entity) ?? selected?.entity_id ?? $lang('unknown')}</h1>
		{/snippet}

		<h2>{$lang('state')}</h2>

		<div class="state">
			{#if entity}
				<StateLogic entity_id={selected?.entity_id} {selected} />
			{:else}
				{$lang('entity_not_found')}
			{/if}
		</div>

		{#if attributes.length}
			<h2>{$lang('attributes')}</h2>

			<dl data-exclude-drag-modal>
				{#each attributes as [key, value] (key)}
					<dt>{key}</dt>
					<dd>{formatAttributeValue(value)}</dd>
				{/each}
			</dl>
		{/if}

		{#if selected?.entity_id}
			<p class="entity-id" data-exclude-drag-modal>{selected.entity_id}</p>
		{/if}

		{#if domain}
			<p class="note">
				The '{domain}' domain has no dedicated modal yet -
				<a href="https://github.com/knowald/ha-fusion/issues" target="_blank">request one</a>
			</p>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.state {
		font-size: 1.1rem;
	}

	dl {
		display: grid;
		grid-template-columns: fit-content(40%) 1fr;
		gap: 0.35rem 1.2rem;
		margin: 0;
		font-size: 0.85rem;
		user-select: text;
		cursor: text;
	}

	dt {
		opacity: 0.6;
		overflow-wrap: break-word;
	}

	dd {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.entity-id {
		margin: 1.2rem 0 0 0;
		font-size: 0.75rem;
		font-family: monospace;
		opacity: 0.5;
		user-select: text;
		cursor: text;
	}

	.note {
		margin: 1.2rem 0 0 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	.note a {
		color: inherit;
		text-decoration: underline;
	}
</style>
