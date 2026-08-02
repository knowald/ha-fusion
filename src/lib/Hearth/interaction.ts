import { getContext, setContext } from 'svelte';

export type HearthInteractionMode = 'runtime' | 'layout-edit' | 'preview';
type HearthInteractionSource = HearthInteractionMode | (() => HearthInteractionMode);

const INTERACTION_MODE = Symbol('hearth-interaction-mode');

/** Sets the interaction contract inherited by a rendered Hearth subtree. */
export function provideHearthInteractionMode(source: HearthInteractionSource) {
	setContext(INTERACTION_MODE, source);
}

/** Runtime is the default for cards rendered outside an explicit wrapper. */
export function getHearthInteractionMode(): HearthInteractionMode {
	const source = getContext<HearthInteractionSource | undefined>(INTERACTION_MODE);
	return typeof source === 'function' ? source() : (source ?? 'runtime');
}
