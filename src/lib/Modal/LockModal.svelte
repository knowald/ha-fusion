<script lang="ts">
	import { states, connection, lang, ripple, motion } from '$lib/Stores';
	import { callService } from 'home-assistant-js-websocket';
	import Toggle from '$lib/Components/Toggle.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import Ripple from '$lib/Actions/ripple';
	import { onDestroy } from 'svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let opening = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	let entity = $derived($states[sel?.entity_id]);
	let entity_id = $derived(entity?.entity_id);
	let entityState = $derived(entity?.state);
	let toggle = $derived(entity?.state === 'unlocking' || entity?.state === 'unlocked');

	let attributes = $derived(entity?.attributes);
	let supported_features = $derived(attributes?.supported_features);
	let supports = $derived(getSupport(supported_features, {
		OPEN: 1
	}));

	function handleClick() {
		const service = entityState === 'locked' ? 'unlock' : 'lock';
		callService($connection, 'lock', service, { entity_id });
	}

	async function handleOpen() {
		clearTimeout(timeout);
		await callService($connection, 'lock', 'open', { entity_id });

		opening = true;
		timeout = setTimeout(() => {
			opening = false;
		}, 2000);
	}

	onDestroy(() => {
		clearTimeout(timeout);
	});
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		<h2>{$lang('state')}</h2>

		<div class="container">
			<StateLogic entity_id={sel?.entity_id} selected={sel} />

			<div class="toggle">
				<Toggle bind:checked={toggle} onchange={handleClick} />
			</div>
		</div>

		<!-- buttons -->
		{#if supports?.OPEN}
			<div class="add-config-button">
				<button
					class="done action"
					class:opening
					style:transition="background-color {$motion}ms ease"
					use:Ripple={$ripple}
					onclick={handleOpen}
				>
					{$lang(opening ? 'open_door_success' : 'open_door')}
				</button>

				<ConfigButtons />
			</div>
		{:else}
			<ConfigButtons />
		{/if}
	</Modal>
{/if}

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.toggle {
		margin-left: auto;
		height: 25px;
	}

	.opening {
		background-color: #007000 !important;
	}

	.add-config-button {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.add-config-button > button {
		height: fit-content;
		align-self: end;
	}
</style>
