<script lang="ts">
	import { dashboard, history, historyIndex, record } from '$lib/Stores';
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
		children
	}: {
		isOpen: boolean;
		sel: any;
		title: string;
		demo?: string;
		demoKey?: string;
		children: Snippet<[(key: string, event?: any) => void]>;
	} = $props();

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set(demoKey, demo);
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{heading}</h1>{/snippet}

		{@render children(set)}

		<ConfigButtons {sel} />
	</Modal>
{/if}
