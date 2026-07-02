<script lang="ts">
	import { connection, dashboard, record, lang, ripple, services, states } from '$lib/Stores';
	import { onDestroy, onMount } from 'svelte';
	import SpotifyPlayer from '$lib/Main/SpotifyPlayer.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import SpotifyShortcutsConfig from '$lib/Modal/SpotifyShortcutsConfig.svelte';
	import { updateObj } from '$lib/Utils';

	let {
		isOpen,
		sel = $bindable(),
		sectionName = undefined
	}: {
		isOpen: boolean;
		sel: any;
		sectionName?: string;
	} = $props();

	let large = $derived(sel?.type === 'spotify_player_large');

	let name: string | undefined = $state(sel?.name);
	let icon: string | undefined = $state(sel?.icon);
	let color: string | undefined = $state(sel?.color);
	let entity_id: string | undefined = $state(sel?.entity_id);
	let show_progress: boolean = $state(sel?.show_progress ?? true);
	let default_device: string | undefined = $state(sel?.default_device);

	let spotifyEntities = $derived(
		Object.keys($states || {}).filter((key) => key.startsWith('media_player.spotify'))
	);

	// Device list from SpotifyPlus
	interface SpDevice {
		Id: string;
		Name: string;
	}
	let devices: SpDevice[] = $state([]);

	function getSpotifyPlusEntity(): string | undefined {
		if (!entity_id) return undefined;
		if (entity_id.startsWith('media_player.spotifyplus_')) return entity_id;
		const suffix = entity_id.replace('media_player.spotify_', '');
		const candidate = `media_player.spotifyplus_${suffix}`;
		if ($states?.[candidate]) return candidate;
		return Object.keys($states || {}).find((k) => k.startsWith('media_player.spotifyplus_'));
	}

	async function loadDevices() {
		const spEntity = getSpotifyPlusEntity();
		if (!spEntity || !$connection || !$services?.spotifyplus) return;
		try {
			const response: any = await $connection.sendMessagePromise({
				type: 'call_service',
				domain: 'spotifyplus',
				service: 'get_spotify_connect_devices',
				service_data: { entity_id: spEntity },
				return_response: true
			});
			const items = response?.response?.result?.Items || [];
			devices = items.filter((d: any) => d.IsInDeviceList);
		} catch (err) {
			console.error('Failed to load devices:', err);
		}
	}

	onMount(loadDevices);

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}
			<h1>
				{large
					? $lang('spotify_player_large') || 'Spotify Player Large'
					: $lang('spotify_player') || 'Spotify Player'}
			</h1>
		{/snippet}

		<h2>{$lang('preview')}</h2>

		<div style:pointer-events="none">
			<SpotifyPlayer {sel} {sectionName} {large} />
		</div>

		<h2>{$lang('entity') || 'Entity'}</h2>

		{#if spotifyEntities.length > 0}
			<select class="input" bind:value={entity_id} onchange={(event) => set('entity_id', event)}>
				<option value={undefined}>{$lang('select_entity') || 'Select entity'}</option>
				{#each spotifyEntities as entity (entity)}
					<option value={entity}>{entity}</option>
				{/each}
			</select>
		{:else}
			<div class="warning">
				<Icon icon="mdi:alert" height="1.2rem" />
				<p>
					{$lang('no_spotify_entities') ||
						'No Spotify entities found. Make sure you have the Spotify integration configured in Home Assistant.'}
				</p>
			</div>
			<InputClear
				condition={entity_id}
				onclear={() => {
					entity_id = undefined;
					set('entity_id');
				}}
			>
				{#snippet children(padding)}
					<input
						name="Entity ID"
						class="input"
						type="text"
						placeholder="media_player.spotify_username"
						autocomplete="off"
						spellcheck="false"
						bind:value={entity_id}
						onchange={(event) => set('entity_id', event)}
						style:padding
					/>
				{/snippet}
			</InputClear>
		{/if}

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			onclear={() => {
				name = undefined;
				set('name');
			}}
		>
			{#snippet children(padding)}
				<input
					name={$lang('name')}
					class="input"
					type="text"
					placeholder={$lang('name') || 'Name'}
					autocomplete="off"
					spellcheck="false"
					bind:value={name}
					onchange={(event) => set('name', event)}
					style:padding
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('icon')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				onclear={() => {
					icon = undefined;
					set('icon');
				}}
			>
				{#snippet children(padding)}
					<input
						name={$lang('icon')}
						class="input"
						type="text"
						placeholder="mdi:spotify"
						autocomplete="off"
						spellcheck="false"
						bind:value={icon}
						onchange={(event) => set('icon', event)}
						style:padding
					/>
				{/snippet}
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('icon')}
				class="icon-gallery"
				onclick={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				style:padding="0.84rem"
			>
				<Icon icon="majesticons:open-line" height="none" />
			</button>
		</div>

		<h2>{$lang('color')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={color}
				onclear={() => {
					color = undefined;
					set('color');
				}}
			>
				{#snippet children(padding)}
					<input
						name={$lang('color')}
						class="input"
						type="text"
						placeholder="rgb(30, 215, 96)"
						autocomplete="off"
						spellcheck="false"
						bind:value={color}
						onchange={(event) => set('color', event)}
						style:padding
					/>
				{/snippet}
			</InputClear>

			<input
				type="color"
				bind:value={color}
				onclick={() => {
					if (color === undefined) {
						color = '#1ed760';
					}
				}}
				onchange={(event) => set('color', event)}
				title={$lang('color')}
			/>
		</div>

		<h2>{$lang('options') || 'Options'}</h2>

		<div class="option-row">
			<label>
				<input
					type="checkbox"
					bind:checked={show_progress}
					onchange={(event) => set('show_progress', event)}
				/>
				<span>{$lang('show_progress_bar') || 'Show progress bar'}</span>
			</label>
		</div>

		{#if devices.length > 0}
			<h2>{$lang('default_device') || 'Default Device'}</h2>

			<select
				class="input"
				value={default_device || ''}
				onchange={(event) => {
					default_device = (event.target as HTMLSelectElement)?.value || undefined;
					set('default_device', default_device ? { target: { value: default_device } } : undefined);
				}}
			>
				<option value="">{$lang('auto') || 'Auto'}</option>
				{#each devices as device, i (i)}
					<option value={device.Name}>{device.Name}</option>
				{/each}
			</select>
		{/if}

		<SpotifyShortcutsConfig {sel} />

		<h2>{$lang('description') || 'Description'}</h2>
		<p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">
			{large
				? $lang('spotify_player_large_description') ||
					'A large 4x height Spotify player widget displaying album artwork and playback status. Perfect for visual dashboards.'
				: $lang('spotify_player_description') ||
					'A Spotify player with playback controls, device selection, and library browsing. Requires Home Assistant Spotify integration.'}
		</p>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	input[type='color'] {
		color-scheme: dark;
		height: inherit;
		width: 3.15rem;
		padding: 0;
		-webkit-appearance: none;
		appearance: none;
		background-color: transparent;
		cursor: pointer;
		border: none;
	}

	input[type='color']::-webkit-color-swatch {
		border-radius: 0.6rem;
		border: none;
	}

	input[type='color']::-moz-color-swatch {
		border-radius: 0.6rem;
		border: none;
	}

	.warning {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background-color: rgba(255, 152, 0, 0.1);
		border: 1px solid rgba(255, 152, 0, 0.3);
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 1rem;
	}

	.warning p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.option-row {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.option-row label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.option-row label:hover {
		background-color: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.option-row input[type='checkbox'] {
		width: 1.2rem;
		height: 1.2rem;
		cursor: pointer;
	}

	.option-row span {
		flex: 1;
		font-size: 0.95rem;
	}
</style>
