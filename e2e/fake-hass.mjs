import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

/*
 * A scripted stand-in for the Home Assistant websocket API, enough to boot the
 * dashboard and observe the service calls it sends. State lives in memory and
 * every connected client receives the same entity stream. Two HTTP endpoints
 * exist for tests: GET /_test/calls lists received service calls, and
 * POST /_test/reset restores the initial states and clears the call log.
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
		'switch.fan': { s: 'on', a: { friendly_name: 'Ceiling fan' } },
		'sensor.temperature': {
			s: '21.5',
			a: { friendly_name: 'Temperature', unit_of_measurement: '°C', device_class: 'temperature' }
		},
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
	const entityId = data?.entity_id;
	const entity = states[entityId];
	if (!entity) return;
	const on = () => {
		entity.s = 'on';
		if (domain === 'light') {
			entity.a.color_mode = 'brightness';
			if (typeof data.brightness_pct === 'number') {
				entity.a.brightness = Math.round((data.brightness_pct / 100) * 255);
			} else if (typeof data.brightness === 'number') {
				entity.a.brightness = data.brightness;
			} else if (!entity.a.brightness) {
				entity.a.brightness = 255;
			}
		}
	};
	const off = () => {
		entity.s = 'off';
		if (domain === 'light') {
			entity.a.color_mode = null;
			entity.a.brightness = null;
		}
	};
	if (service === 'turn_on') on();
	else if (service === 'turn_off') off();
	else if (service === 'toggle') (entity.s === 'on' ? off : on)();
	pushChange(entityId);
}

function handleMessage(socket, message) {
	const reply = (result) =>
		socket.send(JSON.stringify({ id: message.id, type: 'result', success: true, result }));
	switch (message.type) {
		case 'subscribe_entities':
			entitySubscribers.set(socket, message.id);
			reply(null);
			socket.send(JSON.stringify({ id: message.id, type: 'event', event: snapshot() }));
			return;
		case 'get_config':
			reply({
				latitude: 51.1,
				longitude: 17.0,
				elevation: 120,
				unit_system: { length: 'km', mass: 'kg', temperature: '°C', volume: 'L' },
				location_name: 'Test home',
				time_zone: 'Europe/Warsaw',
				components: ['light', 'switch', 'sensor', 'sun'],
				version: HA_VERSION,
				state: 'RUNNING',
				language: 'en'
			});
			return;
		case 'get_services':
			reply({
				light: { turn_on: {}, turn_off: {}, toggle: {} },
				switch: { turn_on: {}, turn_off: {}, toggle: {} }
			});
			return;
		case 'persistent_notification/subscribe':
			reply(null);
			socket.send(
				JSON.stringify({
					id: message.id,
					type: 'event',
					event: { type: 'current', notifications: {} }
				})
			);
			return;
		case 'call_service': {
			const { domain, service, service_data: data = {} } = message;
			calls.push({ domain, service, data });
			applyService(domain, service, data);
			reply({ context: { id: 'ctx', parent_id: null, user_id: null } });
			return;
		}
		case 'config/area_registry/list':
		case 'config/device_registry/list':
		case 'config/entity_registry/list':
			reply([]);
			return;
		case 'recorder/statistics_during_period':
			reply({});
			return;
		default:
			// subscribe_events, subscribe_trigger, render_template and anything
			// else the dashboard opens are accepted and never fire
			reply(null);
	}
}

const http = createServer((request, response) => {
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
