<script lang="ts">
	import { states, lang, connection, ripple, motion } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName } from '$lib/Utils';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from '$lib/Actions/ripple';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	let entity = $derived($states[sel?.entity_id]);
	let state = $derived(Number(entity?.state));
	let attributes = $derived(entity?.attributes);
	let canIncrement = $derived(state !== attributes?.maximum);
	let canDecrement = $derived(state !== attributes?.minimum);

	/**
	 * Handles counter service call
	 */
	function handleClick(service: string) {
		callService($connection, 'counter', service, {
			entity_id: entity?.entity_id
		});
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{getName(sel, entity)}</h1>

		<h2>{$lang('counter')}</h2>

		<div class="container">
			<button
				title={$lang('decrement')}
				class="count button"
				disabled={!canDecrement}
				class:dim={!canDecrement}
				style:cursor={!canDecrement ? 'unset' : 'pointer'}
				style:transition="opacity {$motion}ms ease"
				onclick={() => {
					handleClick('decrement');
				}}
				use:Ripple={$ripple}
			>
				-
			</button>

			<span>{state}</span>

			<button
				title={$lang('increment')}
				class="count button"
				disabled={!canIncrement}
				class:dim={!canIncrement}
				style:cursor={!canIncrement ? 'unset' : 'pointer'}
				style:transition="opacity {$motion}ms ease"
				onclick={() => {
					handleClick('increment');
				}}
				use:Ripple={$ripple}
			>
				+
			</button>
		</div>

		<div class="add-config-button">
			<button
				class="done action"
				onclick={() => {
					handleClick('reset');
				}}
				use:Ripple={$ripple}
			>
				{$lang('reset')}
			</button>
			<ConfigButtons {sel} />
		</div>
	</Modal>
{/if}

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	span {
		font-size: 4rem;
		text-align: center;
		font-family: monospace;
	}

	.count {
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 0.4rem;
		border: 0;
		padding: 0 0 0.2rem 0;
		font-size: 2rem;
		color: white;
		margin: 0 2.5rem;
		width: 3.5rem;
		height: 3.5rem;
		cursor: pointer;
	}

	.dim {
		opacity: 0.3;
	}

	.add-config-button {
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.action {
		height: fit-content;
		align-self: end;
	}
</style>
