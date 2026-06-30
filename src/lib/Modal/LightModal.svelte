<script lang="ts">
	import { states, selectedLanguage, lang, ripple, connection } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import LightSlider from '$lib/Components/LightSlider.svelte';
	import ColorPicker from '$lib/Components/ColorPicker.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import Ripple from '$lib/Actions/ripple';
	import { getName } from '$lib/Utils';
	import { callService, type HassEntity } from 'home-assistant-js-websocket';
	import Toggle from '$lib/Components/Toggle.svelte';
	import { onMount } from 'svelte';
	import Select from '$lib/Components/Select.svelte';

	let { isOpen, sel = $bindable() }: { isOpen: boolean; sel: any } = $props();

	let debounce = $state(false);
	let timeout: ReturnType<typeof setTimeout>;
	let rangeValue = $state(0);

	let groupSel: string | undefined = $state(undefined);
	let groupEntity: HassEntity = $state() as HassEntity;

	let manualTab: string | undefined = $state(undefined);
	let selTabClicked = $state(false);

	// https://github.com/home-assistant/frontend/blob/dev/src/data/light.ts
	const LightColorMode = {
		UNKNOWN: 'unknown',
		ONOFF: 'onoff',
		BRIGHTNESS: 'brightness',
		COLOR_TEMP: 'color_temp',
		HS: 'hs',
		XY: 'xy',
		RGB: 'rgb',
		RGBW: 'rgbw',
		RGBWW: 'rgbww',
		WHITE: 'white'
	} as const;

	const modesSupportingColor: string[] = [
		LightColorMode.HS,
		LightColorMode.XY,
		LightColorMode.RGB,
		LightColorMode.RGBW,
		LightColorMode.RGBWW
	];

	const modesSupportingBrightness: string[] = [
		...modesSupportingColor,
		LightColorMode.COLOR_TEMP,
		LightColorMode.BRIGHTNESS,
		LightColorMode.WHITE
	];

	let entity = $derived($states?.[sel?.entity_id]);
	let attributes = $derived(entity?.attributes);

	// make sure it's an array
	let colorModes = $derived(
		Array.isArray(attributes?.supported_color_modes)
			? attributes?.supported_color_modes
			: [attributes?.supported_color_modes].filter(Boolean)
	);

	let colorMode = $derived(attributes?.color_mode);

	let supports = $derived({
		COLOR_MODE: colorModes?.includes(colorMode),
		COLOR: colorModes?.some((mode: string) => modesSupportingColor.includes(mode)),
		BRIGHTNESS: colorModes?.some((mode: string) => modesSupportingBrightness.includes(mode))
	});

	// follows the entity's color mode until the user picks a tab manually
	let selTab: string | undefined = $derived(
		selTabClicked
			? manualTab
			: colorMode === 'color_temp' || colorMode === 'white'
				? colorMode
				: supports?.COLOR
					? 'color'
					: colorMode
	);

	let toggle = $derived(entity?.state === 'on');
	let current = $derived(Math.round(rangeValue / 2.55));
	let brightness = $derived(entity?.attributes?.brightness);

	onMount(() => {
		groupEntity = entity;
		if (groupEntity?.entity_id) {
			groupSel = $states?.[groupEntity.entity_id]?.entity_id;
		}
	});

	/**
	 * Calls light.toggle service
	 */
	function handleClick() {
		callService($connection, 'light', 'toggle', {
			entity_id: entity?.entity_id
		});
	}

	/**
	 * Handle click selTab (color mode)
	 */
	function handleSelTabClick(mode: string) {
		selTabClicked = true;
		manualTab = mode;

		if (mode === 'white') {
			callService($connection, 'light', 'turn_on', {
				entity_id: entity?.entity_id,
				white: true
			});
		}
	}

	let options = $derived([
		{
			id: groupEntity?.entity_id,
			label: groupEntity?.entity_id
		},
		...(groupEntity?.attributes?.entity_id?.map((option: string) => ({
			id: option,
			label: option
		})) || [])
	]);
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		{#if groupEntity?.attributes?.entity_id}
			<h2>{$lang('group')}</h2>

			{#if groupEntity?.attributes?.entity_id?.length <= 2}
				<div class="button-container">
					<button
						class:selected={$states?.[groupEntity?.entity_id]?.entity_id === groupSel}
						onclick={() => {
							groupSel = $states?.[groupEntity?.entity_id]?.entity_id;
							sel = $states?.[groupEntity?.entity_id];

							// reset
							clearTimeout(timeout);
							debounce = false;
							rangeValue = brightness || 0;
						}}>{getName(undefined, groupEntity)}</button
					>
					{#each groupEntity?.attributes?.entity_id as selEntity (selEntity)}
						<button
							class:selected={$states?.[selEntity]?.entity_id === groupSel}
							onclick={() => {
								groupSel = $states?.[selEntity]?.entity_id;
								sel = $states?.[selEntity];

								// reset
								clearTimeout(timeout);
								debounce = false;
								rangeValue = brightness || 0;
							}}
						>
							{getName(undefined, $states?.[selEntity], groupEntity?.attributes?.friendly_name)}
						</button>
					{/each}
				</div>
			{:else}
				<Select
					computeIcons={true}
					{options}
					value={groupEntity?.entity_id}
					placeholder={$lang('entity')}
					onchange={(event) => {
						if (event == null) return;

						groupSel = $states?.[event]?.entity_id;
						sel = $states?.[event];

						// reset
						clearTimeout(timeout);
						debounce = false;
						rangeValue = brightness || 0;
					}}
				/>
			{/if}
		{/if}

		<!-- ONOFF -->

		<h2>{$lang('toggle')}</h2>

		<Toggle bind:checked={toggle} onchange={handleClick} />

		<!-- BRIGHTNESS -->
		{#if supports?.BRIGHTNESS}
			<h2>
				{$lang('brightness')}
				<span class="align-right">
					{Intl.NumberFormat($selectedLanguage, { style: 'percent' }).format(current / 100)}
				</span>
			</h2>
			<LightSlider {entity} {debounce} {timeout} {brightness} bind:rangeValue bind:current />
		{/if}

		<!-- COLOR -->
		{#if supports?.BRIGHTNESS}
			<h2>{$lang('change_color')}</h2>
		{/if}

		{#if colorModes?.length > 1}
			<div class="button-container">
				{#if colorModes?.includes('color_temp')}
					<button
						class:selected={selTab === 'color_temp'}
						onclick={() => handleSelTabClick('color_temp')}
						use:Ripple={$ripple}
					>
						{$lang('color_temp')}
					</button>
				{/if}

				{#if supports?.COLOR}
					<button
						class:selected={selTab === 'color'}
						onclick={() => handleSelTabClick('color')}
						use:Ripple={$ripple}
					>
						{$lang('color')}
					</button>
				{/if}

				{#if colorModes?.includes('white')}
					<button
						class:selected={selTab === 'white'}
						onclick={() => handleSelTabClick('white')}
						use:Ripple={$ripple}
					>
						{$lang('set_white')}
					</button>
				{/if}
			</div>
		{/if}

		{#if supports?.BRIGHTNESS && selTab !== 'white'}
			<ColorPicker
				{entity}
				{colorMode}
				supportedColorModes={colorModes}
				tempSelected={selTab === 'color_temp'}
				colorSelected={selTab !== 'color_temp'}
			/>
		{/if}

		<ConfigButtons />
	</Modal>
{/if}
