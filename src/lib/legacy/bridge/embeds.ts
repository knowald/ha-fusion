import { openModal } from '$lib/Modals';

type ComponentLoader = () => Promise<{ default: any }>;

/** Original dashboard objects embeddable through a Hearth `fusion` card. */
export const fusionObjectEmbeds: Record<string, ComponentLoader> = {
	button: () => import('../Main/Button.svelte'),
	entities: () => import('../Main/Entities.svelte'),
	camera: () => import('../Main/Camera.svelte'),
	empty: () => import('../Main/Empty.svelte')
};

/** Original sidebar widgets embeddable through a Hearth `fusion` rail widget. */
export const fusionWidgetEmbeds: Record<string, ComponentLoader> = {
	camera: () => import('../Sidebar/Camera.svelte'),
	date: () => import('../Sidebar/Date.svelte'),
	divider: () => import('../Sidebar/Divider.svelte'),
	image: () => import('../Sidebar/Image.svelte'),
	sensor: () => import('../Sidebar/Sensor.svelte'),
	time: () => import('../Sidebar/Time.svelte'),
	weather: () => import('../Sidebar/Weather.svelte'),
	weather_forecast: () => import('../Sidebar/WeatherForecast.svelte')
};

/** The tap behaviour the original sidebar gives its camera item. */
export function openFusionWidgetModal(item: Record<string, any>) {
	if (item?.type === 'camera') {
		openModal(() => import('../Modal/CameraModal.svelte'), { sel: item });
	}
}
