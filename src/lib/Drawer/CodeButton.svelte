<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import { openModal } from '$lib/Modals';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';

	/**
	 * Opens modal
	 */
	function handleClick() {
		openModal(() => import('$lib/Modal/CodeConfig.svelte'));
	}

	/**
	 * Preloads module before click event
	 */
	async function handlePointer() {
		await import('$lib/Modal/CodeConfig.svelte');
	}
</script>

<button
	class="button"
	onclick={handleClick}
	onpointerenter={handlePointer}
	onpointerdown={handlePointer}
	use:Ripple={$ripple}
>
	<figure>
		<Icon icon="ph:code-bold" height="none" />
	</figure>

	<span>
		{$lang('code')}
	</span>
</button>

<style>
	span {
		text-transform: capitalize;
	}
</style>
