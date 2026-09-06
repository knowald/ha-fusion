import { editMode } from '$lib/Stores';

/**
 * Fusion embeds consult the original edit-mode store before sending services.
 * Mirror Hearth's mode while its dashboard is mounted so embedded objects obey
 * the same safety boundary as native controls. Returns the reset for unmount.
 */
export function mirrorLegacyEditMode(editing: boolean): () => void {
	editMode.set(editing);
	return () => editMode.set(false);
}
