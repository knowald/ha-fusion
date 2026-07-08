<script lang="ts">
	// eventually merge with SidebarItemConfig.svelte...

	import { record, lang, motion, ripple, states, demo, updateDashboard } from '$lib/Stores';
	import { openModal, closeModal } from '$lib/Modals';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import InputClear from '$lib/Components/InputClear.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import {
		getCameraEntity,
		getSensorEntity,
		getMediaPlayerEntity
	} from '$lib/Modal/getRandomEntity';

	import Button from '$lib/Main/Button.svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import ConditionalMedia from '$lib/Main/ConditionalMedia.svelte';
	import Empty from '$lib/Main/Empty.svelte';
	import Entities from '$lib/Main/Entities.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from '$lib/Actions/ripple';
	import PictureElements from '$lib/Main/PictureElements.svelte';
	import DaysSince from '$lib/Main/DaysSince.svelte';
	import SpotifyPlayer from '$lib/Main/SpotifyPlayer.svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	// `sel` is a plain prop, so it can't be reassigned after refreshDashboard()
	// re-creates the graph; keep the live item in reactive local state instead
	// svelte-ignore state_referenced_locally
	let selected = $state(sel);

	let searchString = $state('');
	let searchElement = $state<HTMLInputElement>();

	// get random preview entities
	if (!$demo.camera) $demo.camera = getCameraEntity($states);
	if (!$demo.sensor) $demo.sensor = getSensorEntity($states);
	if (!$demo.media_player) $demo.media_player = getMediaPlayerEntity($states);

	let loadIcons: (typeof import('@iconify/svelte'))['loadIcons'];
	let icons: Record<string, string>;

	onMount(async () => {
		if (searchElement) {
			searchElement.focus();
		}

		// if changing type reset object
		if (selected) {
			selected = updateDashboard(selected, (live) => {
				Object.keys(live).forEach((key) => {
					if (key !== 'id') {
						delete live[key];
					}
				});
				live.type = 'configure';
			});
		}

		// picture elements config, need to be loaded before click but can be deferred to onmount
		const [iconifyModule, iconsModule] = await Promise.all([
			import('@iconify/svelte'),
			import('$lib/Modal/PictureElements/icons')
		]);

		loadIcons = iconifyModule.loadIcons;
		icons = iconsModule.icons;
	});

	let itemTypes: {
		id: string;
		type: string;
		component?: any;
		props?: any;
		style?: any;
	}[] = $derived([
		{
			id: 'button',
			type: $lang('button'),
			component: Button,
			props: {
				demo: $demo.sensor,
				sel: selected
			}
		},
		{
			id: 'days_since',
			type: $lang('days_since') || 'Days Since',
			component: DaysSince,
			props: {
				sel: selected
			}
		},
		{
			id: 'spotify_player',
			type: $lang('spotify_player') || 'Spotify Player',
			component: SpotifyPlayer,
			props: {
				sel: selected
			}
		},
		{
			id: 'spotify_player_large',
			type: $lang('spotify_player_large') || 'Spotify Player Large',
			component: SpotifyPlayer,
			props: {
				sel: selected,
				large: true
			}
		},
		{
			id: 'entities',
			type: $lang('entities'),
			component: Entities,
			props: {
				demo: $demo.sensor,
				sel: selected
			}
		},
		{
			id: 'camera',
			type: $lang('camera'),
			component: Camera,
			props: {
				demo: $demo.camera,
				sel: selected,
				responsive: true,
				controls: false,
				muted: true
			}
		},
		{
			id: 'picture_elements',
			type: $lang('picture_elements'),
			component: PictureElements,
			props: {
				sel: selected
			}
		},
		{
			id: 'empty',
			type: $lang('empty'),
			component: Empty,
			props: {
				sel: selected
			}
		},
		{
			id: 'conditional_media',
			type: `${$lang('conditional')} ${$lang('media')?.toLocaleLowerCase()}`,
			component: ConditionalMedia,
			props: {
				demo: $demo.media_player,
				sel: selected
			}
		}
	]);

	let filter = $derived(
		itemTypes
			.filter(
				({ id, type }) =>
					id.toLowerCase().includes(searchString.toLowerCase()) ||
					type.toLowerCase().includes(searchString.toLowerCase())
			)
			.sort((a, b) => a.type.localeCompare(b.type))
	);

	async function handleClick(id: string) {
		closeModal();

		// set item type, then hand the re-linked live object to the next modal -
		// a stale ref would swallow all further edits
		if (selected && selected?.type) {
			selected = updateDashboard(selected, (live) => {
				live.type = id;
			});
		}
		$record();

		switch (selected?.type) {
			case 'button':
				openModal(() => import('$lib/Modal/ButtonConfig.svelte'), {
					demo: $demo.sensor,
					sel: selected
				});
				break;
			case 'days_since':
				openModal(() => import('$lib/Modal/DaysSinceConfig.svelte'), {
					sel: selected
				});
				break;
			case 'spotify_player':
			case 'spotify_player_large':
				openModal(() => import('$lib/Modal/SpotifyPlayerConfig.svelte'), {
					sel: selected
				});
				break;
			case 'entities':
				openModal(() => import('$lib/Modal/EntitiesConfig.svelte'), {
					sel: selected
				});
				break;
			case 'camera':
				openModal(() => import('$lib/Modal/CameraConfig.svelte'), {
					demo: $demo.camera,
					sel: selected
				});
				break;
			case 'conditional_media':
				openModal(() => import('$lib/Modal/ConditionalMediaConfig.svelte'), {
					demo: $demo.media_player,
					sel: selected
				});
				break;
			case 'picture_elements': {
				loadIcons(Object.values(icons));

				openModal(() => import('$lib/Modal/PictureElements/PictureElementsConfig.svelte'), {
					sel: selected
				});

				break;
			}

			case 'empty':
				openModal(() => import('$lib/Modal/EmptyConfig.svelte'), { sel: selected });
				break;
			default:
				openModal(() => import('$lib/Modal/MainItemConfig.svelte'), { sel: selected });
		}
	}

	/**
	 * Handle keydown when pressing Esc key. Clear
	 * `searchElement` if focused else close modal
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();

		if (searchElement === document.activeElement && searchString) {
			searchElement.blur();
			searchString = '';
		} else {
			closeModal();
		}
	}
</script>

<svelte:window onkeydowncapture={handleKeydown} />

{#if isOpen}
	<Modal size="large">
		{#snippet title()}<h1>{$lang('options')}</h1>{/snippet}

		<div class="search">
			<InputClear
				condition={searchString}
				onclear={() => {
					searchString = '';
				}}
			>
				{#snippet children(padding)}
					<input
						name={$lang('search')}
						class="input"
						type="text"
						placeholder={$lang('search')}
						autocomplete="off"
						spellcheck="false"
						bind:this={searchElement}
						bind:value={searchString}
						style:padding
					/>
				{/snippet}
			</InputClear>
		</div>

		<div class="container">
			{#each filter as { id, type, component: Component, props, style } (id)}
				<button
					onclick={() => handleClick(id)}
					animate:flip={{ duration: $motion }}
					style:text-align={style?.['text-align'] || 'start'}
					use:Ripple={$ripple}
				>
					<div class="header">
						{type}
					</div>

					<div class="preview" class:camera={id === 'camera'} class:button={id === 'button'}>
						<Component {...props} />
					</div>
				</button>
			{/each}
		</div>

		<ConfigButtons sel={selected} disableChangeType={true} />
	</Modal>
{/if}

<style>
	.camera {
		padding: 1rem 1.2rem;
		height: inherit;
	}

	.button {
		display: flex;
		align-self: start;
		min-width: 14.5rem;
	}

	.container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		grid-gap: 1rem;
		overflow: auto;
		align-content: start;
		min-height: 60vh;
	}

	button {
		display: grid;
		padding: 0;
		font-family: inherit;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.8em;
		background-color: rgba(0, 0, 0, 0.2);
		height: 10rem;
		overflow: hidden;
		outline-offset: -2px;
	}

	.header {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.8em 1em 0.7em 1em;
		color: white;
		font-weight: 500;
		display: inline-flex;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		font-size: 1rem;
		height: min-content;
	}

	.preview {
		color: white;
		padding: 0 1.5rem;
		min-width: -webkit-fill-available;
	}

	.search {
		margin: 1rem 0;
	}
</style>
