<script lang="ts">
	import { dashboard, motion, record, lang, ripple } from '$lib/Stores';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';
	import { generateId } from '$lib/Utils';
	let { onclicked = undefined, view }: { onclicked?: (() => void) | undefined; view: any } = $props();

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
				type: 'scenes',
				name: $lang('scenes'),
				items: [],
				id: generateId($dashboard)
			},
			...view.sections
		];

		// trigger reactivity by reassigning to self
		$dashboard = $dashboard;

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
		<Icon icon="heroicons:view-columns-16-solid" height="none" />
	</figure>

	{$lang('scenes')}
</button>
