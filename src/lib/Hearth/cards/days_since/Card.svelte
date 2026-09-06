<script lang="ts">
	import { ICON } from '../../iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import { lang } from '$lib/core/i18n';
	import { timer } from '$lib/core/app/clock';
	import { entityAvailable, states } from '$lib/core/ha/entities';
	import { calendarDaysBetween, parseLocalDate } from '$lib/core/i18n/time';
	import { callEntityService } from '$lib/core/ha/commands';
	import { PRESS_RIPPLE } from '../../config';
	import { activateOnKeyboard } from '../../interaction';
	import { hearthEditMode, requestConfirmation } from '../../store';
	import Icon from '../../Icon.svelte';
	import type { DaysSinceCard } from './descriptor';

	let { card }: { card: DaysSinceCard } = $props();

	let entity = $derived(card.entity ?? '');
	let stateObj = $derived($states?.[entity]);
	let label = $derived(card.title || stateObj?.attributes?.friendly_name || entity);
	let available = $derived(entityAvailable(stateObj));
	let days = $derived.by(() => {
		if (!available) return null;
		const reset = parseLocalDate(stateObj?.state ?? '');
		if (Number.isNaN(reset.getTime())) return null;
		const elapsed = calendarDaysBetween(reset, $timer);
		// a reset date in the future is a misconfiguration, not a count
		return elapsed < 0 ? null : elapsed;
	});
	let caption = $derived(
		days === null
			? '-'
			: days === 0
				? $lang('hearth_today')
				: days === 1
					? $lang('hearth_yesterday')
					: `${days} ${$lang('hearth_days')}`
	);

	function reset() {
		if ($hearthEditMode || !entity || !available) return;
		requestConfirmation({
			title: $lang('hearth_reset_counter'),
			message: $lang('hearth_reset_counter_message'),
			confirmLabel: $lang('hearth_reset'),
			action: () => {
				const now = new Date();
				const pad = (value: number) => String(value).padStart(2, '0');
				callEntityService('input_datetime', 'set_datetime', entity, {
					date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
					time: `${pad(now.getHours())}:${pad(now.getMinutes())}:00`
				});
			}
		});
	}
</script>

<div
	class="card pressable"
	class:unavailable={!available}
	role="button"
	tabindex="0"
	aria-disabled={!available}
	use:Ripple={PRESS_RIPPLE}
	onclick={reset}
	onkeydown={(event) => activateOnKeyboard(event, reset)}
>
	<Icon name={card.icon || 'event_repeat'} size={ICON.tile} color="var(--h-accent-icon)" />
	<div class="text">
		<div class="name">{label}</div>
		<div class="count">{caption}</div>
	</div>
</div>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 16px;
		border-radius: var(--h-radius-md);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
		box-shadow: var(--h-card-shadow);
		cursor: pointer;
	}

	.card.unavailable {
		opacity: 0.5;
		cursor: default;
	}

	.name {
		font-size: var(--h-type-body);
		color: var(--h-text-3);
	}

	.count {
		font-size: var(--h-type-headline);
		font-weight: 600;
		color: var(--h-text-1);
	}
</style>
