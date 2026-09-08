import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

/*
 * A scripted stand-in for the Home Assistant websocket API, enough to boot the
 * dashboard, draw every surface and observe the service calls it sends. State
 * lives in memory and every connected client receives the same entity stream.
 * Recorder statistics, state history, calendar events, template renders and
 * weather forecasts are synthesized so data-driven widgets have something to
 * draw. Test endpoints: GET /_test/calls lists received service calls,
 * POST /_test/reset restores the initial states and clears the call log,
 * POST /_test/state with { entity_id, state, attributes } patches one entity.
 */

const PORT = Number(process.env.FAKE_HASS_PORT ?? 8124);
const HA_VERSION = '2026.1.0';

function initialStates() {
	return {
		'light.desk': {
			s: 'off',
			a: {
				friendly_name: 'Desk lamp',
				supported_color_modes: ['brightness'],
				color_mode: null,
				brightness: null
			}
		},
		'light.shelf': {
			s: 'on',
			a: {
				friendly_name: 'Shelf lamp',
				supported_color_modes: ['brightness'],
				color_mode: 'brightness',
				brightness: 128
			}
		},
		'light.strip': {
			s: 'on',
			a: {
				friendly_name: 'LED strip',
				supported_color_modes: ['color_temp', 'hs'],
				color_mode: 'hs',
				brightness: 200,
				hs_color: [28, 80],
				rgb_color: [255, 160, 51],
				min_color_temp_kelvin: 2000,
				max_color_temp_kelvin: 6500,
				color_temp_kelvin: 2700
			}
		},
		'switch.fan': { s: 'on', a: { friendly_name: 'Ceiling fan' } },
		'switch.heater': { s: 'off', a: { friendly_name: 'Space heater' } },
		'fan.bedroom': {
			s: 'on',
			a: {
				friendly_name: 'Bedroom fan',
				percentage: 50,
				percentage_step: 25,
				supported_features: 1
			}
		},
		'cover.blind': {
			s: 'open',
			a: {
				friendly_name: 'Window blind',
				current_position: 40,
				supported_features: 15,
				device_class: 'blind'
			}
		},
		'cover.garage': {
			s: 'closed',
			a: { friendly_name: 'Garage door', supported_features: 3, device_class: 'garage' }
		},
		'sensor.temperature': {
			s: '21.5',
			a: { friendly_name: 'Temperature', unit_of_measurement: '°C', device_class: 'temperature' }
		},
		'sensor.humidity': {
			s: '47',
			a: { friendly_name: 'Humidity', unit_of_measurement: '%', device_class: 'humidity' }
		},
		'sensor.power': {
			s: '312',
			a: { friendly_name: 'Power', unit_of_measurement: 'W', device_class: 'power' }
		},
		'sensor.energy': {
			s: '1284.6',
			a: {
				friendly_name: 'Energy',
				unit_of_measurement: 'kWh',
				device_class: 'energy',
				state_class: 'total_increasing'
			}
		},
		'sensor.price': {
			s: '0.42',
			a: { friendly_name: 'Energy price', unit_of_measurement: 'EUR/kWh' }
		},
		'sensor.printer_status': { s: 'printing', a: { friendly_name: 'Printer status' } },
		'sensor.printer_progress': {
			s: '42',
			a: { friendly_name: 'Printer progress', unit_of_measurement: '%' }
		},
		'sensor.printer_remaining': {
			s: '38',
			a: { friendly_name: 'Printer remaining', unit_of_measurement: 'min' }
		},
		'sensor.broken': {
			s: 'unavailable',
			a: { friendly_name: 'Broken sensor', unit_of_measurement: '°C' }
		},
		'binary_sensor.door': {
			s: 'off',
			a: { friendly_name: 'Front door', device_class: 'door' }
		},
		'binary_sensor.motion': {
			s: 'on',
			a: { friendly_name: 'Hall motion', device_class: 'motion' }
		},
		'media_player.living': {
			s: 'playing',
			a: {
				friendly_name: 'Living room speaker',
				media_title: 'Blue in Green',
				media_artist: 'Miles Davis',
				media_album_name: 'Kind of Blue',
				volume_level: 0.35,
				is_volume_muted: false,
				media_duration: 337,
				media_position: 120,
				media_position_updated_at: new Date().toISOString(),
				supported_features: 152511,
				source: 'Spotify'
			}
		},
		'media_player.kitchen': {
			s: 'paused',
			a: {
				friendly_name: 'Kitchen speaker',
				media_title: 'Morning news',
				volume_level: 0.2,
				supported_features: 152511
			}
		},
		'climate.living': {
			s: 'heat',
			a: {
				friendly_name: 'Living room thermostat',
				temperature: 21,
				current_temperature: 19.5,
				hvac_modes: ['off', 'heat', 'cool', 'auto'],
				hvac_action: 'heating',
				min_temp: 7,
				max_temp: 30,
				target_temp_step: 0.5,
				preset_modes: ['home', 'away', 'sleep'],
				preset_mode: 'home',
				supported_features: 17
			}
		},
		'lock.front': {
			s: 'locked',
			a: { friendly_name: 'Front door lock', supported_features: 1 }
		},
		'vacuum.robot': {
			s: 'docked',
			a: {
				friendly_name: 'Robot vacuum',
				battery_level: 82,
				fan_speed: 'balanced',
				fan_speed_list: ['quiet', 'balanced', 'turbo'],
				supported_features: 14204
			}
		},
		'scene.evening': { s: '2026-09-05T18:00:00+00:00', a: { friendly_name: 'Evening' } },
		'scene.movie': { s: 'unknown', a: { friendly_name: 'Movie night' } },
		'scene.bright': { s: 'unknown', a: { friendly_name: 'Bright' } },
		'script.goodnight': { s: 'off', a: { friendly_name: 'Good night', last_triggered: null } },
		'automation.morning': {
			s: 'on',
			a: { friendly_name: 'Morning routine', last_triggered: '2026-09-06T06:30:00+00:00' }
		},
		'input_boolean.guest': { s: 'off', a: { friendly_name: 'Guest mode' } },
		'input_number.volume': {
			s: '4',
			a: { friendly_name: 'Alarm volume', min: 0, max: 10, step: 1, mode: 'slider' }
		},
		'input_select.mode': {
			s: 'Home',
			a: { friendly_name: 'House mode', options: ['Home', 'Away', 'Sleep', 'Party'] }
		},
		'input_text.note': { s: 'Buy milk', a: { friendly_name: 'Fridge note', max: 100 } },
		'input_datetime.filter_changed': {
			s: '2026-08-01',
			a: { friendly_name: 'Filter changed', has_date: true, has_time: false }
		},
		'input_button.ping': { s: '2026-09-01T10:00:00+00:00', a: { friendly_name: 'Ping' } },
		'button.restart': { s: 'unknown', a: { friendly_name: 'Restart router' } },
		'alarm_control_panel.home': {
			s: 'disarmed',
			a: {
				friendly_name: 'Alarm',
				supported_features: 7,
				code_format: 'number',
				code_arm_required: false
			}
		},
		'timer.laundry': {
			s: 'active',
			a: {
				friendly_name: 'Laundry',
				duration: '0:45:00',
				remaining: '0:20:00',
				finishes_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
			}
		},
		'counter.visits': { s: '12', a: { friendly_name: 'Visits', step: 1, minimum: 0 } },
		'update.core': {
			s: 'on',
			a: {
				friendly_name: 'Home Assistant Core',
				installed_version: '2025.12.1',
				latest_version: '2026.1.0',
				release_url: 'https://example.invalid',
				supported_features: 1
			}
		},
		'humidifier.bedroom': {
			s: 'on',
			a: {
				friendly_name: 'Bedroom humidifier',
				humidity: 50,
				current_humidity: 44,
				min_humidity: 30,
				max_humidity: 70,
				available_modes: ['normal', 'eco'],
				mode: 'normal'
			}
		},
		'water_heater.tank': {
			s: 'eco',
			a: {
				friendly_name: 'Water heater',
				temperature: 55,
				current_temperature: 52,
				min_temp: 40,
				max_temp: 70,
				operation_list: ['eco', 'performance', 'off'],
				operation_mode: 'eco'
			}
		},
		'valve.main': { s: 'open', a: { friendly_name: 'Main valve', supported_features: 3 } },
		'lawn_mower.robo': { s: 'docked', a: { friendly_name: 'Lawn mower', supported_features: 7 } },
		'camera.front': {
			s: 'idle',
			a: { friendly_name: 'Front camera', supported_features: 0 }
		},
		'image.floorplan': { s: '2026-09-01T00:00:00+00:00', a: { friendly_name: 'Floor plan' } },
		'person.kevin': { s: 'home', a: { friendly_name: 'Kevin' } },
		'device_tracker.phone': {
			s: 'home',
			a: { friendly_name: 'Phone', source_type: 'gps', latitude: 51.1, longitude: 17.0 }
		},
		'weather.home': {
			s: 'partlycloudy',
			a: {
				friendly_name: 'Home',
				temperature: 22,
				apparent_temperature: 23,
				humidity: 40,
				wind_speed: 12,
				temperature_unit: '°C',
				supported_features: 1
			}
		},
		'calendar.family': { s: 'off', a: { friendly_name: 'Family' } },
		'sun.sun': { s: 'above_horizon', a: { friendly_name: 'Sun' } }
	};
}

let states = initialStates();
let calls = [];
const entitySubscribers = new Map();

function now() {
	return Math.floor(Date.now() / 1000);
}

function snapshot() {
	const added = {};
	for (const [entityId, entity] of Object.entries(states)) {
		added[entityId] = { s: entity.s, a: entity.a, c: 'ctx', lc: now() };
	}
	return { a: added };
}

function pushChange(entityId) {
	const entity = states[entityId];
	const change = { c: { [entityId]: { '+': { s: entity.s, a: entity.a, lc: now() } } } };
	for (const [socket, id] of entitySubscribers) {
		if (socket.readyState === socket.OPEN) {
			socket.send(JSON.stringify({ id, type: 'event', event: change }));
		}
	}
}

function applyService(domain, service, data) {
	const ids = [].concat(data?.entity_id ?? []);
	for (const entityId of ids) {
		const entity = states[entityId];
		if (!entity) continue;
		const a = entity.a;
		const on = () => {
			entity.s = 'on';
			if (domain === 'light') {
				a.color_mode = a.color_mode ?? 'brightness';
				if (typeof data.brightness_pct === 'number') {
					a.brightness = Math.round((data.brightness_pct / 100) * 255);
				} else if (typeof data.brightness === 'number') {
					a.brightness = data.brightness;
				} else if (!a.brightness) {
					a.brightness = 255;
				}
				if (typeof data.color_temp_kelvin === 'number') {
					a.color_mode = 'color_temp';
					a.color_temp_kelvin = data.color_temp_kelvin;
				}
				if (Array.isArray(data.hs_color)) {
					a.color_mode = 'hs';
					a.hs_color = data.hs_color;
				}
			}
			if (domain === 'fan' && typeof data.percentage === 'number') a.percentage = data.percentage;
		};
		const off = () => {
			entity.s = 'off';
			if (domain === 'light') {
				a.color_mode = null;
				a.brightness = null;
			}
		};
		switch (`${domain}.${service}`) {
			case 'homeassistant.toggle':
				(entity.s === 'on' ? off : on)();
				break;
			case 'cover.open_cover':
				entity.s = 'open';
				a.current_position = 100;
				break;
			case 'cover.close_cover':
				entity.s = 'closed';
				a.current_position = 0;
				break;
			case 'cover.set_cover_position':
				a.current_position = data.position;
				entity.s = data.position > 0 ? 'open' : 'closed';
				break;
			case 'cover.stop_cover':
				break;
			case 'fan.set_percentage':
				a.percentage = data.percentage;
				entity.s = data.percentage > 0 ? 'on' : 'off';
				break;
			case 'media_player.media_play':
			case 'media_player.media_play_pause':
				entity.s = entity.s === 'playing' && service === 'media_play_pause' ? 'paused' : 'playing';
				break;
			case 'media_player.media_pause':
				entity.s = 'paused';
				break;
			case 'media_player.volume_set':
				a.volume_level = data.volume_level;
				break;
			case 'media_player.volume_mute':
				a.is_volume_muted = data.is_volume_muted;
				break;
			case 'climate.set_temperature':
				if (typeof data.temperature === 'number') a.temperature = data.temperature;
				break;
			case 'climate.set_hvac_mode':
				entity.s = data.hvac_mode;
				break;
			case 'climate.set_preset_mode':
				a.preset_mode = data.preset_mode;
				break;
			case 'lock.lock':
				entity.s = 'locked';
				break;
			case 'lock.unlock':
				entity.s = 'unlocked';
				break;
			case 'vacuum.start':
				entity.s = 'cleaning';
				break;
			case 'vacuum.pause':
				entity.s = 'paused';
				break;
			case 'vacuum.return_to_base':
				entity.s = 'returning';
				break;
			case 'vacuum.stop':
				entity.s = 'idle';
				break;
			case 'vacuum.set_fan_speed':
				a.fan_speed = data.fan_speed;
				break;
			case 'scene.turn_on':
				entity.s = new Date().toISOString();
				break;
			case 'input_number.set_value':
			case 'input_text.set_value':
			case 'number.set_value':
			case 'text.set_value':
				entity.s = String(data.value);
				break;
			case 'input_select.select_option':
			case 'select.select_option':
				entity.s = data.option;
				break;
			case 'alarm_control_panel.alarm_arm_away':
				entity.s = 'armed_away';
				break;
			case 'alarm_control_panel.alarm_arm_home':
				entity.s = 'armed_home';
				break;
			case 'alarm_control_panel.alarm_arm_night':
				entity.s = 'armed_night';
				break;
			case 'alarm_control_panel.alarm_disarm':
				entity.s = 'disarmed';
				break;
			case 'timer.start':
				entity.s = 'active';
				break;
			case 'timer.pause':
				entity.s = 'paused';
				break;
			case 'timer.cancel':
			case 'timer.finish':
				entity.s = 'idle';
				break;
			case 'counter.increment':
				entity.s = String(Number(entity.s) + 1);
				break;
			case 'counter.decrement':
				entity.s = String(Number(entity.s) - 1);
				break;
			case 'counter.reset':
				entity.s = '0';
				break;
			case 'input_datetime.set_datetime':
				entity.s = data.date ?? data.datetime ?? entity.s;
				break;
			case 'humidifier.set_humidity':
				a.humidity = data.humidity;
				break;
			case 'water_heater.set_temperature':
				a.temperature = data.temperature;
				break;
			case 'water_heater.set_operation_mode':
				entity.s = data.operation_mode;
				a.operation_mode = data.operation_mode;
				break;
			case 'valve.open_valve':
				entity.s = 'open';
				break;
			case 'valve.close_valve':
				entity.s = 'closed';
				break;
			case 'lawn_mower.start_mowing':
				entity.s = 'mowing';
				break;
			case 'lawn_mower.dock':
				entity.s = 'docked';
				break;
			case 'lawn_mower.pause':
				entity.s = 'paused';
				break;
			default:
				if (service === 'turn_on') on();
				else if (service === 'turn_off') off();
				else if (service === 'toggle') (entity.s === 'on' ? off : on)();
				else if (service === 'press') entity.s = new Date().toISOString();
		}
		pushChange(entityId);
	}
}

/** Smooth, deterministic hourly values so charts draw the same picture every run. */
function statisticRows(statisticId, start, end, period) {
	const step =
		period === '5minute' ? 300 : period === 'hour' ? 3600 : period === 'day' ? 86400 : 604800;
	const rows = [];
	const base = statisticId.includes('energy') ? 0 : statisticId.includes('humidity') ? 45 : 20;
	let sum = 1200;
	for (let t = Math.floor(start / 1000); t < end / 1000; t += step) {
		const phase = ((t / 3600) % 24) / 24;
		const mean = base + Math.sin(phase * Math.PI * 2) * 3 + Math.cos(t / 7000) * 0.6;
		const change = 0.4 + Math.max(0, Math.sin(phase * Math.PI * 2)) * 1.6;
		sum += change;
		rows.push({
			start: t * 1000,
			end: (t + step) * 1000,
			mean: Math.round(mean * 10) / 10,
			min: Math.round((mean - 1) * 10) / 10,
			max: Math.round((mean + 1) * 10) / 10,
			sum: Math.round(sum * 100) / 100,
			change: Math.round(change * 100) / 100
		});
	}
	return rows;
}

function historyRows(entityId, start, end) {
	const rows = [];
	let state = entityId.startsWith('binary_sensor') ? 'off' : 'idle';
	for (let t = start / 1000; t < end / 1000; t += 5400) {
		state = state === 'off' ? 'on' : state === 'on' ? 'off' : state;
		rows.push({ s: state, lu: Math.floor(t) });
	}
	return rows;
}

function calendarEvents(start) {
	const day = (offset, hour) => {
		const date = new Date(start);
		date.setDate(date.getDate() + offset);
		date.setHours(hour, 0, 0, 0);
		return date.toISOString();
	};
	return {
		'calendar.family': {
			events: [
				{ summary: 'Dentist', start: day(0, 16), end: day(0, 17) },
				{ summary: 'Piano lesson', start: day(1, 18), end: day(1, 19) }
			]
		}
	};
}

function forecast() {
	const conditions = ['sunny', 'partlycloudy', 'rainy', 'cloudy', 'sunny', 'clear-night', 'snowy'];
	return conditions.map((condition, index) => {
		const date = new Date();
		date.setDate(date.getDate() + index);
		return {
			datetime: date.toISOString(),
			condition,
			temperature: 20 + index,
			templow: 12 + index,
			precipitation_probability: index * 10
		};
	});
}

function handleMessage(socket, message) {
	const reply = (result) =>
		socket.send(JSON.stringify({ id: message.id, type: 'result', success: true, result }));
	const event = (payload) =>
		socket.send(JSON.stringify({ id: message.id, type: 'event', event: payload }));
	switch (message.type) {
		case 'subscribe_entities':
			entitySubscribers.set(socket, message.id);
			reply(null);
			event(snapshot());
			return;
		case 'get_config':
			reply({
				latitude: 51.1,
				longitude: 17.0,
				elevation: 120,
				unit_system: { length: 'km', mass: 'kg', temperature: '°C', volume: 'L' },
				location_name: 'Test home',
				time_zone: 'Europe/Warsaw',
				components: ['light', 'switch', 'sensor', 'sun', 'weather', 'calendar'],
				version: HA_VERSION,
				state: 'RUNNING',
				language: 'en'
			});
			return;
		case 'get_services':
			reply({
				light: { turn_on: {}, turn_off: {}, toggle: {} },
				switch: { turn_on: {}, turn_off: {}, toggle: {} },
				cover: { open_cover: {}, close_cover: {}, set_cover_position: {} },
				climate: { set_temperature: {}, set_hvac_mode: {} },
				calendar: { get_events: {} }
			});
			return;
		case 'persistent_notification/subscribe':
			reply(null);
			event({
				type: 'current',
				notifications: {
					'filter-reminder': {
						notification_id: 'filter-reminder',
						title: 'Filter reminder',
						message: 'The air filter is due for a change.',
						created_at: '2026-09-06T08:00:00+00:00',
						status: 'unread'
					}
				}
			});
			return;
		case 'call_service': {
			const { domain, service, service_data: data = {}, target } = message;
			const merged = { ...data, ...(target ?? {}) };
			calls.push({ domain, service, data: merged });
			if (domain === 'calendar' && service === 'get_events') {
				reply({
					context: { id: 'ctx' },
					response: calendarEvents(new Date(merged.start_date_time ?? Date.now()))
				});
				return;
			}
			applyService(domain, service, merged);
			reply({ context: { id: 'ctx', parent_id: null, user_id: null } });
			return;
		}
		case 'config/area_registry/list':
			reply([
				{ area_id: 'living', name: 'Living room' },
				{ area_id: 'office', name: 'Office' }
			]);
			return;
		case 'config/device_registry/list':
			reply([]);
			return;
		case 'config/entity_registry/list':
			reply(
				Object.keys(states).map((entityId) => ({
					entity_id: entityId,
					area_id: entityId.includes('desk') ? 'office' : 'living',
					device_id: null
				}))
			);
			return;
		case 'recorder/statistics_during_period': {
			const start = Date.parse(message.start_time);
			const end = message.end_time ? Date.parse(message.end_time) : Date.now();
			const result = {};
			for (const id of message.statistic_ids ?? []) {
				result[id] = statisticRows(id, start, end, message.period ?? 'hour');
			}
			reply(result);
			return;
		}
		case 'history/history_during_period': {
			const start = Date.parse(message.start_time);
			const end = message.end_time ? Date.parse(message.end_time) : Date.now();
			const result = {};
			for (const id of message.entity_ids ?? []) result[id] = historyRows(id, start, end);
			reply(result);
			return;
		}
		case 'render_template':
			reply(null);
			event({
				result: `**${states['sensor.temperature'].s} °C** inside, _${states['weather.home'].s}_ outside`,
				listeners: {}
			});
			return;
		case 'weather/subscribe_forecast':
			reply(null);
			event({ forecast: forecast() });
			return;
		default:
			// subscribe_events, subscribe_trigger and anything else the dashboard
			// opens are accepted and never fire
			reply(null);
	}
}

function readBody(request) {
	return new Promise((resolve) => {
		let body = '';
		request.on('data', (chunk) => (body += chunk));
		request.on('end', () => resolve(body));
	});
}

const http = createServer(async (request, response) => {
	if (request.url === '/_test/calls') {
		response.setHeader('Content-Type', 'application/json');
		response.end(JSON.stringify(calls));
		return;
	}
	if (request.url === '/_test/reset' && request.method === 'POST') {
		states = initialStates();
		calls = [];
		for (const entityId of Object.keys(states)) pushChange(entityId);
		response.end('ok');
		return;
	}
	if (request.url === '/_test/state' && request.method === 'POST') {
		let patch;
		try {
			patch = JSON.parse((await readBody(request)) || '{}');
		} catch {
			response.statusCode = 400;
			response.end('invalid JSON');
			return;
		}
		const entity = states[patch.entity_id];
		if (!entity) {
			response.statusCode = 404;
			response.end('unknown entity');
			return;
		}
		if (patch.state !== undefined) entity.s = patch.state;
		if (patch.attributes) Object.assign(entity.a, patch.attributes);
		pushChange(patch.entity_id);
		response.end('ok');
		return;
	}
	response.statusCode = 404;
	response.end();
});

const wss = new WebSocketServer({ server: http, path: '/api/websocket' });

wss.on('connection', (socket) => {
	socket.send(JSON.stringify({ type: 'auth_required', ha_version: HA_VERSION }));
	socket.on('message', (raw) => {
		const message = JSON.parse(String(raw));
		if (message.type === 'auth') {
			socket.send(JSON.stringify({ type: 'auth_ok', ha_version: HA_VERSION }));
			return;
		}
		if (message.type === 'supported_features') return;
		if (message.type === 'ping') {
			socket.send(JSON.stringify({ id: message.id, type: 'pong' }));
			return;
		}
		handleMessage(socket, message);
	});
	socket.on('close', () => entitySubscribers.delete(socket));
});

http.listen(PORT, '127.0.0.1', () => {
	console.log(`fake home assistant listening on http://127.0.0.1:${PORT}`);
});
