<script lang="ts">
	import { connection, lang, states, ripple } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	// const demo = {
	// 	entity_id: 'lawn_mower.demo_lawn_mower',
	// 	state: 'mowing',
	// 	attributes: {
	// 		friendly_name: 'Lawnzilla',
	// 		supported_features: 7
	// 	},
	// 	context: {
	// 		id: '01HMF1RZPQNSY946Y7R1K5BTVZ',
	// 		parent_id: null,
	// 		user_id: null
	// 	},
	// 	last_changed: '2024-01-18T19:46:40.471Z',
	// 	last_updated: '2024-01-18T19:46:40.471Z'
	// };

	let entity = $derived($states?.[sel?.entity_id]);
	let state = $derived(entity?.state as 'paused' | 'mowing' | 'docked' | 'error');
	let attributes = $derived(entity?.attributes);
	let supported_features = $derived(attributes?.supported_features);

	let supports = $derived(getSupport(supported_features, {
		START_MOWING: 1,
		PAUSE: 2,
		DOCK: 4
	}));

	/**
	 * Handle click
	 */
	function handleClick(service: string) {
		callService($connection, 'lawn_mower', service, {
			entity_id: entity?.entity_id
		});
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		<h2>{$lang('state')}</h2>

		{$lang(state)}

		<h2>{$lang('lawn_mower_commands')?.replace(':', '')}</h2>

		<div class="button-container">
			{#if supports?.START_MOWING}
				<button
					title={$lang('start_mowing')}
					class:selected={entity?.state === 'mowing'}
					onclick={() => handleClick('start_mowing')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-play-arrow" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.PAUSE}
				<button
					title={$lang('pause')}
					class:selected={entity?.state === 'paused'}
					onclick={() => handleClick('pause')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-pause" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.DOCK}
				<button
					title={$lang('return_home')}
					onclick={() => handleClick('dock')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.85);">
						<Icon icon="ic:round-home" height="none" />
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
