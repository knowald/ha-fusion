<script lang="ts">
	import { lang, ripple, entityList } from '$lib/Stores';
	import History from '$lib/Sidebar/History.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import type { HistoryItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: HistoryItem;
		demo?: string;
	} = $props();

	let options = $derived($entityList(''));

	const periodOptions = [
		{ id: '5minute', label: $lang('period_5minute') },
		{ id: 'hour', label: $lang('period_hour') },
		{ id: 'day', label: $lang('period_day') },
		{ id: 'week', label: $lang('period_week') },
		{ id: 'month', label: $lang('period_month') }
	];
</script>

<ConfigModal {isOpen} bind:sel title={$lang('history')} {demo}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		{#if sel?.entity_id}
			<div class="preview">
				<History entity_id={sel.entity_id} period={sel?.period} />
			</div>
		{/if}

		<h2>{$lang('entity')}</h2>

		{#if sel}
			<Select
				computeIcons={true}
				{options}
				placeholder={$lang('entity')}
				value={sel.entity_id}
				onchange={(event) => set('entity_id', event)}
			/>
		{/if}

		<h2>{$lang('period')}</h2>

		{#if sel && periodOptions}
			<Select
				options={periodOptions}
				placeholder={$lang('period')}
				value={sel?.period || 'hour'}
				onchange={(event) => set('period', event)}
			/>
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
