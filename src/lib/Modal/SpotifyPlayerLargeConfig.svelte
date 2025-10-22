<script lang="ts">
	import { dashboard, record, lang, ripple, states } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import SpotifyPlayerLarge from '$lib/Main/SpotifyPlayerLarge.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;
	export let sectionName: string | undefined = undefined;

	let name: string | undefined = sel?.name;
	let icon: string | undefined = sel?.icon;
	let color: string | undefined = sel?.color;
	let entity_id: string | undefined = sel?.entity_id;
	let show_progress: boolean = sel?.show_progress ?? true;

	// Get list of Spotify media players
	$: spotifyEntities = Object.keys($states || {}).filter((key) =>
		key.startsWith('media_player.spotify')
	);

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('spotify_player_large') || 'Spotify Player Large'}</h1>

		<h2>{$lang('preview')}</h2>

		<div style:pointer-events="none">
			<SpotifyPlayerLarge {sel} {sectionName} />
		</div>

		<h2>{$lang('entity') || 'Entity'}</h2>

		{#if spotifyEntities.length > 0}
			<select
				class="input"
				bind:value={entity_id}
				on:change={(event) => set('entity_id', event)}
			>
				<option value={undefined}>{$lang('select_entity') || 'Select entity'}</option>
				{#each spotifyEntities as entity}
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
				on:clear={() => {
					entity_id = undefined;
					set('entity_id');
				}}
				let:padding
			>
				<input
					name="Entity ID"
					class="input"
					type="text"
					placeholder="media_player.spotify_username"
					autocomplete="off"
					spellcheck="false"
					bind:value={entity_id}
					on:change={(event) => set('entity_id', event)}
					style:padding
				/>
			</InputClear>
		{/if}

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => {
				name = undefined;
				set('name');
			}}
			let:padding
		>
			<input
				name={$lang('name')}
				class="input"
				type="text"
				placeholder={$lang('name') || 'Name'}
				autocomplete="off"
				spellcheck="false"
				bind:value={name}
				on:change={(event) => set('name', event)}
				style:padding
			/>
		</InputClear>

		<h2>{$lang('icon')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				on:clear={() => {
					icon = undefined;
					set('icon');
				}}
				let:padding
			>
				<input
					name={$lang('icon')}
					class="input"
					type="text"
					placeholder="mdi:spotify"
					autocomplete="off"
					spellcheck="false"
					bind:value={icon}
					on:change={(event) => set('icon', event)}
					style:padding
				/>
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('icon')}
				class="icon-gallery"
				on:click={() => {
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
				on:clear={() => {
					color = undefined;
					set('color');
				}}
				let:padding
			>
				<input
					name={$lang('color')}
					class="input"
					type="text"
					placeholder="rgb(30, 215, 96)"
					autocomplete="off"
					spellcheck="false"
					bind:value={color}
					on:change={(event) => set('color', event)}
					style:padding
				/>
			</InputClear>

			<input
				type="color"
				bind:value={color}
				on:click={() => {
					if (color === undefined) {
						color = '#1ed760';
					}
				}}
				on:change={(event) => set('color', event)}
				title={$lang('color')}
			/>
		</div>

		<h2>{$lang('options') || 'Options'}</h2>

		<div class="option-row">
			<label>
				<input
					type="checkbox"
					bind:checked={show_progress}
					on:change={(event) => set('show_progress', event)}
				/>
				<span>{$lang('show_progress_bar') || 'Show progress bar'}</span>
			</label>
		</div>

		<h2>{$lang('description') || 'Description'}</h2>
		<p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">
			{$lang('spotify_player_large_description') ||
				'A large 4x height Spotify player widget displaying album artwork and playback status. Perfect for visual dashboards.'}
		</p>

		<ConfigButtons {sel} {sectionName} />
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
