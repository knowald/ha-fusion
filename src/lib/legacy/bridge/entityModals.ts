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
			openModal(() => import('../Modal/LightModal.svelte'), { sel });
			break;

		case 'input_boolean':
		case 'remote':
		case 'siren':
		case 'switch':
			openModal(() => import('../Modal/SwitchModal.svelte'), { sel });
			break;

		case 'script':
			openModal(() => import('../Modal/ScriptModal.svelte'), { sel });
			break;

		case 'automation':
			openModal(() => import('../Modal/AutomationModal.svelte'), { sel });
			break;

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
			openModal(() => import('../Modal/SensorModal.svelte'), { sel });
			break;

		case 'update':
			openModal(() => import('../Modal/UpdateModal.svelte'), { sel });
			break;

		case 'input_number':
		case 'number':
			openModal(() => import('../Modal/InputNumberModal.svelte'), { sel });
			break;

		case 'input_datetime':
		case 'datetime':
			openModal(() => import('../Modal/InputDateModal.svelte'), { sel });
			break;

		case 'input_select':
		case 'select':
			openModal(() => import('../Modal/InputSelectModal.svelte'), { sel });
			break;

		case 'input_text':
		case 'text':
			openModal(() => import('../Modal/InputTextModal.svelte'), { sel });
			break;

		case 'timer':
			openModal(() => import('../Modal/TimerModal.svelte'), { sel });
			break;

		case 'vacuum':
			openModal(() => import('../Modal/VacuumModal.svelte'), { sel });
			break;

		case 'lawn_mower':
			openModal(() => import('../Modal/LawnMowerModal.svelte'), { sel });
			break;

		case 'valve':
			openModal(() => import('../Modal/ValveModal.svelte'), { sel });
			break;

		case 'image':
			openModal(() => import('../Modal/ImageModal.svelte'), { sel });
			break;

		case 'todo':
			openModal(() => import('../Modal/TodoModal.svelte'), { sel });
			break;

		case 'counter':
			openModal(() => import('../Modal/CounterModal.svelte'), { sel });
			break;

		case 'alarm_control_panel':
			openModal(() => import('../Modal/AlarmControlPanelModal.svelte'), { sel });
			break;

		case 'lock':
			openModal(() => import('../Modal/LockModal.svelte'), { sel });
			break;

		case 'climate':
			openModal(() => import('../Modal/ClimateModal.svelte'), { sel });
			break;

		case 'camera':
			openModal(() => import('../Modal/CameraModal.svelte'), { sel });
			break;

		case 'water_heater':
			openModal(() => import('../Modal/WaterHeaterModal.svelte'), { sel });
			break;

		case 'humidifier':
			openModal(() => import('../Modal/HumidifierModal.svelte'), { sel });
			break;

		case 'media_player':
			openModal(() => import('../Modal/MediaPlayer.svelte'), { selected: sel });
			break;

		case 'group':
			openModal(() => import('../Modal/GroupModal.svelte'), { sel });
			break;

		case 'device_tracker': {
			if (get(states)?.[entity_id]?.attributes?.source_type === 'gps') {
				openModal(() => import('../Modal/DeviceTrackerModal.svelte'), { sel });
			} else {
				openModal(() => import('../Modal/SensorModal.svelte'), { sel });
			}
			break;
		}

		case 'cover':
			openModal(() => import('../Modal/CoverModal.svelte'), { selected: sel });
			break;

		case 'fan':
			openModal(() => import('../Modal/FanModal.svelte'), { selected: sel });
			break;

		default:
			openModal(() => import('../Modal/Unknown.svelte'), { selected: sel });
			break;
	}
}
