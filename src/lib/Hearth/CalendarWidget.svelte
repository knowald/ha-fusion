<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { connection, states } from '$lib/Stores';
	import { PRESS_RIPPLE, type RailWidget } from './config';
	import { hearthEditMode, sensorNumber } from './store';
	import { openEntityModal } from './modals';
	import Icon from './Icon.svelte';

	let { widget }: { widget: Extract<RailWidget, { type: 'calendar' }> } = $props();

	const REFRESH_MS = 5 * 60 * 1000;

	interface NextEvent {
		title: string;
		start: Date;
		allDay: boolean;
	}

	function parseEvent(event: any): NextEvent | null {
		// calendar.get_events returns ISO strings, with all-day events using a
		// date-only value. Retain support for the object form used by some older
		// calendar clients as well.
		const rawStart = event?.start;
		const startValue =
			typeof rawStart === 'string' ? rawStart : (rawStart?.dateTime ?? rawStart?.date);
		const start = new Date(startValue ?? NaN);
		if (Number.isNaN(start.getTime())) return null;

		return {
			title: event?.summary ?? 'Busy',
			start,
			allDay:
				typeof rawStart === 'string'
					? /^\d{4}-\d{2}-\d{2}$/.test(rawStart)
					: !!rawStart?.date && !rawStart?.dateTime
		};
	}

	let next = $state<NextEvent | null>(null);

	$effect(() => {
		const conn = $connection;
		const entities = widget.entities ?? [];
		const lookaheadHours = widget.lookahead_hours ?? 24;
		next = null;
		if (!conn || !entities.length) return;

		let cancelled = false;

		async function fetchNext() {
			try {
				const result: any = await conn?.sendMessagePromise({
					type: 'call_service',
					domain: 'calendar',
					service: 'get_events',
					target: { entity_id: entities },
					service_data: {
						start_date_time: new Date().toISOString(),
						end_date_time: new Date(Date.now() + lookaheadHours * 3600 * 1000).toISOString()
					},
					return_response: true
				});
				if (cancelled) return;
				const events: NextEvent[] = Object.values(result?.response ?? {})
					.flatMap((calendar: any) => calendar?.events ?? [])
					.map(parseEvent)
					.filter((event): event is NextEvent => event !== null)
					.sort((a, b) => a.start.getTime() - b.start.getTime());
				next = events[0] ?? null;
			} catch {
				// calendar.get_events unsupported or entity gone, row stays hidden
				if (!cancelled) next = null;
			}
		}

		fetchNext();
		const timer = setInterval(fetchNext, REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	});

	function clockTime(date: Date) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	let timeLine = $derived.by(() => {
		if (!next) return '';
		const sameDay = next.start.toDateString() === new Date().toDateString();
		const day = sameDay ? '' : `${next.start.toLocaleDateString('en-US', { weekday: 'short' })} `;
		if (next.allDay) return `${day}all day`.trim();
		let line = `${day}${clockTime(next.start)}`;
		const travelMinutes = widget.travel_entity
			? sensorNumber($states?.[widget.travel_entity]?.state)
			: null;
		if (travelMinutes !== null) {
			const leave = new Date(next.start.getTime() - travelMinutes * 60_000);
			line += ` · leave by ${clockTime(leave)}`;
		}
		return line;
	});

	function openCalendar() {
		const entity = widget.entities?.[0];
		if (entity) openEntityModal(entity);
	}
</script>

{#if next || $hearthEditMode}
	<div class="row" class:inactive={!next}>
		<Icon name="event" size={20} color="var(--h-icon)" />
		<div class="body">
			<div class="title">{next?.title ?? 'No upcoming events'}</div>
			{#if timeLine}
				<div class="time">{timeLine}</div>
			{/if}
		</div>
		<span class="chevron pressable" use:Ripple={PRESS_RIPPLE} onclick={openCalendar}>
			<Icon name="chevron_right" size={20} color="var(--h-icon)" />
		</span>
	</div>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 10px 10px 14px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-surface-rgb) / 0.045);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
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
		font-size: 13px;
		font-weight: 500;
		color: var(--h-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.time {
		font-size: 12px;
		color: var(--h-text-5);
		margin-top: 2px;
	}

	.chevron {
		display: flex;
		align-items: center;
		padding: 4px;
		border-radius: 50%;
		cursor: pointer;
	}
</style>
