<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { configuration, selectedLanguage, translation } from '$lib/Stores';
	import { authentication } from '$lib/Socket';
	import { normalizeHearthConfig } from '$lib/Hearth/config';
	import { hearthConfig, hearthRevision } from '$lib/Hearth/store';
	import HearthDashboard from '$lib/Hearth/HearthDashboard.svelte';

	let { data }: { data: any } = $props();

	// one-time store seeding; `data` only changes on a full page load
	// svelte-ignore state_referenced_locally
	$configuration = data?.configuration;
	// svelte-ignore state_referenced_locally
	$hearthConfig = normalizeHearthConfig(data?.hearth);
	// svelte-ignore state_referenced_locally
	$hearthRevision = data?.hearthRevision ?? 0;
	// svelte-ignore state_referenced_locally
	$translation = data?.translations ?? {};
	// svelte-ignore state_referenced_locally
	$selectedLanguage = data?.configuration?.locale || 'en';

	let isConnecting = false;
	let retryInterval: ReturnType<typeof setInterval>;

	if (browser) {
		connect();
		retryInterval = setInterval(connect, 3000);
	}

	async function connect() {
		if (isConnecting) return;
		isConnecting = true;
		try {
			await authentication($configuration);
			clearInterval(retryInterval);
		} catch {
			// retry on interval
		} finally {
			isConnecting = false;
		}
	}

	onDestroy(() => clearInterval(retryInterval));
</script>

<svelte:head>
	<title>Hearth</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
		rel="stylesheet"
	/>
</svelte:head>

<HearthDashboard />
