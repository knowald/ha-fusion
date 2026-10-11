<script lang="ts">
	import { dashboard, motion, record, lang, ripple } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';
	import { generateId } from '$lib/Utils';
	let { onclicked = undefined, view }: { onclicked?: (() => void) | undefined; view: any } =
		$props();

	let noViews = $derived(!$dashboard?.views?.length);

	/**
	 * Creates a new section object
	 * in current view
	 */
	function handleClick() {
		if (!view || !view.sections) return;

		// prepend section
		view.sections = [
			{
				name: $lang('section'),
				items: [],
				id: generateId($dashboard)
			},
			...view.sections
		];

		// reassigning `$dashboard` to itself is not enough - the derived `view`
		// in +page.svelte resolves to the same object ref, so nothing re-renders.
		// Deep clone to refresh all refs, same as drag end and undo/redo.
		dashboard.update((d) => JSON.parse(JSON.stringify(d)));

		$record();

		onclicked?.();
	}
</script>

<button
	class="button dropdown"
	onclick={handleClick}
	use:Ripple={{
		...$ripple,
		opacity: noViews ? 0 : $ripple.opacity
	}}
	style:cursor={noViews ? 'unset' : 'pointer'}
	style:opacity={noViews ? '0.5' : '1'}
	style:transition="opacity {$motion}ms ease"
>
	<figure>
		<Icon icon="gg:row-first" height="none" />
	</figure>

	{$lang('section')}
</button>

<style>
	figure {
		transform: scale(135%);
		transform-origin: center 0.64rem;
	}
</style>
