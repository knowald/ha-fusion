import type { HassEntity } from 'home-assistant-js-websocket';
export { getDomain, getTogglableService } from '$lib/core/ha/entities';
import { getDomain } from '$lib/core/ha/entities';

export { getSupport } from '$lib/core/ha/entities';
export { isTimestamp, relativeTime } from '$lib/core/i18n/time';
import type { Dashboard, Section } from '$lib/Types';

/**
 * Updates a selected object's property based on the event or direct value.
 * If no value is provided, the specified property is deleted from the object.
 */
export function updateObj(sel: any, key: string, event?: any) {
	if (event?.type) {
		// select or input
		sel[key] = event.detail || event.target?.value;
	} else if (event !== undefined) {
		// direct value
		sel[key] = event;
	} else {
		delete sel[key];
	}
	return sel;
}

/**
 * Retrieves a selected item by its ID from the given dashboard data.
 * It first searches within the sidebar, then the views sections
 */
export function getSelected(id: number | undefined, data: Dashboard) {
	if (data.sidebar) {
		const sidebarItem = data.sidebar.find((item) => item.id === id);
		if (sidebarItem) return sidebarItem;
	}

	if (data.views) {
		for (const view of data.views) {
			if (view.id === id) return view;
			if (view.sections) {
				const result = findInSections(view.sections, id);
				if (result) return result;
			}
		}
	}

	return undefined;
}

function findInSections(sections: Section[], id: number | undefined): any {
	for (const section of sections) {
		if (section.id === id) return section;
		if (section.items) {
			for (const item of section.items) {
				if (item.id === id) return item;
			}
		}
		if (
			(section.type === 'horizontal-stack' || section.type === 'vertical-stack') &&
			section.sections
		) {
			const result = findInSections(section.sections, id);
			if (result) return result;
		}
	}
	return undefined;
}

/**
 * Checks if a section type is a stack type
 */
export function isStackType(type: string | undefined): boolean {
	return type === 'horizontal-stack' || type === 'vertical-stack';
}

/**
 * Returns the name of a given entity
 * name | friendly_name | entity_id
 */
export function getName(
	sel: any | undefined,
	entity: HassEntity | undefined,
	sectionName: string | undefined = undefined
) {
	const name = sel?.name || entity?.attributes?.friendly_name || entity?.entity_id?.split('.')?.[1];
	return !sel?.name && sectionName && name?.startsWith(sectionName + ' ')
		? name?.substring(sectionName?.length + 1)
		: name;
}

/**
 * Domains that default to display-only buttons unless overridden per button.
 * Domains without a togglable service (climate, alarm_control_panel, camera...)
 * must not be listed here; they are interactive through their modals.
 */
export function isDisplayOnlyDomain(entity_id: string | undefined): boolean {
	const domain = getDomain(entity_id);
	if (!domain) return false;

	return [
		'sensor',
		'binary_sensor',
		'weather',
		'sun',
		'date',
		'time',
		'person',
		'zone',
		'device_tracker'
	].includes(domain);
}

/**
 * Generates a unique 13-digit random ID
 * that doesn't collide with existing IDs
 */
export function generateId(data: Dashboard) {
	const ids = new Set();

	// add ids
	for (const item of data.sidebar) {
		ids.add(item.id);
	}

	for (const view of data.views) {
		ids.add(view.id);

		if (view.sections) {
			for (const section of view.sections) {
				ids.add(section.id);

				if (section.items) {
					for (const item of section.items) {
						ids.add(item.id);
					}
				}
			}
		}
	}

	let id;
	while (!id || ids.has(id)) {
		id = Math.floor(Math.random() * 1e13 - 1e12) + 1e12;
	}
	return id;
}
