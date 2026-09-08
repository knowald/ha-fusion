import type { HassEntities } from 'home-assistant-js-websocket';
import type { VisibilityCondition } from './config';

/**
 * Evaluates a list of visibility conditions (ANDed together) against current
 * entity states and already-resolved media query matches.
 *
 * Missing-entity semantics: an entity condition fails whenever the entity
 * does not exist in $states, for both `state` and `state_not` - a missing
 * entity is treated as "unknown", not as satisfying "not equal to X".
 */
export function evaluateVisibility(
	conditions: VisibilityCondition[] | undefined,
	$states: HassEntities | undefined,
	mediaMatches: Record<string, boolean>
): boolean {
	if (!conditions || conditions.length === 0) return true;
	return conditions.every((condition) => evaluateCondition(condition, $states, mediaMatches));
}

function evaluateCondition(
	condition: VisibilityCondition,
	$states: HassEntities | undefined,
	mediaMatches: Record<string, boolean>
): boolean {
	if ('media' in condition) {
		return mediaMatches[condition.media] ?? false;
	}
	if ('or' in condition) {
		return condition.or.some((nested) => evaluateCondition(nested, $states, mediaMatches));
	}

	const entityState = $states?.[condition.entity]?.state;
	if (entityState === undefined) return false;

	if (typeof condition.state === 'string') return entityState === condition.state;
	if (typeof condition.state_not === 'string') return entityState !== condition.state_not;
	if (typeof condition.above === 'number' || typeof condition.below === 'number') {
		const value = parseFloat(entityState);
		if (!Number.isFinite(value)) return false;
		if (typeof condition.above === 'number' && !(value > condition.above)) return false;
		if (typeof condition.below === 'number' && !(value < condition.below)) return false;
		return true;
	}

	// neither constraint set: condition just checks the entity is known
	return true;
}
