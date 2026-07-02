<script lang="ts">
	import { lang, ripple, entityList } from '$lib/Stores';
	import Timer from '$lib/Sidebar/Timer.svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import type { TimerItem } from '$lib/Types';
	import Ripple from '$lib/Actions/ripple';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: TimerItem;
		demo?: string;
	} = $props();

	let options = $derived($entityList('timer'));
</script>

<ConfigModal {isOpen} bind:sel {demo} title={$lang('timer')}>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<Timer {sel} />
		</div>

		<h2>{$lang('entity')}</h2>

		<div>
			{#if sel && options}
				<Select
					value={sel?.entity_id}
					placeholder={$lang('entity')}
					onchange={(event) => set('entity_id', event)}
					{options}
					computeIcons={true}
				/>
			{/if}
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
