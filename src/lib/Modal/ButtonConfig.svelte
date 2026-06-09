<script lang="ts">
	import {
		dashboard,
		states,
		record,
		lang,
		ripple,
		history,
		historyIndex,
		templates,
		entityList
	} from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Button from '$lib/Main/Button.svelte';
	import Select from '$lib/Components/Select.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from '$lib/Actions/ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj, getDomain, getName, getTogglableService } from '$lib/Utils';
	import type { ButtonItem } from '$lib/Types';
	import { openModal } from '$lib/Modals';
	import parser from 'js-yaml';

	let { isOpen, sel = $bindable(), demo = undefined, sectionName = undefined }: {
		isOpen: boolean;
		sel: ButtonItem;
		demo?: string | undefined;
		sectionName?: string | undefined;
	} = $props();

	if (demo) {
		// replace history entry with demo
		$history.splice($historyIndex, 1);
		set('entity_id', demo);
	}

	let entity_id = $derived(sel?.entity_id);
	let name = $state(sel?.name);
	let color = $state(sel?.color);
	let icon = $state(sel?.icon);
	let stateOverride = $state(sel?.state);
	let computedIcon = $state<string>();
	let displayOnly = $state(sel?.displayOnly || false);
	let slideBrightness = $state(sel?.slide_brightness !== false);

	let options = $derived($entityList(''));

	let template = $derived($templates?.[sel?.id]);

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	onDestroy(() => $record());

	let servicePlaceholder = $state<string>();

	$effect(() => {
		if (entity_id || template?.service?.output) updateServicePlaceholder();
	});

	function updateServicePlaceholder() {
		try {
			// parse the `template.service`
			if (template?.service?.output) {
				const parsed = parser.load(template.service.output) as {
					service: string;
					data: Record<string, any>;
				};
				servicePlaceholder = parsed?.service || $lang('none');
			} else {
				// toggleService
				const service = getTogglableService($states[sel?.entity_id]);
				servicePlaceholder = service || $lang('none');
			}
		} catch {
			// error
			servicePlaceholder = $lang('error');
		}
	}

	function shouldSuggestDisplayOnly(entityId: string | undefined): boolean {
		if (!entityId) return false;

		const domain = getDomain(entityId);
		if (!domain) return false;

		// List of domains that are typically display-only
		const displayOnlyDomains = [
			'sensor',
			'binary_sensor',
			'weather',
			'sun',
			'date',
			'time',
			'person',
			'zone',
			'device_tracker'
		];

		if (displayOnlyDomains.includes(domain)) {
			return true;
		}

		if ($states[entityId] && !getTogglableService($states[entityId])) {
			return true;
		}

		return false;
	}

	let suggestDisplayOnly = $derived(shouldSuggestDisplayOnly(entity_id));
	let isLightEntity = $derived(getDomain(entity_id) === 'light');
	let isVacuumEntity = $derived(getDomain(entity_id) === 'vacuum');

	let hideBattery = $state(sel?.hide_battery || false);
	let showStatusOnButton = $state(sel?.show_status_on_button || false);
	let vacuumPlans = $state<string[]>(sel?.vacuum_plans || []);
	let vacuumRooms = $state<{ id: string; name: string }[]>(sel?.vacuum_rooms || []);
	let mopIntensityEntity = $state(sel?.vacuum_mop_intensity_entity || '');

	let newPlanEntity = $state('');
	let newRoomId = $state('');
	let newRoomName = $state('');

	function addPlan() {
		if (!newPlanEntity) return;
		vacuumPlans = [...vacuumPlans, newPlanEntity];
		set('vacuum_plans', vacuumPlans);
		newPlanEntity = '';
	}

	function removePlan(index: number) {
		vacuumPlans = vacuumPlans.filter((_, i) => i !== index);
		set('vacuum_plans', vacuumPlans.length ? vacuumPlans : undefined);
	}

	function addRoom() {
		if (!newRoomId || !newRoomName) return;
		vacuumRooms = [...vacuumRooms, { id: newRoomId, name: newRoomName }];
		set('vacuum_rooms', vacuumRooms);
		newRoomId = '';
		newRoomName = '';
	}

	function removeRoom(index: number) {
		vacuumRooms = vacuumRooms.filter((_, i) => i !== index);
		set('vacuum_rooms', vacuumRooms.length ? vacuumRooms : undefined);
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{$lang('button')}</h1>{/snippet}

		<h2>{$lang('preview')}</h2>

		<div style:pointer-events="none">
			<Button {sel} {sectionName} {displayOnly} />
		</div>

		<h2>{$lang('entity')}</h2>

		<div style="display: flex; gap: 0.8rem;">
			<div class="full-width">
				<Select
					{options}
					placeholder={$lang('entity')}
					value={entity_id}
					onchange={(event) => {
						if (event === null) return;
						set('entity_id', event);
						// Reset display-only on entity change if not already a display-only entity
						if (!shouldSuggestDisplayOnly(event)) {
							displayOnly = false;
							set('displayOnly', false);
						}
					}}
					computeIcons={true}
					getIconString={true}
					oniconString={(value) => {
						computedIcon = value;
					}}
				/>
			</div>

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={() => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'set_state'
					});
				}}
				style:padding="0.85rem"
				class:template-active={template?.set_state?.output}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" />
			</button>
		</div>

		<h2>{$lang('name')}</h2>

		<div class="icon-gallery-container">
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
					placeholder={template?.name?.output ||
						getName(sel, (entity_id && $states[entity_id]) || undefined) ||
						$lang('name')}
					autocomplete="off"
					spellcheck="false"
					bind:value={name}
					onchange={(event) => set('name', event)}
					style:padding
					disabled={Boolean(template?.name?.output)}
					class:disabled={Boolean(template?.name?.output)}
				/>
				{/snippet}
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={async () => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'name'
					});
				}}
				style:padding="0.85rem"
				class:template-active={template?.name?.output}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" /></button
			>
		</div>

		<h2>{$lang('state')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={stateOverride}
				onclear={() => {
					stateOverride = undefined;
					set('state');
				}}
			>
				{#snippet children(padding)}
				<input
					name={$lang('state')}
					class="input"
					type="text"
					placeholder={template?.state?.output ||
						(entity_id && $states?.[entity_id]?.state) ||
						$lang('state')}
					autocomplete="off"
					spellcheck="false"
					bind:value={stateOverride}
					onchange={(event) => set('state', event)}
					style:padding
					disabled={Boolean(template?.state?.output)}
					class:disabled={Boolean(template?.state?.output)}
				/>
				{/snippet}
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={async () => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'state'
					});
				}}
				style:padding="0.85rem"
				class:template-active={template?.state?.output}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" /></button
			>
		</div>

		<h2>
			{$lang('icon')}
		</h2>

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
					placeholder={(sel?.template?.icon && template?.icon?.output) ||
						computedIcon ||
						$lang('icon')}
					autocomplete="off"
					spellcheck="false"
					bind:value={icon}
					onchange={(event) => set('icon', event)}
					style:padding
					disabled={Boolean(sel?.template?.icon && template?.icon?.output)}
					class:disabled={Boolean(sel?.template?.icon && template?.icon?.output)}
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

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={() => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'icon'
					});
				}}
				style:padding="0.85rem"
				class:template-active={sel?.template?.icon && template?.icon?.output}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" /></button
			>
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
					placeholder={sel?.template?.color && template?.color?.output
						? template?.color?.output
						: $states?.[sel?.entity_id]?.attributes?.hs_color
							? `hsl(${$states?.[sel?.entity_id]?.attributes?.hs_color}%, 50%)`
							: 'rgb(75, 166, 237)'}
					autocomplete="off"
					spellcheck="false"
					bind:value={color}
					onchange={(event) => set('color', event)}
					style:padding
					disabled={Boolean(template?.color?.output) || displayOnly}
					class:disabled={Boolean(template?.color?.output) || displayOnly}
				/>
				{/snippet}
			</InputClear>

			<input
				type="color"
				bind:value={color}
				onclick={() => {
					if (color === undefined) {
						color = '#ffffff';
					}
				}}
				onchange={(event) => set('color', event)}
				title={$lang('color')}
				disabled={displayOnly}
			/>

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={() => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'color'
					});
				}}
				style:padding="0.85rem"
				class:template-active={template?.color?.output}
				class:disabled={displayOnly}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" /></button
			>
		</div>

		<!-- Display-Only Option Section -->
		<h2>{$lang('display_only') || 'Display Only'}</h2>
		<div class="button-container">
			<button
				class:selected={displayOnly}
				onclick={() => {
					displayOnly = true;
					set('displayOnly', true);
				}}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
			</button>
			<button
				class:selected={!displayOnly}
				onclick={() => {
					displayOnly = false;
					set('displayOnly', false);
				}}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>
		</div>

		{#if suggestDisplayOnly && !displayOnly}
			<div class="suggestion-box">
				<Icon
					icon="mdi:lightbulb-outline"
					height="1.5em"
					width="4em"
					style="margin-right: 0.5rem;"
				/>
				{$lang('display_only_suggestion') ||
					'This entity type is commonly used for displaying status. Consider setting it as "Display Only".'}
			</div>
		{/if}

		<!-- Slide Brightness Option - Only for Light Entities -->
		{#if isLightEntity && !displayOnly}
			<h2>{$lang('slide_brightness')}</h2>
			<div class="button-container">
				<button
					class:selected={slideBrightness}
					onclick={() => {
						slideBrightness = true;
						set('slide_brightness', true);
					}}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>
				<button
					class:selected={!slideBrightness}
					onclick={() => {
						slideBrightness = false;
						set('slide_brightness', false);
					}}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>
			</div>
		{/if}

		<h2>{$lang('service')}</h2>

		<div class="icon-gallery-container">
			<input
				name={$lang('service')}
				class="input"
				type="text"
				placeholder={servicePlaceholder}
				autocomplete="off"
				spellcheck="false"
				disabled={true}
				class:disabled={true}
			/>

			<button
				use:Ripple={$ripple}
				title={$lang('template')}
				class="icon-gallery"
				onclick={() => {
					if (!sel?.id) return;
					openModal(() => import('$lib/Modal/Templater.svelte'), {
						sel,
						type: 'service'
					});
				}}
				style:padding="0.85rem"
				class:template-active={template?.service?.output}
				class:disabled={displayOnly}
			>
				<Icon icon="ph:brackets-curly-bold" height="none" /></button
			>
		</div>

		<h2>{$lang('show_more_info')}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.more_info !== false}
				onclick={() => set('more_info')}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
			</button>

			<button
				class:selected={sel?.more_info === false}
				onclick={() => set('more_info', false)}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>
		</div>

		{#if isVacuumEntity && !displayOnly}
			<h2>{$lang('battery') || 'Battery'}</h2>
			<div class="button-container">
				<button
					class:selected={!hideBattery}
					onclick={() => {
						hideBattery = false;
						set('hide_battery');
					}}
					use:Ripple={$ripple}
				>
					{$lang('visible') || 'Visible'}
				</button>
				<button
					class:selected={hideBattery}
					onclick={() => {
						hideBattery = true;
						set('hide_battery', true);
					}}
					use:Ripple={$ripple}
				>
					{$lang('hidden') || 'Hidden'}
				</button>
			</div>

			<h2>{$lang('show_status_on_button') !== 'show_status_on_button' ? $lang('show_status_on_button') : 'Status on button'}</h2>
			<div class="button-container">
				<button
					class:selected={showStatusOnButton}
					onclick={() => {
						showStatusOnButton = true;
						set('show_status_on_button', true);
					}}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>
				<button
					class:selected={!showStatusOnButton}
					onclick={() => {
						showStatusOnButton = false;
						set('show_status_on_button');
					}}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>
			</div>

			<h2>{$lang('vacuum_plans') !== 'vacuum_plans' ? $lang('vacuum_plans') : 'Cleaning plans'}</h2>
			<div class="vacuum-list">
				{#each vacuumPlans as plan, i}
					<div class="vacuum-list-item">
						<span class="overflow">{$states[plan]?.attributes?.friendly_name || plan}</span>
						<button class="vacuum-remove-btn" onclick={() => removePlan(i)}>x</button>
					</div>
				{/each}
			</div>
			<div class="vacuum-add-row">
				<div class="full-width">
					<Select
						options={$entityList('button')}
						placeholder={$lang('add') || 'Add plan entity'}
						value={newPlanEntity}
						onchange={(event) => {
							newPlanEntity = event ?? '';
						}}
						computeIcons={true}
					/>
				</div>
				<button class="icon-gallery" onclick={addPlan} use:Ripple={$ripple} style:padding="0.85rem">
					+
				</button>
			</div>

			<h2>{$lang('rooms') !== 'rooms' ? $lang('rooms') : 'Rooms'}</h2>
			<div class="vacuum-list">
				{#each vacuumRooms as room, i}
					<div class="vacuum-list-item">
						<span class="overflow">{room.name} ({room.id})</span>
						<button class="vacuum-remove-btn" onclick={() => removeRoom(i)}>x</button>
					</div>
				{/each}
			</div>
			<div class="vacuum-add-row">
				<input
					class="input"
					type="text"
					placeholder="Room ID"
					bind:value={newRoomId}
					autocomplete="off"
				/>
				<input
					class="input"
					type="text"
					placeholder={$lang('name') || 'Name'}
					bind:value={newRoomName}
					autocomplete="off"
				/>
				<button class="icon-gallery" onclick={addRoom} use:Ripple={$ripple} style:padding="0.85rem">
					+
				</button>
			</div>

			<h2>{$lang('mop_intensity') !== 'mop_intensity' ? $lang('mop_intensity') : 'Mop intensity entity'}</h2>
			<div class="full-width">
				<Select
					options={$entityList('select')}
					placeholder={$lang('entity') || 'Select entity'}
					value={mopIntensityEntity || undefined}
					onchange={(event) => {
						mopIntensityEntity = event || '';
						set('vacuum_mop_intensity_entity', event || undefined);
					}}
					computeIcons={true}
				/>
			</div>
		{/if}

		{#if getDomain(entity_id) === 'media_player'}
			<h2>Marquee</h2>

			<div class="button-container">
				<button
					class:selected={!sel?.marquee}
					onclick={() => set('marquee', false)}
					use:Ripple={$ripple}
				>
					{$lang('no')}
				</button>

				<button
					class:selected={sel?.marquee}
					onclick={() => set('marquee', true)}
					use:Ripple={$ripple}
				>
					{$lang('yes')}
				</button>
			</div>
		{/if}

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

	.template-active {
		color: rgb(59, 15, 16) !important;
		background-color: rgb(255, 193, 7) !important;
	}

	.disabled {
		opacity: 0.4;
	}

	.full-width {
		width: -webkit-fill-available;
		width: -moz-available;
	}

	.suggestion-box {
		display: flex;
		align-items: center;
		background-color: rgba(255, 193, 7, 0.2);
		border-left: 3px solid rgb(255, 193, 7);
		padding: 0.7rem 1rem;
		margin: 0.5rem 0 1.5rem 0;
		border-radius: 0.3rem;
		font-size: 0.9rem;
	}

	.vacuum-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}

	.vacuum-list-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.7rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.4rem;
		font-size: 0.85rem;
	}

	.vacuum-remove-btn {
		background: none;
		border: none;
		color: #e53935;
		cursor: pointer;
		font-size: 1rem;
		padding: 0 0.3rem;
		font-family: inherit;
	}

	.vacuum-add-row {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}
</style>
