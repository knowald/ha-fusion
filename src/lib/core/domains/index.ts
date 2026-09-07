import type { HassEntity } from 'home-assistant-js-websocket';

const OPENING_STATES = ['open', 'opening', 'closing'];
const MEDIA_OFF_STATES = ['off', 'unavailable', 'unknown', 'standby', 'idle'];
const OPEN_CLOSED_CLASSES = ['door', 'window', 'garage_door', 'opening'];

function domainOf(entityId: string | undefined) {
	return entityId?.split('.')?.[0];
}

/**
 * What the dashboard knows about a Home Assistant domain beyond its entity
 * state. Every domain the dashboard treats specially has an entry; anything
 * else gets the generic fallback.
 */
export interface DomainDescriptor {
	domain: string;
	/** Material Symbols name for entities of this domain without their own icon. */
	icon: string;
	/**
	 * How a tap on a tile should behave: `toggle` sends the domain's flip
	 * service, `controls` opens a detail surface, `readout` means the detail
	 * surface would only echo the state, so a numeric reading opens its history
	 * and anything else does nothing.
	 */
	tap: 'toggle' | 'controls' | 'readout';
	/** Tile treatment beyond the generic on/off tile. */
	tile?: 'light' | 'cover';
	/** Whether the entity reads as active; the default is `state === 'on'`. */
	active?: (entity: HassEntity) => boolean;
	/** Active and inactive wording for group summaries; the default is on/off. */
	summaryWords?: (entity: HassEntity | undefined) => [string, string];
	/** Entities of this domain count towards a group's active/inactive tally. */
	countable?: boolean;
	/** The `domain.service` that flips the entity, given its current state. */
	toggleService?: (entity: HassEntity) => string;
}

const openClosed = (): [string, string] => ['open', 'closed'];
const toggle = (domain: string) => () => `${domain}.toggle`;

const GENERIC: DomainDescriptor = { domain: '', icon: 'category', tap: 'controls' };

const DESCRIPTORS: DomainDescriptor[] = [
	{
		domain: 'light',
		icon: 'lightbulb',
		tap: 'toggle',
		tile: 'light',
		countable: true,
		toggleService: toggle('light')
	},
	{
		domain: 'switch',
		icon: 'toggle_on',
		tap: 'toggle',
		countable: true,
		toggleService: toggle('switch')
	},
	{
		domain: 'input_boolean',
		icon: 'toggle_on',
		tap: 'toggle',
		countable: true,
		toggleService: toggle('input_boolean')
	},
	{ domain: 'sensor', icon: 'monitoring', tap: 'readout' },
	{
		domain: 'binary_sensor',
		icon: 'radio_button_checked',
		tap: 'readout',
		countable: true,
		summaryWords: (entity) => {
			const deviceClass: string | undefined = entity?.attributes?.device_class;
			if (deviceClass && OPEN_CLOSED_CLASSES.includes(deviceClass)) return ['open', 'closed'];
			if (deviceClass === 'motion' || deviceClass === 'occupancy') return ['detected', 'clear'];
			return ['on', 'off'];
		}
	},
	{
		domain: 'media_player',
		icon: 'play_circle',
		tap: 'toggle',
		countable: true,
		active: (entity) => !MEDIA_OFF_STATES.includes(entity.state),
		toggleService: toggle('media_player')
	},
	{ domain: 'climate', icon: 'thermostat', tap: 'controls' },
	{
		domain: 'cover',
		icon: 'blinds',
		tap: 'toggle',
		tile: 'cover',
		countable: true,
		active: (entity) => OPENING_STATES.includes(entity.state),
		summaryWords: openClosed,
		toggleService: toggle('cover')
	},
	{ domain: 'fan', icon: 'mode_fan', tap: 'toggle', countable: true, toggleService: toggle('fan') },
	{
		domain: 'lock',
		icon: 'lock',
		tap: 'toggle',
		countable: true,
		active: (entity) => entity.state === 'unlocked',
		summaryWords: () => ['unlocked', 'locked'],
		toggleService: (entity) => (entity.state === 'locked' ? 'lock.unlock' : 'lock.lock')
	},
	{ domain: 'camera', icon: 'videocam', tap: 'controls' },
	{ domain: 'image', icon: 'image', tap: 'controls' },
	{
		domain: 'vacuum',
		icon: 'robot_2',
		tap: 'toggle',
		active: (entity) => entity.state === 'cleaning' || entity.state === 'returning',
		toggleService: (entity) => (entity.state === 'cleaning' ? 'vacuum.pause' : 'vacuum.start')
	},
	{ domain: 'scene', icon: 'palette', tap: 'toggle', toggleService: () => 'scene.turn_on' },
	{ domain: 'script', icon: 'description', tap: 'toggle', toggleService: toggle('script') },
	{ domain: 'automation', icon: 'smart_toy', tap: 'toggle', toggleService: toggle('automation') },
	{ domain: 'alarm_control_panel', icon: 'shield', tap: 'controls' },
	{ domain: 'person', icon: 'person', tap: 'readout' },
	{ domain: 'device_tracker', icon: 'near_me', tap: 'controls' },
	{ domain: 'weather', icon: 'partly_cloudy_day', tap: 'readout' },
	{
		domain: 'timer',
		icon: 'timer',
		tap: 'toggle',
		toggleService: (entity) => (entity.state === 'active' ? 'timer.cancel' : 'timer.start')
	},
	{ domain: 'calendar', icon: 'calendar_month', tap: 'controls' },
	{
		domain: 'humidifier',
		icon: 'humidity_mid',
		tap: 'toggle',
		countable: true,
		toggleService: toggle('humidifier')
	},
	{ domain: 'water_heater', icon: 'water_heater', tap: 'controls' },
	{
		domain: 'valve',
		icon: 'valve',
		tap: 'controls',
		countable: true,
		active: (entity) => OPENING_STATES.includes(entity.state),
		summaryWords: openClosed
	},
	{
		domain: 'button',
		icon: 'radio_button_checked',
		tap: 'toggle',
		toggleService: () => 'button.press'
	},
	{
		domain: 'input_button',
		icon: 'radio_button_checked',
		tap: 'toggle',
		toggleService: () => 'input_button.press'
	},
	{ domain: 'update', icon: 'system_update_alt', tap: 'controls' },
	{ domain: 'todo', icon: 'checklist', tap: 'controls' },
	{ domain: 'counter', icon: 'pin', tap: 'controls' },
	// group members span domains, so only homeassistant.toggle covers them
	{ domain: 'group', icon: 'category', tap: 'toggle', toggleService: () => 'homeassistant.toggle' },
	{
		domain: 'remote',
		icon: 'settings_remote',
		tap: 'toggle',
		toggleService: () => 'homeassistant.toggle'
	},
	{ domain: 'siren', icon: 'notifications_active', tap: 'toggle', toggleService: toggle('siren') },
	{ domain: 'lawn_mower', icon: 'grass', tap: 'controls' },
	// domains whose detail view only echoes the state
	{ domain: 'air_quality', icon: 'air', tap: 'readout' },
	{ domain: 'date', icon: 'calendar_today', tap: 'readout' },
	{ domain: 'time', icon: 'schedule', tap: 'readout' },
	{ domain: 'event', icon: 'bolt', tap: 'readout' },
	{ domain: 'image_processing', icon: 'image_search', tap: 'readout' },
	{ domain: 'mailbox', icon: 'mail', tap: 'readout' },
	{ domain: 'stt', icon: 'mic', tap: 'readout' },
	{ domain: 'schedule', icon: 'event_repeat', tap: 'readout' },
	{ domain: 'sun', icon: 'wb_sunny', tap: 'readout' },
	{ domain: 'zone', icon: 'location_on', tap: 'readout' }
];

const BY_DOMAIN = new Map(DESCRIPTORS.map((descriptor) => [descriptor.domain, descriptor]));

export function domainDescriptor(domain: string | undefined): DomainDescriptor {
	return (domain ? BY_DOMAIN.get(domain) : undefined) ?? GENERIC;
}

/** Material Symbols fallback icon for an entity's domain. */
export function domainIcon(entityId?: string): string {
	return domainDescriptor(domainOf(entityId)).icon;
}

/**
 * Whether the detail surface for this entity would only echo the state the
 * tile already shows. A GPS device tracker has a map, so it is the exception.
 */
export function entityIsReadout(entityId: string, entity: HassEntity | undefined): boolean {
	const domain = domainOf(entityId);
	if (domain === 'device_tracker') return entity?.attributes?.source_type !== 'gps';
	return domainDescriptor(domain).tap === 'readout';
}
