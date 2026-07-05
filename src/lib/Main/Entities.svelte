<script lang="ts">
	import { editMode, itemHeight, lang, ripple, states } from '$lib/Stores';
	import { openModal } from '$lib/Modals';
	import { getName } from '$lib/Utils';
	import ComputeIcon from '$lib/Components/ComputeIcon.svelte';
	import StateLogic from '$lib/Components/StateLogic.svelte';
	import Ripple from '$lib/Actions/ripple';

	let {
		sel,
		sectionName = undefined,
		demo = undefined
	}: {
		sel: any;
		sectionName?: string | undefined;
		demo?: string | undefined;
	} = $props();

	let entityIds = $derived.by(() => {
		const explicit: string[] = sel?.entities?.filter(Boolean) ?? [];

		let matched: string[] = [];
		if (sel?.wildcard) {
			// glob where only * is special, e.g. binary_sensor.door_*
			const pattern = sel.wildcard
				.split('*')
				.map((part: string) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('.*');
			const regex = new RegExp(`^${pattern}$`);
			matched = Object.keys($states)
				.filter((id) => regex.test(id))
				.sort();
		}

		const combined = [...explicit, ...matched.filter((id) => !explicit.includes(id))];
		return combined.length === 0 && demo ? [demo] : combined;
	});

	function handleClick() {
		if ($editMode) {
			openModal(() => import('$lib/Modal/EntitiesConfig.svelte'), { sel, sectionName });
		}
	}
</script>

<div
	class="container"
	tabindex="-1"
	style:height="calc({$itemHeight}px * 4 + 0.4rem * 3)"
	style:cursor={$editMode ? 'pointer' : 'default'}
	onclick={handleClick}
	onkeydown={(event) => {
		if ($editMode && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			handleClick();
		}
	}}
	role="button"
	use:Ripple={{ ...$ripple, opacity: $editMode ? $ripple.opacity : 0 }}
>
	{#if sel?.name}
		<div class="header">{sel.name}</div>
	{/if}

	<div class="rows">
		{#each entityIds as entity_id (entity_id)}
			{@const entity = $states?.[entity_id]}
			<div class="row">
				<div class="icon">
					<ComputeIcon {entity_id} size="1.3rem" />
				</div>

				<div class="name">
					{getName(undefined, entity) || entity_id}
				</div>

				<div class="state">
					{#if entity}
						<StateLogic {entity_id} selected={sel} />
					{:else}
						{$lang('unknown')}
					{/if}
				</div>
			</div>
		{/each}

		{#if !entityIds.length}
			<div class="empty">
				{$lang('entities')}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		background-color: var(--theme-button-background-color-off);
		border-radius: 0.65rem;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.header {
		padding: 0.7rem 0.9rem 0.2rem 0.9rem;
		font-weight: 500;
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rows {
		overflow-y: auto;
		padding: 0.4rem 0.4rem;
	}

	.row {
		display: grid;
		grid-template-columns: min-content auto max-content;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
	}

	.icon {
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--theme-button-name-color-off);
	}

	.name {
		color: var(--theme-button-name-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.state {
		color: var(--theme-button-state-color-off);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 9rem;
	}

	.empty {
		padding: 0.35rem 0.5rem;
		color: var(--theme-button-state-color-off);
	}
</style>
