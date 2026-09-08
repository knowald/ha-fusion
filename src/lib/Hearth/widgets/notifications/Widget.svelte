<script lang="ts">
	import EmptyState from '../../EmptyState.svelte';
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { persistentNotifications } from '$lib/core/ha/connection';
	import { service } from '$lib/core/ha/commands';
	import { loadMarkdownRenderer } from '../../markdown';
	import Icon from '../../Icon.svelte';

	let entries = $derived(Object.entries($persistentNotifications ?? {}));
	// rendered HTML per notification, keyed by id and remembered with the
	// message it came from so an updated message under the same id re-renders
	let rendered = $state<Record<string, { message: string; html: string }>>({});
	$effect(() => {
		const pending = entries
			.map(([id, notification]) => [id, notification.message ?? ''] as const)
			.filter(([id, message]) => rendered[id]?.message !== message);
		const stale = Object.keys(rendered).filter((id) => !(id in ($persistentNotifications ?? {})));
		if (!pending.length && !stale.length) return;
		let cancelled = false;
		loadMarkdownRenderer().then((render) => {
			if (cancelled) return;
			for (const id of stale) delete rendered[id];
			for (const [id, message] of pending) rendered[id] = { message, html: render(message) };
		});
		return () => {
			cancelled = true;
		};
	});

	function dismiss(id: string) {
		service('persistent_notification', 'dismiss', { notification_id: id });
	}
</script>

<div class="notifications">
	{#each entries as [id, notification] (id)}
		<div class="item">
			<div class="body">
				{#if notification.title}<div class="title">{notification.title}</div>{/if}
				{#if rendered[id]?.message === (notification.message ?? '')}
					<div class="message">{@html rendered[id].html}</div>
				{:else}
					<div class="message">{notification.message ?? ''}</div>
				{/if}
			</div>
			<button
				type="button"
				class="dismiss"
				aria-label={$lang('hearth_dismiss')}
				onclick={() => dismiss(id)}
			>
				<Icon name="close" size={ICON.inline} />
			</button>
		</div>
	{:else}
		<EmptyState inline text={$lang('hearth_no_notifications')} />
	{/each}
</div>

<style>
	.notifications {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 6px 0;
	}

	.item {
		display: flex;
		gap: 8px;
		padding: 10px 12px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.05 * var(--h-fill-scale)));
	}

	.body {
		flex: 1;
		min-width: 0;
		font-size: var(--h-type-secondary);
		color: var(--h-text-3);
		overflow-wrap: anywhere;
	}

	.title {
		font-weight: 600;
		color: var(--h-text-1);
		margin-bottom: 2px;
	}

	.message :global(p) {
		margin: 0;
	}

	.dismiss {
		flex: none;
		width: 44px;
		height: 44px;
		/* the glyph stays small; the negative margins keep the row as tight as
		   before while the tap target grows to 44px */
		margin: -8px -8px -8px 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--h-text-5);
		cursor: pointer;
		display: grid;
		place-items: center;
	}
</style>
