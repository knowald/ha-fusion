<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Navigate from '$lib/Sidebar/Navigate.svelte';
	import Ripple from '$lib/Actions/ripple';
	import type { NavigateItem } from '$lib/Types';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: NavigateItem } = $props();

	let modalTransitionEnd = $state(false);
	function handleEvent() {
		modalTransitionEnd = true;
	}
</script>

<ConfigModal {isOpen} bind:sel title={$lang('navigate')} ontransitionend={handleEvent}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Navigate {modalTransitionEnd} />
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
