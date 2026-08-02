<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import { configuration, motion, selectedLanguage, translation } from '$lib/Stores';
	import { authentication } from '$lib/Socket';
	import { normalizeHearthConfig } from '$lib/Hearth/config';
	import { hearthConfig, hearthLoadError, hearthRevision } from '$lib/Hearth/store';
	import HearthDashboard from '$lib/Hearth/HearthDashboard.svelte';

	let { data }: { data: any } = $props();

	// one-time store seeding; `data` only changes on a full page load
	// svelte-ignore state_referenced_locally
	$configuration = data?.configuration;
	// svelte-ignore state_referenced_locally
	$hearthConfig = normalizeHearthConfig(data?.hearth);
	// svelte-ignore state_referenced_locally
	$hearthLoadError = data?.hearthError ?? null;
	// svelte-ignore state_referenced_locally
	$hearthRevision = data?.hearthRevision ?? 0;
	// svelte-ignore state_referenced_locally
	$translation = data?.translations ?? {};
	// svelte-ignore state_referenced_locally
	$selectedLanguage = data?.configuration?.locale || 'en';

	// motion:false in configuration.yaml disables transitions app-wide
	if (data?.configuration?.motion === false) motion.set(0);

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

	/**
	 * Reconnect if long-lived access token changes
	 */
	$effect(() => {
		if ($configuration?.token) updateConnection();
	});

	function updateConnection() {
		if (isConnecting || !browser) return;
		clearInterval(retryInterval);

		connect();
		retryInterval = setInterval(connect, 3000);
	}

	onDestroy(() => clearInterval(retryInterval));

	onMount(async () => {
		/**
		 * Unregister service worker because it
		 * interferes with MJPEG camera streams
		 */
		if ('serviceWorker' in navigator) {
			try {
				const registrations = await navigator.serviceWorker.getRegistrations();
				for (const registration of registrations) {
					await registration.unregister();
				}
			} catch (error) {
				console.error('Error during service worker unregistration:', error);
			}
		}
	});
</script>

<svelte:head>
	<title>Hearth</title>
	<link rel="manifest" href="{base}/hearth.webmanifest" />
	<meta name="theme-color" content="#16110c" />
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

<!-- modules -->
{#if $configuration?.custom_js}
	{#await import('$lib/Components/CustomJs.svelte') then CustomJs}
		<CustomJs.default />
	{/await}
{/if}

<!-- custom css -->
{#await import('$lib/Components/CustomCss.svelte') then CustomCss}
	<CustomCss.default />
{/await}
