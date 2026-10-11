<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import Date from '$lib/Sidebar/Date.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import Ripple from '$lib/Actions/ripple';
	import type { DateItem } from '$lib/Types';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: DateItem } = $props();
</script>

<ConfigModal {isOpen} bind:sel title={$lang('date')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Date
				short_day={sel?.short_day}
				short_month={sel?.short_month}
				hide={sel?.hide}
				layout={sel?.layout}
			/>
		</div>

		<!-- DAY -->
		<h2>{$lang('day')}</h2>
		<div class="button-container">
			<button
				class:selected={!sel?.short_day}
				onclick={() => set('short_day', false)}
				use:Ripple={$ripple}
			>
				{$lang('max_length')}
			</button>
			<button
				class:selected={sel?.short_day}
				onclick={() => set('short_day', true)}
				use:Ripple={$ripple}
			>
				{$lang('min_length')}
			</button>
		</div>

		<!-- MONTH -->
		<h2>{$lang('month')}</h2>
		<div class="button-container">
			<button
				class:selected={!sel?.short_month}
				onclick={() => set('short_month', false)}
				use:Ripple={$ripple}
			>
				{$lang('max_length')}
			</button>
			<button
				class:selected={sel?.short_month}
				onclick={() => set('short_month', true)}
				use:Ripple={$ripple}
			>
				{$lang('min_length')}
			</button>
		</div>

		<!-- HIDE -->
		<h2>{$lang('hide')}</h2>
		<div class="button-container">
			<button
				class:selected={!sel?.hide || sel?.hide === 'none'}
				onclick={() => set('hide', 'none')}
				use:Ripple={$ripple}
			>
				{$lang('none')}
			</button>
			<button
				class:selected={sel?.hide === 'day'}
				onclick={() => {
					set('hide', 'day');
					set('layout', 'vertical');
				}}
				use:Ripple={$ripple}
			>
				{$lang('day')}
			</button>
			<button
				class:selected={sel?.hide === 'month'}
				onclick={() => {
					set('hide', 'month');
					set('layout', 'vertical');
				}}
				use:Ripple={$ripple}
			>
				{$lang('month')}
			</button>
		</div>
		{#if !sel?.hide || sel?.hide === 'none'}
			<!-- Layout -->
			<h2>{$lang('Layout')}</h2>
			<div class="button-container">
				<button
					class:selected={!sel?.layout || sel?.layout === 'vertical'}
					onclick={() => set('layout', 'vertical')}
					use:Ripple={$ripple}
				>
					{$lang('vertical')}
				</button>
				<button
					class:selected={sel?.layout === 'horizontal'}
					onclick={() => set('layout', 'horizontal')}
					use:Ripple={$ripple}
				>
					{$lang('horizontal')}
				</button>
			</div>
		{/if}

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

<style>
	.preview {
		height: 3.8rem;
	}
</style>
