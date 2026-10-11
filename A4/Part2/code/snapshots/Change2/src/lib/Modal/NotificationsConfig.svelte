<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Notifications from '$lib/Sidebar/Notifications.svelte';
	import Ripple from '$lib/Actions/ripple';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: any } = $props();
</script>

<ConfigModal {isOpen} bind:sel title={$lang('notifications')}>
	{#snippet children(set)}
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
	{/snippet}
</ConfigModal>
