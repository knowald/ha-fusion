<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import Icon from './Icon.svelte';

	let {
		label,
		compact = false,
		context = 'card'
	}: { label: string; compact?: boolean; context?: 'card' | 'widget' } = $props();
</script>

<div class="placeholder" class:compact>
	<Icon name="tune" size={compact ? 18 : 24} color="var(--h-icon-dim)" />
	<div>
		<strong>{$lang('configure')} {label}</strong>
		<span
			>{context === 'card'
				? $lang('hearth_open_the_card_editor_to_finish')
				: $lang('hearth_open_the_widget_editor_to_finish')}</span
		>
	</div>
</div>

<style>
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 96px;
		padding: 20px;
		box-sizing: border-box;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.18 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.025 * var(--h-fill-scale)));
		color: var(--h-text-5);
		text-align: left;
	}

	.placeholder.compact {
		min-height: 0;
		padding: 12px 14px;
		justify-content: flex-start;
	}

	.placeholder > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	strong {
		font-size: var(--h-type-body);
		font-weight: 600;
		color: var(--h-text-4);
	}

	span {
		font-size: var(--h-type-small);
		color: var(--h-text-6);
	}
</style>
