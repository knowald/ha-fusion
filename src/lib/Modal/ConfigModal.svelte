<script lang="ts">
	import { history, historyIndex, record, updateDashboard } from '$lib/Stores';
	import { onDestroy, type Snippet } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj } from '$lib/Utils';

	// title prop renamed locally so it does not collide with the title snippet below
	let {
		isOpen,
		sel = $bindable(),
		title: heading,
		demo = undefined,
		demoKey = 'entity_id',
		ontransitionend = undefined,
		children
	}: {
		isOpen: boolean;
		sel: any;
		title: string;
		demo?: string;
		demoKey?: string;
		ontransitionend?: () => void;
		children: Snippet<[(key: string, event?: any) => void]>;
	} = $props();

	function set(key: string, event?: any) {
		sel = updateDashboard(sel, (live) => updateObj(live, key, event));
	}

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set(demoKey, demo);
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal {ontransitionend}>
		{#snippet title()}<h1>{heading}</h1>{/snippet}

		{@render children(set)}

		<ConfigButtons {sel} />
	</Modal>
{/if}
