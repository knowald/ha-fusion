<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import '@fontsource-variable/geist-mono';
	import '@fontsource-variable/hanken-grotesk';
	import '@material-symbols/font-400/rounded.css';
	import { onDestroy } from 'svelte';
	import {
		connected,
		configuration,
		motion,
		selectedLanguage,
		states,
		translation
	} from '$lib/Stores';
	import { authentication } from '$lib/Socket';
	import { normalizeHearthConfig } from '$lib/Hearth/config';
	import {
		hearthConfig,
		hearthLoadError,
		hearthNeedsSetup,
		hearthRevision
	} from '$lib/Hearth/store';
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
	$hearthNeedsSetup = data?.hearthNeedsSetup ?? false;
	// svelte-ignore state_referenced_locally
	$hearthRevision = data?.hearthRevision ?? 0;
	// svelte-ignore state_referenced_locally
	$translation = data?.translations ?? {};
	// svelte-ignore state_referenced_locally
	$selectedLanguage = data?.configuration?.locale || 'en';
	if (browser) document.documentElement.lang = $selectedLanguage;

	// motion:false in configuration.yaml disables transitions app-wide
	// svelte-ignore state_referenced_locally
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
</script>

<svelte:head>
	<title>Hearth</title>
	<link rel="manifest" href="{base}/hearth.webmanifest" />
	<meta name="theme-color" content="#16110c" />
</svelte:head>

{#if $states}
	<HearthDashboard />
{:else}
	<section class="boot" aria-live="polite" aria-busy="true">
		<div class="boot-mark" aria-hidden="true"></div>
		<strong>{$connected ? 'Loading Home Assistant…' : 'Connecting to Home Assistant…'}</strong>
		<span>Hearth will appear after the first entity snapshot arrives.</span>
	</section>
{/if}

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

<style>
	.boot {
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 12px;
		width: 100%;
		height: 100dvh;
		padding: 24px;
		background: #16110c;
		color: #f6eee5;
		font-family: 'Hanken Grotesk Variable', sans-serif;
		text-align: center;
	}

	.boot-mark {
		width: 36px;
		height: 36px;
		border: 3px solid rgba(240, 166, 61, 0.22);
		border-top-color: #f0a63d;
		border-radius: 50%;
		animation: spin 900ms linear infinite;
	}

	.boot strong {
		font-size: 20px;
	}

	.boot span {
		font-size: 14px;
		color: #a99b8b;
	}

	@keyframes spin {
		to {
			transform: rotate(1turn);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot-mark {
			animation: none;
		}
	}
</style>
