<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import Time from '$lib/Sidebar/Time.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Ripple from '$lib/Actions/ripple';
	import type { TimeItem } from '$lib/Types';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: TimeItem } = $props();
</script>

<ConfigModal {isOpen} bind:sel title={$lang('time')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Time seconds={sel?.seconds} hour12={sel?.hour12 || false} />
		</div>

		<h2>{$lang('time_format_header')}</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.hour12}
				onclick={() => set('hour12', false)}
				use:Ripple={$ripple}
			>
				{$lang('time_format_24')}
			</button>

			<button class:selected={sel?.hour12} onclick={() => set('hour12', true)} use:Ripple={$ripple}>
				{$lang('time_format_12')}
			</button>
		</div>

		<h2>{$lang('seconds')}</h2>

		<div class="button-container">
			<button
				class:selected={!sel?.seconds}
				onclick={() => set('seconds', false)}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>

			<button
				class:selected={sel?.seconds}
				onclick={() => set('seconds', true)}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
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
