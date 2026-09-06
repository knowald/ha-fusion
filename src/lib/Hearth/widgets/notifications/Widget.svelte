<script lang="ts">
	import EmptyState from '../../EmptyState.svelte';
	import { ICON } from '../../iconSizes';
	import { lang } from '$lib/core/i18n';
	import { persistentNotifications } from '$lib/core/ha/connection';
	import { service } from '$lib/core/ha/commands';
	import Icon from '../../Icon.svelte';

	let entries = $derived(Object.entries($persistentNotifications ?? {}));
	// markdown rendering loads on demand; most rails never show a notification
	let rendered = $state<Record<string, string>>({});
	$effect(() => {
		const pending = entries.filter(([id]) => !(id in rendered));
		if (!pending.length) return;
		import('marked').then(({ marked }) => {
			for (const [id, notification] of pending) {
				rendered[id] = marked.parse(notification.message ?? '') as string;
			}
		});
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
				<div class="message">{@html rendered[id] ?? notification.message ?? ''}</div>
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
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--h-text-5);
		cursor: pointer;
		display: grid;
		place-items: center;
	}
</style>
