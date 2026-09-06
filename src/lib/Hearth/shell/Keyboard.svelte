<script lang="ts">
	import {
		editor,
		hearthConfig,
		hearthEditMode,
		openPopovers,
		redoConfig,
		saveWithFeedback,
		undoConfig
	} from '../store';

	/** Global shortcuts: f for search, cmd/ctrl+s and cmd/ctrl+z while editing. */
	let { searchOpen, onsearch }: { searchOpen: boolean; onsearch: () => void } = $props();

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

		if (
			!typing &&
			!$hearthEditMode &&
			$hearthConfig.rail.some((widget) => widget.type === 'search') &&
			!searchOpen &&
			!$openPopovers &&
			event.key === 'f' &&
			!event.metaKey &&
			!event.ctrlKey &&
			!event.altKey
		) {
			event.preventDefault();
			onsearch();
			return;
		}

		if (!$hearthEditMode || !(event.metaKey || event.ctrlKey)) return;
		// an open edit sheet owns these: saving would drop its unsubmitted form and
		// undo would shift the card it is bound to out from under it
		if ($editor) return;
		if (event.key === 's') {
			event.preventDefault();
			void saveWithFeedback();
		} else if (event.key.toLowerCase() === 'z' && !typing) {
			event.preventDefault();
			if (event.shiftKey) redoConfig();
			else undoConfig();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />
