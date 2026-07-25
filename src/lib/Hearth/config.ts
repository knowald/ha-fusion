export interface HearthLight {
	id: string;
	name: string;
	entity: string;
}

export interface HearthBlind {
	id: string;
	name: string;
	entity: string;
}

export type HearthDevice =
	| { type: 'fan'; entity: string; name: string; icon: string }
	| { type: 'switch'; entity: string; name: string; icon: string; readonly?: boolean }
	| { type: 'sensor'; entity: string; name: string; icon: string; unit?: string }
	// any HA domain: taps toggle when the domain supports it, otherwise (and via
	// the tune button) the matching fusion domain modal opens
	| { type: 'entity'; entity: string; name: string; icon?: string };

export interface HearthRoom {
	id: string;
	name: string;
	icon: string;
	summary?: string;
	temp_entity?: string;
	humidity_entity?: string;
	// drops the built-in page header; a `header` card can take its place
	hide_header?: boolean;
	lights: string[];
	blinds: string[];
	devices: HearthDevice[];
	cards?: OverviewCard[];
}

export interface EntityRef {
	entity: string;
	name?: string;
	icon?: string;
	// per-entity presentation; falls back to the card's style when unset
	display?: 'tile' | 'stat';
}

/**
 * Per-item visibility condition, mirroring the original's section conditions
 * but trimmed to the two cases Hearth's builder exposes. All conditions on an
 * item AND together.
 */
export type VisibilityCondition =
	{ entity: string; state?: string; state_not?: string } | { media: string };

type RailWidgetVariant =
	| { id: string; type: 'clock'; city?: string }
	| { id: string; type: 'weather'; entity?: string }
	| { id: string; type: 'nav' }
	| { id: string; type: 'spacer' }
	| { id: string; type: 'label'; text?: string }
	// price is a static amount per kWh; price_entity overrides it when set
	| {
			id: string;
			type: 'energy';
			entity?: string;
			price?: number;
			price_entity?: string;
			currency?: string;
	  }
	// generic running-activity row (washer, 3d print, charging, ...); hidden
	// unless the status entity is active - by the active_states list when given,
	// otherwise by not being in a common idle-state set
	| {
			id: string;
			type: 'progress';
			name?: string;
			icon?: string;
			status_entity?: string;
			progress_entity?: string;
			// appended verbatim to the progress value readout, e.g. "%"
			unit?: string;
			remaining_entity?: string;
			active_states?: string[];
			// states that mark a just-finished activity; the row remains dismissible
			// for completion_delay_minutes before hiding automatically
			completed_states?: string[];
			completion_delay_minutes?: number;
	  }
	| {
			id: string;
			type: 'calendar';
			entities?: string[];
			travel_entity?: string;
			lookahead_hours?: number;
	  }
	| { id: string; type: 'status'; icon?: string; text?: string; entity?: string }
	| { id: string; type: 'entity'; entity?: string; name?: string; icon?: string }
	| { id: string; type: 'fusion'; config?: Record<string, any> };

// hidden below Hearth's mobile breakpoint, mirroring the original sidebar's hide_mobile
export type RailWidget = RailWidgetVariant & {
	hide_mobile?: boolean;
	visibility?: VisibilityCondition[];
};

type OverviewCardVariant =
	// the room-style page header as a plain card, usable on any dashboard
	| {
			id: string;
			type: 'header';
			title?: string;
			subtitle?: string;
			icon?: string;
			temp_entity?: string;
			humidity_entity?: string;
	  }
	| { id: string; type: 'temperature'; label?: string; entity?: string; unit?: string }
	| { id: string; type: 'media'; entity?: string }
	| { id: string; type: 'vacuum'; entity?: string }
	// the general-purpose grid: any mix of domains, tiles adapt per domain
	// (lights dim on drag, covers show position). `stat` renders big sensor
	// readouts instead of tiles; `columns` fixes the column count.
	| {
			id: string;
			type: 'entities';
			title?: string;
			style?: 'tile' | 'stat';
			columns?: number;
			show_count?: boolean;
			entities: EntityRef[];
	  }
	| { id: string; type: 'camera'; entity?: string; title?: string }
	| { id: string; type: 'climate'; entity?: string; title?: string }
	| { id: string; type: 'scenes'; title?: string; scenes: EntityRef[] }
	| { id: string; type: 'fusion'; config?: Record<string, any> };

export type OverviewCard = OverviewCardVariant & { visibility?: VisibilityCondition[] };

/**
 * A named horizontal or vertical layout container, parity with the original
 * dashboard's horizontal-stack/vertical-stack. One level deep only - a
 * stack's children are always plain cards, never another stack.
 */
export interface OverviewStack {
	id: string;
	kind: 'stack';
	title?: string;
	direction: 'horizontal' | 'vertical';
	cards: OverviewCard[];
}

/** Anything that can occupy a top-level slot in an overview column. */
export type OverviewItem = OverviewCard | OverviewStack;

export function isStack(item: OverviewItem): item is OverviewStack {
	return 'kind' in item && item.kind === 'stack';
}

export type HearthTheme = Record<string, string>;

export interface HearthConfig {
	theme?: HearthTheme;
	rail: RailWidget[];
	overview: OverviewItem[][];
	lights: HearthLight[];
	blinds: HearthBlind[];
	rooms: HearthRoom[];
	// display options for wall tablets; screensaver off when unset
	screensaver_minutes?: number;
	keep_screen_on?: boolean;
	// extra edge padding in px, for kiosks whose frame covers screen edges
	padding_x?: number;
	padding_y?: number;
}

export const RAIL_WIDGET_TYPES: { value: RailWidget['type']; label: string }[] = [
	{ value: 'clock', label: 'Clock' },
	{ value: 'weather', label: 'Weather' },
	{ value: 'nav', label: 'Room navigation' },
	{ value: 'spacer', label: 'Spacer' },
	{ value: 'label', label: 'Section label' },
	{ value: 'energy', label: 'Energy today' },
	{ value: 'progress', label: 'Progress (running activity)' },
	{ value: 'calendar', label: 'Calendar (next event)' },
	{ value: 'status', label: 'Status pill' },
	{ value: 'entity', label: 'Entity' },
	{ value: 'fusion', label: 'Fusion widget (graph, bar, camera, ...)' }
];

export const OVERVIEW_CARD_TYPES: { value: OverviewCard['type']; label: string }[] = [
	{ value: 'entities', label: 'Entity grid' },
	{ value: 'header', label: 'Header' },
	{ value: 'temperature', label: 'Sensor reading + sparkline' },
	{ value: 'media', label: 'Media player' },
	{ value: 'vacuum', label: 'Vacuum' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'climate', label: 'Climate (thermostat)' },
	{ value: 'scenes', label: 'Scene chips' },
	{ value: 'fusion', label: 'Fusion object (template, picture elements, ...)' }
];

/** Original main object types embeddable through the fusion card. */
export const FUSION_OBJECT_TYPES: { value: string; label: string }[] = [
	{ value: 'button', label: 'Button' },
	{ value: 'entities', label: 'Entities list' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'picture_elements', label: 'Picture elements' },
	{ value: 'conditional_media', label: 'Conditional media' },
	{ value: 'days_since', label: 'Days since' },
	{ value: 'spotify_player', label: 'Spotify player' },
	{ value: 'spotify_player_large', label: 'Spotify player (large)' },
	{ value: 'empty', label: 'Empty spacer' }
];

/** Original sidebar widget types embeddable through the fusion rail widget. */
export const FUSION_WIDGET_TYPES: { value: string; label: string }[] = [
	{ value: 'sensor', label: 'Sensor' },
	{ value: 'template', label: 'Template' },
	{ value: 'graph', label: 'Graph' },
	{ value: 'bar', label: 'Bar' },
	{ value: 'radial', label: 'Radial' },
	{ value: 'history', label: 'History' },
	{ value: 'camera', label: 'Camera' },
	{ value: 'image', label: 'Image' },
	{ value: 'iframe', label: 'Iframe' },
	{ value: 'time', label: 'Time' },
	{ value: 'date', label: 'Date' },
	{ value: 'timer', label: 'Timer' },
	{ value: 'weather', label: 'Weather (compact)' },
	{ value: 'weather_forecast', label: 'Weather forecast' },
	{ value: 'notifications', label: 'Notifications' },
	{ value: 'divider', label: 'Divider' }
];

export const DEFAULT_HEARTH_CONFIG: HearthConfig = {
	rail: [
		{ id: 'clock', type: 'clock', city: 'Wrocław' },
		{ id: 'weather', type: 'weather', entity: 'weather.forecast_dom' },
		{ id: 'nav', type: 'nav' },
		{ id: 'spacer', type: 'spacer' },
		{ id: 'status', type: 'status', icon: 'eco', text: 'All systems nominal' }
	],
	overview: [
		[
			{
				id: 'lights',
				type: 'entities',
				title: 'Lights',
				show_count: true,
				entities: [
					{ entity: 'light.living_room', name: 'Living Room' },
					{ entity: 'light.hallway', name: 'Hallway' },
					{ entity: 'light.bedroom', name: 'Bedroom' },
					{ entity: 'light.kitchen', name: 'Kitchen' },
					{ entity: 'light.office', name: 'Office' },
					{ entity: 'light.bathroom_ikea_lights', name: 'Bathroom' }
				]
			},
			{
				id: 'blinds',
				type: 'entities',
				title: 'Blinds',
				entities: [
					{ entity: 'cover.0x0c2a6ffffe193952', name: 'Bedroom' },
					{ entity: 'cover.rolety_biuro', name: 'Office' }
				]
			},
			{
				id: 'avg-temp',
				type: 'temperature',
				label: 'Average home temperature',
				entity: 'sensor.average_temperature',
				unit: '°C'
			}
		],
		[
			{
				id: 'air',
				type: 'entities',
				title: 'Air',
				entities: [
					{
						entity: 'sensor.mi_air_purifier_3_3h_beta_pm2_5',
						name: 'Home PM2.5',
						display: 'stat'
					},
					{
						entity: 'sensor.timmerflotte_temp_hmd_sensor_humidity_5',
						name: 'Humidity',
						display: 'stat'
					},
					{
						entity: 'sensor.mi_air_purifier_3_3h_alpha_filter_lifetime_remaining',
						name: 'Filter · Bedroom',
						icon: 'mode_fan'
					},
					{
						entity: 'sensor.mi_air_purifier_3_3h_beta_filter_lifetime_remaining',
						name: 'Filter · Living',
						icon: 'mode_fan'
					}
				]
			},
			{ id: 'media', type: 'media', entity: 'media_player.spotify_kevin_nowald' },
			{ id: 'vacuum', type: 'vacuum', entity: 'vacuum.roborock_qrevo_curv' }
		]
	],
	lights: [
		{ id: 'living', name: 'Living Room', entity: 'light.living_room' },
		{ id: 'hallway', name: 'Hallway', entity: 'light.hallway' },
		{ id: 'bedroom', name: 'Bedroom', entity: 'light.bedroom' },
		{ id: 'kitchen', name: 'Kitchen', entity: 'light.kitchen' },
		{ id: 'office', name: 'Office', entity: 'light.office' },
		{ id: 'bathroom', name: 'Bathroom', entity: 'light.bathroom_ikea_lights' }
	],
	blinds: [
		{ id: 'bedroom', name: 'Bedroom', entity: 'cover.0x0c2a6ffffe193952' },
		{ id: 'office', name: 'Office', entity: 'cover.rolety_biuro' }
	],
	rooms: [
		{
			id: 'living',
			name: 'Living Room',
			icon: 'weekend',
			summary: 'Cozy · curtains open',
			temp_entity: 'sensor.timmerflotte_temp_hmd_sensor_temperature_5',
			humidity_entity: 'sensor.timmerflotte_temp_hmd_sensor_humidity_5',
			lights: ['living'],
			blinds: [],
			devices: [
				{ type: 'fan', entity: 'fan.ceiling_fan', name: 'Ceiling Fan', icon: 'mode_fan' },
				{ type: 'switch', entity: 'media_player.living_room_tv', name: 'Television', icon: 'tv' },
				// the PS5 integration exposes no turn_on/off services
				{
					type: 'switch',
					entity: 'media_player.playstation_5',
					name: 'PlayStation 5',
					icon: 'sports_esports',
					readonly: true
				},
				{
					type: 'sensor',
					entity: 'sensor.mi_air_purifier_3_3h_beta_filter_lifetime_remaining',
					name: 'Air Filter',
					icon: 'mode_fan',
					unit: '%'
				}
			]
		},
		{
			id: 'office',
			name: 'Office',
			icon: 'desk',
			summary: 'Focused · blinds open',
			temp_entity: 'sensor.average_temperature',
			humidity_entity: 'sensor.timmerflotte_temp_hmd_sensor_humidity_5',
			lights: ['office'],
			blinds: ['office'],
			devices: []
		},
		{
			id: 'bedroom',
			name: 'Bedroom',
			icon: 'bed',
			summary: 'Calm · blinds open',
			temp_entity: 'sensor.mi_air_purifier_3_3h_alpha_temperature',
			humidity_entity: 'sensor.mi_air_purifier_3_3h_alpha_humidity',
			lights: ['bedroom'],
			blinds: ['bedroom'],
			devices: [
				{
					type: 'sensor',
					entity: 'sensor.mi_air_purifier_3_3h_alpha_filter_lifetime_remaining',
					name: 'Air Filter',
					icon: 'mode_fan',
					unit: '%'
				}
			]
		},
		{
			id: 'kitchen',
			name: 'Kitchen',
			icon: 'countertops',
			summary: 'Warmest room',
			temp_entity: 'sensor.average_temperature',
			humidity_entity: 'sensor.timmerflotte_temp_hmd_sensor_humidity_5',
			lights: ['kitchen'],
			blinds: [],
			devices: [
				{
					type: 'switch',
					entity: 'switch.eversweet_3_pro_power',
					name: 'Pet Fountain',
					icon: 'water_drop'
				}
			]
		},
		{
			id: 'hallway',
			name: 'Hallway',
			icon: 'meeting_room',
			summary: 'Entryway',
			temp_entity: 'sensor.average_temperature',
			humidity_entity: 'sensor.timmerflotte_temp_hmd_sensor_humidity_5',
			lights: ['hallway'],
			blinds: [],
			devices: []
		}
	]
};

function normalizeVisibilityCondition(raw: any): VisibilityCondition | null {
	if (!raw || typeof raw !== 'object') return null;
	if (typeof raw.media === 'string' && raw.media.trim()) {
		return { media: raw.media };
	}
	if (typeof raw.entity === 'string' && raw.entity.trim()) {
		const condition: VisibilityCondition = { entity: raw.entity };
		if (typeof raw.state === 'string' && raw.state !== '') condition.state = raw.state;
		if (typeof raw.state_not === 'string' && raw.state_not !== '')
			condition.state_not = raw.state_not;
		return condition;
	}
	return null;
}

/** Drops the field entirely rather than keeping an empty array. */
export function normalizeVisibility(raw: unknown): VisibilityCondition[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const conditions = raw
		.map(normalizeVisibilityCondition)
		.filter((condition): condition is VisibilityCondition => condition !== null);
	return conditions.length ? conditions : undefined;
}

interface LegacyRegistries {
	lights: HearthLight[];
	blinds: HearthBlind[];
}

export function registryEntityRefs(registry: { entity: string; name: string }[]): EntityRef[] {
	return registry.map(({ entity, name }) => ({ entity, name }));
}

/**
 * Converts the retired single-purpose card types (lights grid, blinds grid,
 * air quality) into equivalent entity-grid cards. The grids mirrored the
 * top-level lights/blinds registries, so their entities come from there.
 */
function migrateLegacyCard(card: any, registries: LegacyRegistries): any {
	if (card?.type === 'lights') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Lights',
			show_count: true,
			entities: registryEntityRefs(registries.lights),
			visibility: card.visibility
		};
	}
	if (card?.type === 'blinds') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Blinds',
			entities: registryEntityRefs(registries.blinds),
			visibility: card.visibility
		};
	}
	if (card?.type === 'air') {
		return {
			id: card.id,
			type: 'entities',
			title: card.title ?? 'Air',
			entities: [
				...(card.pm25_entity
					? [{ entity: card.pm25_entity, name: 'Home PM2.5', display: 'stat' }]
					: []),
				...(card.humidity_entity
					? [{ entity: card.humidity_entity, name: 'Humidity', display: 'stat' }]
					: []),
				...(Array.isArray(card.filters) ? card.filters : [])
					.filter((filter: any) => typeof filter?.entity === 'string')
					.map((filter: any) => ({ entity: filter.entity, name: filter.label, icon: 'mode_fan' }))
			],
			visibility: card.visibility
		};
	}
	return card;
}

function normalizeEntityRef(raw: any): EntityRef {
	return {
		...raw,
		display: raw?.display === 'stat' || raw?.display === 'tile' ? raw.display : undefined
	};
}

function normalizeCard(raw: any, fallbackId: string, registries: LegacyRegistries): OverviewCard {
	const card = migrateLegacyCard(raw, registries);
	return {
		...card,
		id: card.id ?? fallbackId,
		...(card.type === 'entities'
			? {
					entities: (Array.isArray(card.entities) ? card.entities : []).map(normalizeEntityRef),
					style: card.style === 'stat' ? 'stat' : undefined,
					columns:
						typeof card.columns === 'number' && card.columns >= 1
							? Math.floor(card.columns)
							: undefined,
					show_count: card.show_count === true ? true : undefined
				}
			: {}),
		...(card.type === 'scenes' ? { scenes: Array.isArray(card.scenes) ? card.scenes : [] } : {}),
		visibility: normalizeVisibility(card.visibility)
	};
}

function normalizeStack(raw: any, fallbackId: string, registries: LegacyRegistries): OverviewStack {
	const id = raw.id ?? fallbackId;
	const direction: OverviewStack['direction'] =
		raw.direction === 'vertical' ? 'vertical' : 'horizontal';
	const title = typeof raw.title === 'string' ? raw.title.trim() : '';
	const cards = (Array.isArray(raw.cards) ? raw.cards : [])
		// children may be any non-stack card - nesting stops here
		.filter((child: any) => child?.kind !== 'stack')
		.map((child: any, index: number) => normalizeCard(child, `${id}-card-${index}`, registries));
	return { id, kind: 'stack', direction, cards, ...(title ? { title } : {}) };
}

function normalizeOverviewItem(
	raw: any,
	fallbackId: string,
	registries: LegacyRegistries
): OverviewItem {
	return raw?.kind === 'stack'
		? normalizeStack(raw, fallbackId, registries)
		: normalizeCard(raw, fallbackId, registries);
}

/**
 * Accepts current config files, the pre-card v1 shape (flat entity fields, no
 * rail/overview), and garbage. Anything unusable falls back to defaults.
 */
export function normalizeHearthConfig(raw: unknown): HearthConfig {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Object.keys(raw).length) {
		return structuredClone(DEFAULT_HEARTH_CONFIG);
	}
	const config = raw as Record<string, any>;
	const defaults = structuredClone(DEFAULT_HEARTH_CONFIG);

	const registries: LegacyRegistries = {
		lights: Array.isArray(config.lights) ? config.lights : defaults.lights,
		blinds: Array.isArray(config.blinds) ? config.blinds : defaults.blinds
	};

	const rooms: HearthRoom[] = (Array.isArray(config.rooms) ? config.rooms : []).map(
		(room: any) => ({
			...room,
			hide_header: room.hide_header === true ? true : undefined,
			lights: Array.isArray(room.lights) ? room.lights : [],
			blinds: Array.isArray(room.blinds) ? room.blinds : [],
			devices: Array.isArray(room.devices) ? room.devices : [],
			...(room.cards !== undefined
				? {
						// rooms are out of scope for stacks - drop any stray ones
						cards: (Array.isArray(room.cards) ? room.cards : [])
							.filter((card: any) => card?.kind !== 'stack')
							.map((card: any, index: number) =>
								normalizeCard(card, `card-${room.id}-${index}`, registries)
							)
					}
				: {})
		})
	);

	let rail: RailWidget[];
	let overview: OverviewItem[][];

	if (Array.isArray(config.rail) && Array.isArray(config.overview)) {
		rail = config.rail;
		overview = config.overview.map((column: unknown) => (Array.isArray(column) ? column : []));
	} else {
		// v1 migration: distribute the old flat entity fields into default
		// rail widgets and overview cards
		rail = defaults.rail;
		overview = defaults.overview;
		for (const widget of rail) {
			if (widget.type === 'clock' && config.city) widget.city = config.city;
			if (widget.type === 'weather' && config.weather_entity) widget.entity = config.weather_entity;
		}
		for (const card of overview.flat()) {
			if (isStack(card)) continue;
			if (card.type === 'temperature' && config.average_temperature_entity) {
				card.entity = config.average_temperature_entity;
			}
			if (card.type === 'entities' && card.id === 'lights') {
				card.entities = registryEntityRefs(registries.lights);
			}
			if (card.type === 'entities' && card.id === 'blinds') {
				card.entities = registryEntityRefs(registries.blinds);
			}
			if (card.type === 'entities' && card.id === 'air') {
				const refs: EntityRef[] = [
					...(config.pm25_entity
						? [{ entity: config.pm25_entity, name: 'Home PM2.5', display: 'stat' as const }]
						: []),
					...(config.humidity_entity
						? [{ entity: config.humidity_entity, name: 'Humidity', display: 'stat' as const }]
						: []),
					...(Array.isArray(config.filters) ? config.filters : [])
						.filter((filter: any) => typeof filter?.entity === 'string')
						.map((filter: any) => ({ entity: filter.entity, name: filter.label, icon: 'mode_fan' }))
				];
				if (refs.length) card.entities = refs;
			}
			if (card.type === 'media' && config.media_entity) card.entity = config.media_entity;
			if (card.type === 'vacuum' && config.vacuum_entity) card.entity = config.vacuum_entity;
		}
	}

	return {
		theme: config.theme && typeof config.theme === 'object' ? config.theme : undefined,
		rail: rail.map((widget, index) => ({
			...widget,
			id: widget.id ?? `widget-${index}`,
			...(widget.type === 'calendar'
				? {
						entities: (Array.isArray(widget.entities) ? widget.entities : []).filter(
							(entry: unknown): entry is string => typeof entry === 'string'
						)
					}
				: {}),
			...(widget.type === 'progress'
				? {
						active_states: Array.isArray(widget.active_states)
							? widget.active_states.filter(
									(entry: unknown): entry is string => typeof entry === 'string'
								)
							: undefined,
						completed_states: Array.isArray(widget.completed_states)
							? widget.completed_states.filter(
									(entry: unknown): entry is string => typeof entry === 'string'
								)
							: undefined,
						completion_delay_minutes:
							typeof widget.completion_delay_minutes === 'number' &&
							Number.isFinite(widget.completion_delay_minutes) &&
							widget.completion_delay_minutes >= -1
								? widget.completion_delay_minutes
								: undefined
					}
					}
				: {}),
			hide_mobile: widget.hide_mobile === true ? true : undefined,
			visibility: normalizeVisibility(widget.visibility)
		})),
		overview: overview.map((column, columnIndex) =>
			column.map((card, index) =>
				normalizeOverviewItem(card, `card-${columnIndex}-${index}`, registries)
			)
		),
		lights: Array.isArray(config.lights) ? config.lights : [],
		blinds: Array.isArray(config.blinds) ? config.blinds : [],
		rooms,
		screensaver_minutes:
			typeof config.screensaver_minutes === 'number' ? config.screensaver_minutes : undefined,
		keep_screen_on: typeof config.keep_screen_on === 'boolean' ? config.keep_screen_on : undefined,
		padding_x: typeof config.padding_x === 'number' ? config.padding_x : undefined,
		padding_y: typeof config.padding_y === 'number' ? config.padding_y : undefined
	};
}

const DOMAIN_ICONS: Record<string, string> = {
	light: 'lightbulb',
	switch: 'toggle_on',
	input_boolean: 'toggle_on',
	sensor: 'monitoring',
	binary_sensor: 'radio_button_checked',
	media_player: 'play_circle',
	climate: 'thermostat',
	cover: 'blinds',
	fan: 'mode_fan',
	lock: 'lock',
	camera: 'videocam',
	vacuum: 'robot_2',
	scene: 'palette',
	script: 'description',
	automation: 'smart_toy',
	alarm_control_panel: 'shield',
	person: 'person',
	device_tracker: 'near_me',
	weather: 'partly_cloudy_day',
	timer: 'timer',
	calendar: 'calendar_month',
	humidifier: 'humidity_mid',
	water_heater: 'water_heater',
	valve: 'valve',
	button: 'radio_button_checked',
	input_button: 'radio_button_checked',
	update: 'system_update_alt',
	todo: 'checklist',
	counter: 'pin',
	group: 'category',
	remote: 'settings_remote',
	siren: 'notifications_active',
	lawn_mower: 'grass'
};

/** Material Symbols fallback icon for an entity's domain. */
export function domainIcon(entityId?: string): string {
	const domain = entityId?.split('.')[0] ?? '';
	return DOMAIN_ICONS[domain] ?? 'category';
}

export function slugify(name: string) {
	return (
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '') || 'item'
	);
}

/** Uppercases the first letter, e.g. for lowercase translation values. */
export function capitalize(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function uniqueId(base: string, taken: string[]) {
	let id = base;
	let counter = 2;
	while (taken.includes(id)) id = `${base}-${counter++}`;
	return id;
}

function overviewItemIds(item: OverviewItem): string[] {
	return isStack(item) ? [item.id, ...item.cards.flatMap(overviewItemIds)] : [item.id];
}

/** Every overview + room card id in the config, for generating a fresh unique one. */
export function takenCardIds(config: HearthConfig): string[] {
	return [
		...config.overview.flat().flatMap(overviewItemIds),
		...config.rooms.flatMap((room) => room.cards ?? []).map((card) => card.id)
	];
}

export function overviewItemTypeKey(item: OverviewItem): string {
	return isStack(item) ? 'stack' : item.type;
}

/**
 * Deep clone with a fresh id for the item and, if it's a stack, every child -
 * so an Alt-drag duplicate never collides with an existing id anywhere in the
 * config. Mutates `taken` as it goes so nested clones stay unique against
 * each other too.
 */
export function cloneOverviewItem<T extends OverviewItem>(item: T, taken: string[]): T {
	const cloned = structuredClone(item);
	const assignIds = (node: OverviewItem) => {
		node.id = uniqueId(slugify(overviewItemTypeKey(node)), taken);
		taken.push(node.id);
		if (isStack(node)) node.cards.forEach(assignIds);
	};
	assignIds(cloned);
	return cloned;
}

export function moveItem<T>(list: T[], index: number, delta: number) {
	const target = index + delta;
	if (index < 0 || target < 0 || target >= list.length) return;
	const [item] = list.splice(index, 1);
	list.splice(target, 0, item);
}

export const PRESS_RIPPLE = { color: 'rgb(var(--h-surface-rgb) / 0.12)' };

/**
 * Theme knobs exposed in hearth.yaml's `theme:` block, mapped to the CSS
 * custom properties whose defaults live on `.frame` in HearthDashboard.
 * `rgb` knobs accept a hex color and are stored as an R G B triplet so
 * alpha tints can be derived from a single hue.
 */
export const THEME_VARS: Record<string, { cssVar: string; rgb?: boolean }> = {
	background_inner: { cssVar: '--h-bg-0' },
	background_outer: { cssVar: '--h-bg-1' },
	// CSS image value ('none' or 'url(...)') layered over the background gradient
	background_image: { cssVar: '--h-bg-image' },
	sheet_top: { cssVar: '--h-sheet-0' },
	sheet_bottom: { cssVar: '--h-sheet-1' },
	overlay: { cssVar: '--h-overlay' },
	surface: { cssVar: '--h-surface-rgb', rgb: true },
	inset: { cssVar: '--h-inset' },
	track: { cssVar: '--h-track' },
	accent: { cssVar: '--h-accent-rgb', rgb: true },
	accent_deep: { cssVar: '--h-accent-deep' },
	accent_bright: { cssVar: '--h-accent-bright' },
	accent_text: { cssVar: '--h-accent-text' },
	accent_dim_text: { cssVar: '--h-accent-dim-text' },
	on_accent: { cssVar: '--h-on-accent' },
	label: { cssVar: '--h-label' },
	cool: { cssVar: '--h-cool-rgb', rgb: true },
	cool_light: { cssVar: '--h-cool-light' },
	cool_icon: { cssVar: '--h-cool-icon' },
	cool_text: { cssVar: '--h-cool-text' },
	on_cool: { cssVar: '--h-on-cool' },
	good: { cssVar: '--h-good' },
	good_text: { cssVar: '--h-good-text' },
	bad: { cssVar: '--h-bad-rgb', rgb: true },
	bad_text: { cssVar: '--h-bad-text' },
	media: { cssVar: '--h-media' },
	media_art_top: { cssVar: '--h-media-art-1' },
	media_art_bottom: { cssVar: '--h-media-art-2' },
	text_1: { cssVar: '--h-text-1' },
	text_2: { cssVar: '--h-text-2' },
	text_3: { cssVar: '--h-text-3' },
	text_4: { cssVar: '--h-text-4' },
	text_5: { cssVar: '--h-text-5' },
	text_6: { cssVar: '--h-text-6' },
	icon: { cssVar: '--h-icon' },
	icon_dim: { cssVar: '--h-icon-dim' },
	font_ui: { cssVar: '--h-font-ui' },
	font_mono: { cssVar: '--h-font-mono' },
	radius_xl: { cssVar: '--h-radius-xl' },
	radius_lg: { cssVar: '--h-radius-lg' },
	radius_card: { cssVar: '--h-radius-card' },
	radius_md: { cssVar: '--h-radius-md' },
	radius_sm: { cssVar: '--h-radius-sm' },
	radius_xs: { cssVar: '--h-radius-xs' }
};

/**
 * Default value for every theme knob - the Calm Hearth look. Serves both as
 * the base `:root` stylesheet (via themeStyle) and as picker defaults when a
 * knob is not set in the user theme.
 */
export const THEME_DEFAULTS: Record<string, string> = {
	background_inner: '#2a2017',
	background_outer: '#16110c',
	background_image: 'none',
	sheet_top: '#2c2118',
	sheet_bottom: '#1d160f',
	overlay: 'rgba(10, 7, 4, 0.62)',
	inset: 'rgba(0, 0, 0, 0.18)',
	track: 'rgba(0, 0, 0, 0.3)',
	font_ui: "'Hanken Grotesk', sans-serif",
	font_mono: "'Geist Mono', monospace",
	radius_xl: '28px',
	radius_lg: '22px',
	radius_card: '20px',
	radius_md: '18px',
	radius_sm: '14px',
	radius_xs: '12px',
	surface: '#ffeedc',
	accent: '#f0b860',
	accent_deep: '#e8a04a',
	accent_bright: '#f4c879',
	accent_text: '#f3d9a8',
	accent_dim_text: '#d3b889',
	on_accent: '#1a0f05',
	label: '#a08c6e',
	cool: '#5f9cc0',
	cool_light: '#9fc7d8',
	cool_icon: '#7fb6d9',
	cool_text: '#90a9b4',
	on_cool: '#0c1a22',
	good: '#7fd99a',
	good_text: '#9bc7a8',
	bad: '#e0786e',
	bad_text: '#f0b0a8',
	media: '#1ed760',
	media_art_top: '#5a2230',
	media_art_bottom: '#4a1d28',
	text_1: '#f7efe4',
	text_2: '#f1e6d6',
	text_3: '#cdbfae',
	text_4: '#a99a89',
	text_5: '#8c8073',
	text_6: '#7d7265',
	icon: '#9a8d7d',
	icon_dim: '#7a7064'
};

export function mixHex(a: string, b: string, t: number): string {
	const channel = (offset: number) => {
		const from = parseInt(a.slice(offset, offset + 2), 16);
		const to = parseInt(b.slice(offset, offset + 2), 16);
		return Math.round(from * (1 - t) + to * t)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${channel(1)}${channel(3)}${channel(5)}`;
}

/* single-color pickers fan out into their derived sibling knobs */

export function deriveAccent(hex: string): HearthTheme {
	return {
		accent: hex,
		accent_deep: mixHex(hex, '#000000', 0.12),
		accent_bright: mixHex(hex, '#ffffff', 0.22),
		accent_text: mixHex(hex, '#ffffff', 0.45),
		accent_dim_text: mixHex(hex, '#ffffff', 0.18),
		on_accent: mixHex(hex, '#000000', 0.88)
	};
}

export function deriveCool(hex: string): HearthTheme {
	return {
		cool: hex,
		cool_light: mixHex(hex, '#ffffff', 0.35),
		cool_icon: mixHex(hex, '#ffffff', 0.2),
		cool_text: mixHex(hex, '#aab4ba', 0.4),
		on_cool: mixHex(hex, '#000000', 0.85)
	};
}

export function deriveBad(hex: string): HearthTheme {
	return { bad: hex, bad_text: mixHex(hex, '#ffffff', 0.35) };
}

export function deriveBackground(inner: string, outer: string): HearthTheme {
	return {
		background_inner: inner,
		background_outer: outer,
		sheet_top: mixHex(inner, '#ffffff', 0.03),
		sheet_bottom: mixHex(outer, '#ffffff', 0.03)
	};
}

export function deriveText(ink: string, background: string): HearthTheme {
	return {
		text_1: ink,
		text_2: mixHex(ink, background, 0.07),
		text_3: mixHex(ink, background, 0.19),
		text_4: mixHex(ink, background, 0.35),
		text_5: mixHex(ink, background, 0.48),
		text_6: mixHex(ink, background, 0.54),
		label: mixHex(ink, background, 0.42),
		icon: mixHex(ink, background, 0.41),
		icon_dim: mixHex(ink, background, 0.55),
		surface: mixHex(ink, '#ffffff', 0.35)
	};
}

export const RADIUS_SCALES: { value: string; label: string; factor: number }[] = [
	{ value: 'sharp', label: 'Sharp', factor: 0.45 },
	{ value: 'soft', label: 'Soft (default)', factor: 1 },
	{ value: 'round', label: 'Round', factor: 1.5 }
];

const RADIUS_BASE: Record<string, number> = {
	radius_xl: 28,
	radius_lg: 22,
	radius_card: 20,
	radius_md: 18,
	radius_sm: 14,
	radius_xs: 12
};

export function deriveRadii(factor: number): HearthTheme {
	return Object.fromEntries(
		Object.entries(RADIUS_BASE).map(([key, base]) => [key, `${Math.round(base * factor)}px`])
	);
}

interface ThemeSeed {
	accent: string;
	cool?: string;
	backgroundInner: string;
	backgroundOuter: string;
	ink: string;
}

export function buildTheme(seed: ThemeSeed): HearthTheme {
	const mediaArtTop = mixHex(seed.accent, seed.backgroundOuter, 0.72);
	return {
		...deriveBackground(seed.backgroundInner, seed.backgroundOuter),
		...deriveText(seed.ink, seed.backgroundOuter),
		...deriveAccent(seed.accent),
		...(seed.cool ? deriveCool(seed.cool) : {}),
		// fallback album-art stripes when nothing is playing
		media_art_top: mediaArtTop,
		media_art_bottom: mixHex(mediaArtTop, '#000000', 0.15)
	};
}

export const THEME_PRESETS: { id: string; name: string; theme: HearthTheme | null }[] = [
	{ id: 'hearth', name: 'Calm Hearth', theme: null },
	{
		id: 'slate',
		name: 'Slate',
		theme: buildTheme({
			accent: '#6fc3c9',
			cool: '#7f9cc9',
			backgroundInner: '#1c2430',
			backgroundOuter: '#0d1218',
			ink: '#eef5f9'
		})
	},
	{
		id: 'forest',
		name: 'Forest',
		theme: buildTheme({
			accent: '#a8c98a',
			cool: '#7fb6d9',
			backgroundInner: '#1d2418',
			backgroundOuter: '#0f140b',
			ink: '#f0f5e8'
		})
	},
	{
		id: 'plum',
		name: 'Plum',
		theme: buildTheme({
			accent: '#d9a3c9',
			cool: '#9fa3e0',
			backgroundInner: '#251b28',
			backgroundOuter: '#130e16',
			ink: '#f5eef7'
		})
	},
	{
		// approximates the original ha-fusion "muted" theme: cool grey-blue
		// background, white active buttons, Inter, small radii (no background
		// photo - set the background_image knob for one)
		id: 'muted',
		name: 'Muted (fusion)',
		theme: {
			...buildTheme({
				accent: '#e6e8e9',
				cool: '#8fa3ad',
				backgroundInner: '#20262a',
				backgroundOuter: '#14181b',
				ink: '#e3e5e6'
			}),
			...deriveRadii(0.36),
			font_ui: "'Inter Variable', system-ui"
		}
	}
];

function hexToTriplet(value: string) {
	const hex = value.trim();
	if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return value;
	return `${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)}`;
}

export function themeStyle(theme?: HearthTheme): string {
	if (!theme) return '';
	return Object.entries(theme)
		.filter(([key]) => key in THEME_VARS)
		.map(([key, value]) => {
			const { cssVar, rgb } = THEME_VARS[key];
			// the result lands in a raw <style> tag, so strip anything that could
			// close the tag or the :root block (no legal CSS value needs these)
			const safe = String(value).replace(/[<>{}]/g, '');
			const resolved = rgb ? hexToTriplet(safe) : /^\d+$/.test(safe) ? `${safe}px` : safe;
			return `${cssVar}: ${resolved};`;
		})
		.join(' ');
}

/**
 * Maps the original fusion `--theme-*` custom properties onto hearth tokens so
 * reused components (domain modals, sidebar widgets, main objects) pick up the
 * hearth look without their own theme file.
 */
export const THEME_BRIDGE_CSS = `
	--theme-font-family: var(--h-font-ui);
	--theme-background-image: var(--h-bg-image), radial-gradient(1000px 700px at 14% -5%, var(--h-bg-0), var(--h-bg-1) 62%);
	--theme-colors-text: var(--h-text-2);
	--theme-colors-title: var(--h-text-1);
	--theme-colors-icon: var(--h-icon);
	--theme-colors-sidebar-background: transparent;
	--theme-colors-sidebar-border: none;
	--theme-sizes-sidebar-time: 3.4rem;
	--theme-button-background-color-on: rgb(var(--h-accent-rgb));
	--theme-button-background-color-off: rgb(var(--h-surface-rgb) / 0.08);
	--theme-button-name-color-on: var(--h-on-accent);
	--theme-button-name-color-off: var(--h-text-2);
	--theme-button-state-color-on: var(--h-on-accent);
	--theme-button-state-color-off: var(--h-text-5);
	--theme-display-only-background-color: rgb(var(--h-surface-rgb) / 0.04);
	--theme-display-only-name-color: var(--h-text-2);
	--theme-display-only-state-color: var(--h-text-4);
	--theme-modal-background-color-modal: var(--h-sheet-0);
	--theme-navigate-background-color: rgb(var(--h-surface-rgb) / 0.08);
	--theme-sidebar-font-size: 1rem;
	--theme-sidebar-item-padding: 0.6rem 0;
	--theme-sidebar-padding: 0;
	--theme-sidebar-divider: 1px solid rgb(var(--h-surface-rgb) / 0.12);
	--theme-border-radius: var(--h-radius-xs);
`;

export const SWATCH_COLORS = ['#f4c879', '#f0925f', '#e0788a', '#b39ddb', '#9fc7d8', '#a6cdb2'];
