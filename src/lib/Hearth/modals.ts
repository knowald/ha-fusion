import { get } from 'svelte/store';
import { calendarFirstDay, calendarView, selectedLanguage, states } from '$lib/Stores';
import { getDomain } from '$lib/Utils';
import { openModal } from '$lib/Modals';

/**
 * Opens the matching fusion domain modal for any entity. Mirrors the switch in
 * Main/Button.svelte so every entity domain the original dashboard handles is
 * reachable from hearth tiles too.
 */
export async function openEntityModal(entity_id: string, name?: string) {
	const sel = { type: 'button', id: `hearth-${entity_id}`, entity_id, name };

	switch (getDomain(entity_id)) {
		case 'light':
			openModal(() => import('$lib/legacy/Modal/LightModal.svelte'), { sel });
			break;

		case 'input_boolean':
		case 'remote':
		case 'siren':
		case 'switch':
			openModal(() => import('$lib/legacy/Modal/SwitchModal.svelte'), { sel });
			break;

		case 'script':
			openModal(() => import('$lib/legacy/Modal/ScriptModal.svelte'), { sel });
			break;

		case 'automation':
			openModal(() => import('$lib/legacy/Modal/AutomationModal.svelte'), { sel });
			break;

		case 'calendar': {
			const language = get(selectedLanguage) || 'en';
			calendarFirstDay.set(
				'weekInfo' in Intl.Locale.prototype
					? (new Intl.Locale(language) as any)?.weekInfo.firstDay
					: (await import('weekstart')).getWeekStartByLocale(language)
			);
			calendarView.set(localStorage.getItem('calendar'));
			openModal(() => import('$lib/legacy/Modal/CalendarModal.svelte'), { sel });
			break;
		}

		case 'air_quality':
		case 'date':
		case 'time':
		case 'event':
		case 'image_processing':
		case 'mailbox':
		case 'sensor':
		case 'binary_sensor':
		case 'stt':
		case 'weather':
		case 'button':
		case 'scene':
		case 'schedule':
		case 'sun':
		case 'person':
		case 'zone':
		case 'input_button':
			openModal(() => import('$lib/legacy/Modal/SensorModal.svelte'), { sel });
			break;

		case 'update':
			openModal(() => import('$lib/legacy/Modal/UpdateModal.svelte'), { sel });
			break;

		case 'input_number':
		case 'number':
			openModal(() => import('$lib/legacy/Modal/InputNumberModal.svelte'), { sel });
			break;

		case 'input_datetime':
		case 'datetime':
			openModal(() => import('$lib/legacy/Modal/InputDateModal.svelte'), { sel });
			break;

		case 'input_select':
		case 'select':
			openModal(() => import('$lib/legacy/Modal/InputSelectModal.svelte'), { sel });
			break;

		case 'input_text':
		case 'text':
			openModal(() => import('$lib/legacy/Modal/InputTextModal.svelte'), { sel });
			break;

		case 'timer':
			openModal(() => import('$lib/legacy/Modal/TimerModal.svelte'), { sel });
			break;

		case 'vacuum':
			openModal(() => import('$lib/legacy/Modal/VacuumModal.svelte'), { sel });
			break;

		case 'lawn_mower':
			openModal(() => import('$lib/legacy/Modal/LawnMowerModal.svelte'), { sel });
			break;

		case 'valve':
			openModal(() => import('$lib/legacy/Modal/ValveModal.svelte'), { sel });
			break;

		case 'image':
			openModal(() => import('$lib/legacy/Modal/ImageModal.svelte'), { sel });
			break;

		case 'todo':
			openModal(() => import('$lib/legacy/Modal/TodoModal.svelte'), { sel });
			break;

		case 'counter':
			openModal(() => import('$lib/legacy/Modal/CounterModal.svelte'), { sel });
			break;

		case 'alarm_control_panel':
			openModal(() => import('$lib/legacy/Modal/AlarmControlPanelModal.svelte'), { sel });
			break;

		case 'lock':
			openModal(() => import('$lib/legacy/Modal/LockModal.svelte'), { sel });
			break;

		case 'climate':
			openModal(() => import('$lib/legacy/Modal/ClimateModal.svelte'), { sel });
			break;

		case 'camera':
			openModal(() => import('$lib/legacy/Modal/CameraModal.svelte'), { sel });
			break;

		case 'water_heater':
			openModal(() => import('$lib/legacy/Modal/WaterHeaterModal.svelte'), { sel });
			break;

		case 'humidifier':
			openModal(() => import('$lib/legacy/Modal/HumidifierModal.svelte'), { sel });
			break;

		case 'media_player':
			openModal(() => import('$lib/legacy/Modal/MediaPlayer.svelte'), { selected: sel });
			break;

		case 'group':
			openModal(() => import('$lib/legacy/Modal/GroupModal.svelte'), { sel });
			break;

		case 'device_tracker': {
			if (get(states)?.[entity_id]?.attributes?.source_type === 'gps') {
				openModal(() => import('$lib/legacy/Modal/DeviceTrackerModal.svelte'), { sel });
			} else {
				openModal(() => import('$lib/legacy/Modal/SensorModal.svelte'), { sel });
			}
			break;
		}

		case 'cover':
			openModal(() => import('$lib/legacy/Modal/CoverModal.svelte'), { selected: sel });
			break;

		case 'fan':
			openModal(() => import('$lib/legacy/Modal/FanModal.svelte'), { selected: sel });
			break;

		default:
			openModal(() => import('$lib/legacy/Modal/Unknown.svelte'), { selected: sel });
			break;
	}
}
