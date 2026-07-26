<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import { base } from '$app/paths';
</script>

<!-- full page load on purpose: /hearth is a separate app shell, and under
     ingress `base` is the per-installation prefix the router doesn't know -->
<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- base-prefixed full page load -->
<a class="button" href="{base}/hearth" data-sveltekit-reload use:Ripple={$ripple}>
	<figure>
		<Icon icon="mdi:fireplace" height="none" />
	</figure>

	<span>{$lang('hearth')}</span>
</a>

<style>
	a.button {
		text-decoration: none;
		display: inline-block;
	}
</style>
