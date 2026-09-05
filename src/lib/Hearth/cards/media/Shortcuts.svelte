<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../../config';
	import { hearthEditMode } from '../../store';
	import { playSpotifyUri, type MediaShortcut } from '../../media';
	import Icon from '../../Icon.svelte';

	let {
		entity,
		shortcuts,
		defaultDevice = undefined
	}: { entity: string; shortcuts: MediaShortcut[]; defaultDevice?: string } = $props();

	function play(event: Event, shortcut: MediaShortcut) {
		event.stopPropagation();
		if ($hearthEditMode) return;
		void playSpotifyUri(entity, shortcut.uri, defaultDevice);
	}
</script>

<div class="shortcuts">
	{#each shortcuts as shortcut (shortcut.uri)}
		<button
			type="button"
			class="shortcut pressable"
			title={shortcut.name}
			use:Ripple={PRESS_RIPPLE}
			onclick={(event) => play(event, shortcut)}
		>
			{#if shortcut.image_url}
				<img src={shortcut.image_url} alt="" />
			{:else}
				<span class="glyph"><Icon name="play_arrow" size={18} fill /></span>
			{/if}
			<span class="name">{shortcut.name}</span>
		</button>
	{/each}
</div>

<style>
	.shortcuts {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 2px 0;
		scrollbar-width: none;
	}

	.shortcut {
		flex: none;
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 180px;
		padding: 6px 12px 6px 6px;
		border: 1px solid rgb(255 255 255 / 0.14);
		border-radius: 999px;
		background: rgb(0 0 0 / 0.35);
		color: #fff;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
		backdrop-filter: blur(6px);
	}

	.shortcut img,
	.glyph {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		object-fit: cover;
		display: grid;
		place-items: center;
		background: rgb(255 255 255 / 0.12);
	}

	.name {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
