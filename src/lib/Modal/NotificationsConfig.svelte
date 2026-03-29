<script lang="ts">
	import { dashboard, lang, record, ripple } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Notifications from '$lib/Sidebar/Notifications.svelte';
	import Ripple from '$lib/Actions/ripple';
	import { updateObj } from '$lib/Utils';
	import { onDestroy } from 'svelte';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: any } = $props();

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">
			{$lang('notifications')}
		</h1>

		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Notifications {sel} />
		</div>

		<h2>{$lang('expand')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.expand !== false}
				onclick={() => set('expand')}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
			</button>

			<button
				class:selected={sel?.expand === false}
				onclick={() => set('expand', false)}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>
		</div>

		<h2>{$lang('mobile')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.hide_mobile !== true}
				onclick={() => set('hide_mobile')}
				use:Ripple={$ripple}
			>
				{$lang('visible')}
			</button>

			<button
				class:selected={sel?.hide_mobile === true}
				onclick={() => set('hide_mobile', true)}
				use:Ripple={$ripple}
			>
				{$lang('hidden')}
			</button>
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}
