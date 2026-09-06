import { openModal } from '$lib/Modals';

type ComponentLoader = () => Promise<{ default: any }>;

/** Original dashboard objects embeddable through a Hearth `fusion` card. */
export const fusionObjectEmbeds: Record<string, ComponentLoader> = {
	button: () => import('../Main/Button.svelte'),
	entities: () => import('../Main/Entities.svelte'),
	camera: () => import('../Main/Camera.svelte'),
	picture_elements: () => import('../Main/PictureElements.svelte'),
	conditional_media: () => import('../Main/ConditionalMedia.svelte'),
	days_since: () => import('../Main/DaysSince.svelte'),
	spotify_player: () => import('../Main/SpotifyPlayer.svelte'),
	spotify_player_large: () => import('../Main/SpotifyPlayer.svelte'),
	empty: () => import('../Main/Empty.svelte')
};

/** Original sidebar widgets embeddable through a Hearth `fusion` rail widget. */
export const fusionWidgetEmbeds: Record<string, ComponentLoader> = {
	bar: () => import('../Sidebar/Bar.svelte'),
	camera: () => import('../Sidebar/Camera.svelte'),
	date: () => import('../Sidebar/Date.svelte'),
	divider: () => import('../Sidebar/Divider.svelte'),
	graph: () => import('../Sidebar/Graph.svelte'),
	history: () => import('../Sidebar/History.svelte'),
	iframe: () => import('../Sidebar/Iframe.svelte'),
	image: () => import('../Sidebar/Image.svelte'),
	notifications: () => import('../Sidebar/Notifications.svelte'),
	radial: () => import('../Sidebar/Radial.svelte'),
	sensor: () => import('../Sidebar/Sensor.svelte'),
	template: () => import('../Sidebar/Template.svelte'),
	time: () => import('../Sidebar/Time.svelte'),
	timer: () => import('../Sidebar/Timer.svelte'),
	weather: () => import('../Sidebar/Weather.svelte'),
	weather_forecast: () => import('../Sidebar/WeatherForecast.svelte')
};

/** The tap behaviour the original sidebar gives its camera and timer items. */
export function openFusionWidgetModal(item: Record<string, any>) {
	if (item?.type === 'camera') {
		openModal(() => import('../Modal/CameraModal.svelte'), { sel: item });
	} else if (item?.type === 'timer') {
		openModal(() => import('../Modal/TimerModal.svelte'), { sel: item });
	}
}
