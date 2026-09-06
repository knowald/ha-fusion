<script lang="ts">
	import { ICON } from '../../iconSizes';
	import Ripple from '$lib/ui/actions/ripple';
	import { connected } from '$lib/core/ha/connection';
	import { lang, selectedLanguage } from '$lib/core/i18n';
	import { dateKey, parseLocalDate } from '$lib/core/i18n/time';
	import { timer } from '$lib/core/app/clock';
	import { states } from '$lib/core/ha/entities';
	import { PRESS_RIPPLE, type RailWidget } from '../../config';
	import { clockTimeOptions } from '../../clock';
	import { fetchCalendarEvents, startDataRefresh, type CalendarEvent } from '$lib/core/ha/history';
	import { displayTimeZone, hearthConfig, hearthEditMode } from '../../store';
	import { sensorNumber } from '$lib/core/ha/entities';
	import { openEntityDetail } from '$lib/Hearth/details';
	import Icon from '../../Icon.svelte';

	let { widget }: { widget: Extract<RailWidget, { type: 'calendar' }> } = $props();

	interface NextEvent {
		title: string;
		start: Date;
		allDay: boolean;
		/** YYYY-MM-DD of an all-day event; a calendar date has no zone. */
		date?: string;
	}

	function parseEvent(event: CalendarEvent): NextEvent | null {
		// calendar.get_events returns ISO strings, with all-day events using a
		// date-only value. Retain support for the object form used by some older
		// calendar clients as well.
		const rawStart = event?.start;
		const startValue =
			typeof rawStart === 'string' ? rawStart : (rawStart?.dateTime ?? rawStart?.date);
		const start = startValue ? parseLocalDate(startValue) : new Date(NaN);
		if (Number.isNaN(start.getTime())) return null;
		const allDay = startValue !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(startValue);

		return {
			title: event?.summary ?? $lang('hearth_busy'),
			start,
			allDay,
			date: allDay ? startValue : undefined
		};
	}

	let next = $state<NextEvent | null>(null);
	$effect(() => {
		void widget.entities;
		void widget.lookahead_hours;
		next = null;
	});

	$effect(() => {
		const entities = widget.entities ?? [];
		const lookaheadHours = widget.lookahead_hours ?? 24;
		if (!$connected || !entities.length) return;

		async function fetchNext() {
			const events: NextEvent[] = (
				await fetchCalendarEvents(
					entities,
					new Date(),
					new Date(Date.now() + lookaheadHours * 3600 * 1000)
				)
			)
				.map(parseEvent)
				.filter((event): event is NextEvent => event !== null)
				.sort((a, b) => a.start.getTime() - b.start.getTime());
			return events[0] ?? null;
		}

		return startDataRefresh(fetchNext, (value) => (next = value));
	});

	// event times follow the rail clock's hour format, so 17:00 on the clock is
	// never "5:00 PM" one widget below it
	let configuredClock = $derived($hearthConfig.rail.find((widget) => widget.type === 'clock'));

	function clockTime(date: Date) {
		return date.toLocaleTimeString(
			$selectedLanguage,
			clockTimeOptions($displayTimeZone, configuredClock?.hour_format)
		);
	}

	let timeLine = $derived.by(() => {
		if (!next) return '';
		// an all-day event names a calendar date; a timed one falls on whatever
		// day it is in the display zone
		const eventDay = next.date ?? dateKey(next.start, $displayTimeZone);
		const sameDay = eventDay === dateKey($timer, $displayTimeZone);
		const day = sameDay
			? ''
			: `${next.start.toLocaleDateString($selectedLanguage, {
					weekday: 'long',
					...(next.allDay || !$displayTimeZone ? {} : { timeZone: $displayTimeZone })
				})} `;
		if (next.allDay) return `${day}${$lang('hearth_all_day')}`.trim();
		let line = `${day}${clockTime(next.start)}`;
		const travelMinutes = widget.travel_entity
			? sensorNumber($states?.[widget.travel_entity]?.state)
			: null;
		if (travelMinutes !== null) {
			const leave = new Date(next.start.getTime() - travelMinutes * 60_000);
			line += ` · ${$lang('hearth_leave_by')} ${clockTime(leave)}`;
		}
		return line;
	});

	function openCalendar() {
		const entity = widget.entities?.[0];
		if (entity) openEntityDetail(entity);
	}
</script>

{#if next || $hearthEditMode}
	<div class="row" class:inactive={!next}>
		<Icon name="event" size={ICON.control} color="var(--h-icon)" />
		<div class="body">
			<div class="title">{next?.title ?? $lang('hearth_no_upcoming_events')}</div>
			{#if timeLine}
				<div class="time">{timeLine}</div>
			{/if}
		</div>
		<button
			type="button"
			class="chevron pressable"
			aria-label={$lang('calendar')}
			use:Ripple={PRESS_RIPPLE}
			onclick={openCalendar}
		>
			<Icon name="chevron_right" size={ICON.control} color="var(--h-icon)" />
		</button>
	</div>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 10px 10px 14px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / calc(0.045 * var(--h-fill-scale)));
		box-shadow: var(--h-card-shadow);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.07 * var(--h-line-scale)));
		margin-bottom: 8px;
	}

	.row.inactive {
		opacity: 0.45;
	}

	.body {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: var(--h-type-secondary);
		font-weight: 500;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: var(--h-type-small);
		color: var(--h-text-5);
		margin-top: 2px;
	}

	.chevron {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		margin: -10px -6px -10px 0;
		padding: 0;
		border-radius: 50%;
		cursor: pointer;
		border: 0;
		background: none;
	}
</style>
