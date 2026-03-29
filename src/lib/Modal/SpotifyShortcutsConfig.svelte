<script lang="ts">
	import { dashboard, lang, ripple } from '$lib/Stores';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import type { SpotifyShortcut } from '$lib/Types';
	import { updateObj } from '$lib/Utils';

	export let sel: any;

	$: shortcuts = (sel?.shortcuts ?? []) as SpotifyShortcut[];

	let newName = '';
	let newUri = '';
	let newImageUrl = '';

	function set(key: string, value: any) {
		sel = updateObj(sel, key, value);
		$dashboard = $dashboard;
	}

	function addShortcut() {
		if (!newName.trim() || !newUri.trim()) return;

		const shortcut: SpotifyShortcut = {
			name: newName.trim(),
			uri: newUri.trim()
		};
		if (newImageUrl.trim()) {
			shortcut.image_url = newImageUrl.trim();
		}

		set('shortcuts', [...shortcuts, shortcut]);

		newName = '';
		newUri = '';
		newImageUrl = '';
	}

	function removeShortcut(index: number) {
		const updated = shortcuts.filter((_, i) => i !== index);
		set('shortcuts', updated.length > 0 ? updated : undefined);
	}
</script>

<h2>{$lang('quick_play') || 'Quick Play Shortcuts'}</h2>

<p class="description">
	{$lang('quick_play_description') || 'Shown when nothing is playing. Add Spotify URIs for playlists, albums, or tracks.'}
</p>

{#if shortcuts.length > 0}
	<div class="shortcut-list">
		{#each shortcuts as shortcut, index}
			<div class="shortcut-item">
				{#if shortcut.image_url}
					<img src={shortcut.image_url} alt={shortcut.name} class="shortcut-thumb" />
				{:else}
					<div class="shortcut-thumb placeholder">
						<Icon icon="mdi:music-note" height="1rem" />
					</div>
				{/if}
				<div class="shortcut-info">
					<span class="shortcut-name">{shortcut.name}</span>
					<span class="shortcut-uri">{shortcut.uri}</span>
				</div>
				<button
					class="remove-btn"
					title={$lang('remove') || 'Remove'}
					on:click={() => removeShortcut(index)}
					use:Ripple={$ripple}
				>
					<Icon icon="mdi:close" height="1rem" />
				</button>
			</div>
		{/each}
	</div>
{/if}

<div class="add-form">
	<InputClear
		condition={newName}
		on:clear={() => (newName = '')}
		let:padding
	>
		<input
			class="input"
			type="text"
			placeholder={$lang('name') || 'Name'}
			autocomplete="off"
			spellcheck="false"
			bind:value={newName}
			style:padding
		/>
	</InputClear>

	<InputClear
		condition={newUri}
		on:clear={() => (newUri = '')}
		let:padding
	>
		<input
			class="input"
			type="text"
			placeholder="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M"
			autocomplete="off"
			spellcheck="false"
			bind:value={newUri}
			style:padding
		/>
	</InputClear>

	<InputClear
		condition={newImageUrl}
		on:clear={() => (newImageUrl = '')}
		let:padding
	>
		<input
			class="input"
			type="text"
			placeholder={($lang('image_url') || 'Image URL') + ' (' + ($lang('optional') || 'optional') + ')'}
			autocomplete="off"
			spellcheck="false"
			bind:value={newImageUrl}
			style:padding
		/>
	</InputClear>

	<button
		class="add-btn"
		on:click={addShortcut}
		disabled={!newName.trim() || !newUri.trim()}
		use:Ripple={$ripple}
	>
		<Icon icon="mdi:plus" height="1.2rem" />
		<span>{$lang('add') || 'Add'}</span>
	</button>
</div>

<style>
	.description {
		margin: 0 0 0.75rem;
		opacity: 0.6;
		font-size: 0.85rem;
	}

	.shortcut-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.6rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
	}

	.shortcut-thumb {
		width: 2rem;
		height: 2rem;
		border-radius: 0.25rem;
		object-fit: cover;
		flex-shrink: 0;
	}

	.shortcut-thumb.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.3);
		color: rgba(255, 255, 255, 0.3);
	}

	.shortcut-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.shortcut-name {
		font-size: 0.85rem;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.shortcut-uri {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.remove-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.8rem;
		height: 1.8rem;
		background-color: rgba(244, 67, 54, 0.15);
		border: none;
		border-radius: 50%;
		color: rgb(244, 67, 54);
		cursor: pointer;
		transition: background-color 0.15s ease;
		font-family: inherit;
	}

	.remove-btn:hover {
		background-color: rgba(244, 67, 54, 0.3);
	}

	.add-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.add-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.6rem 1rem;
		background-color: rgba(30, 215, 96, 0.15);
		border: 1px solid rgba(30, 215, 96, 0.3);
		border-radius: 0.5rem;
		color: rgb(30, 215, 96);
		cursor: pointer;
		transition: all 0.15s ease;
		font-family: inherit;
		font-size: 0.9rem;
	}

	.add-btn:hover:not(:disabled) {
		background-color: rgba(30, 215, 96, 0.25);
	}

	.add-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
