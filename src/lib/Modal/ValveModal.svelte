<script lang="ts">
	import { connection, lang, states, ripple } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states[sel?.entity_id]);
	let entityState = $derived(entity?.state);
	let attributes = $derived(entity?.attributes);
	let supported_features = $derived(attributes?.supported_features);

	let supports = $derived(
		getSupport(supported_features, {
			OPEN: 1,
			CLOSE: 2,
			SET_POSITION: 4,
			STOP: 8
		})
	);

	/**
	 * Handle click
	 */
	function handleClick(service: string) {
		callService($connection, 'valve', service, {
			entity_id: entity?.entity_id
		});
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		<h2>{$lang('state')}</h2>

		{$lang(entityState)}

		<h2>{$lang('buttons')}</h2>

		<div class="button-container">
			{#if supports?.OPEN}
				<button
					title={$lang('open_valve')}
					class:selected={entity?.state === 'open'}
					onclick={() => handleClick('open_valve')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.7);">
						<Icon icon="mdi:valve-open" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.CLOSE}
				<button
					title={$lang('close_valve')}
					class:selected={entity?.state === 'closed'}
					onclick={() => handleClick('close_valve')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.7);">
						<Icon icon="mdi:valve-closed" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.STOP}
				<button
					title={$lang('stop_valve')}
					onclick={() => handleClick('stop_valve')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-stop" height="none" />
					</div>
				</button>
			{/if}
		</div>

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.button-container > button {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon {
		width: 1.6rem;
		height: 1.6rem;
	}
</style>
