import { get } from 'svelte/store';
import { calendarFirstDay, calendarView, selectedLanguage } from '$lib/Stores';
import { getDomain } from '$lib/core/ha/entities';
import { openModal } from '$lib/Modals';

/**
 * The original dashboard's detail modals for the domains Hearth has no native
 * surface for yet: a calendar, a todo list and a GPS map. Everything else
 * opens Hearth's own detail sheet (src/lib/Hearth/details).
 */
export async function openEntityModal(entity_id: string, name?: string) {
	const sel = { type: 'button', id: `hearth-${entity_id}`, entity_id, name };

	switch (getDomain(entity_id)) {
		case 'calendar': {
			const language = get(selectedLanguage) || 'en';
			calendarFirstDay.set(
				'weekInfo' in Intl.Locale.prototype
					? (new Intl.Locale(language) as any)?.weekInfo.firstDay
					: (await import('weekstart')).getWeekStartByLocale(language)
			);
			calendarView.set(localStorage.getItem('calendar'));
			openModal(() => import('../Modal/CalendarModal.svelte'), { sel });
			break;
		}
		case 'todo':
			openModal(() => import('../Modal/TodoModal.svelte'), { sel });
			break;
		case 'device_tracker':
			openModal(() => import('../Modal/DeviceTrackerModal.svelte'), { sel });
			break;
		default:
			openModal(() => import('../Modal/Unknown.svelte'), { selected: sel });
	}
}
