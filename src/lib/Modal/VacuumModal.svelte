<script lang="ts">
	import { connection, lang, states, ripple } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { getName, getSupport } from '$lib/Utils';
	import Select from '$lib/Components/Select.svelte';
	import { callService } from 'home-assistant-js-websocket';
	import Ripple from '$lib/Actions/ripple';
	import Icon from '@iconify/svelte';

	let { isOpen, sel }: { isOpen: boolean; sel: any } = $props();

	const MAX_ITEMS = 4;

	let entity = $derived($states[sel?.entity_id]);
	let entityState = $derived(entity?.state);
	let attributes = $derived(entity?.attributes);
	let supported_features = $derived(attributes?.supported_features);

	let supports = $derived(
		getSupport(supported_features, {
			TURN_ON: 1,
			TURN_OFF: 2,
			PAUSE: 4,
			STOP: 8,
			RETURN_HOME: 16,
			FAN_SPEED: 32,
			BATTERY: 64,
			STATUS: 128,
			SEND_COMMAND: 256,
			LOCATE: 512,
			CLEAN_SPOT: 1024,
			MAP: 2048,
			STATE: 4096,
			START: 8192
		})
	);

	let fanSpeedOptions = $derived(
		attributes?.fan_speed_list?.map((option: string) => ({
			id: option,
			label: $lang(option?.toLowerCase())
		}))
	);

	// battery_level may be in vacuum attributes or in a separate sensor entity
	let batteryEntity = $derived($states[sel?.entity_id?.replace('vacuum.', 'sensor.') + '_battery']);
	let batteryLevel = $derived(
		attributes?.battery_level ?? (batteryEntity ? Number(batteryEntity.state) : null)
	);
	let batteryIcon = $derived(
		batteryLevel == null
			? 'mdi:battery-unknown'
			: batteryLevel <= 10
				? 'mdi:battery-10'
				: batteryLevel <= 20
					? 'mdi:battery-20'
					: batteryLevel <= 50
						? 'mdi:battery-50'
						: batteryLevel <= 80
							? 'mdi:battery-80'
							: 'mdi:battery'
	);
	let batteryColor = $derived(
		batteryLevel == null
			? 'inherit'
			: batteryLevel <= 20
				? '#e53935'
				: batteryLevel <= 50
					? '#fb8c00'
					: '#43a047'
	);

	let statusText = $derived(getStatusText(entityState, attributes));
	let hideBattery = $derived(sel?.hide_battery || false);
	let plans = $derived((sel?.vacuum_plans as string[]) || []);
	let rooms = $derived((sel?.vacuum_rooms as { id: string; name: string }[]) || []);
	let mopIntensityEntity = $derived(sel?.vacuum_mop_intensity_entity);
	let mopEntity = $derived(mopIntensityEntity ? $states[mopIntensityEntity] : undefined);
	let mopOptions = $derived(
		mopEntity?.attributes?.options?.map((option: string) => ({
			id: option,
			label: $lang(option?.toLowerCase()) || option
		}))
	);

	function getStatusText(
		currentState: string | undefined,
		attrs: Record<string, any> | undefined
	): string {
		if (!currentState) return '';
		const translated = $lang(currentState);
		if (currentState === 'cleaning' && attrs?.cleaning_area) {
			return `${translated} - ${attrs.cleaning_area} m\u00B2`;
		}
		return translated;
	}

	function handleClick(service: string) {
		callService($connection, 'vacuum', service, {
			entity_id: entity?.entity_id
		});
	}

	function handleFanSpeedChange(fan_speed: string | undefined) {
		if (!fan_speed) return;
		callService($connection, 'vacuum', 'set_fan_speed', {
			entity_id: entity?.entity_id,
			fan_speed
		});
	}

	function handlePlanPress(planEntityId: string) {
		callService($connection, 'button', 'press', {
			entity_id: planEntityId
		});
	}

	function handleRoomClean(roomIds: string[]) {
		callService($connection, 'vacuum', 'send_command', {
			entity_id: entity?.entity_id,
			command: 'app_segment_clean',
			params: roomIds.map(Number)
		});
	}

	function handleMopIntensityChange(value: string | undefined) {
		if (!value) return;
		if (!mopIntensityEntity) return;
		callService($connection, 'select', 'select_option', {
			entity_id: mopIntensityEntity,
			option: value
		});
	}
</script>

{#if isOpen}
	<Modal>
		{#snippet title()}<h1>{getName(sel, entity)}</h1>{/snippet}

		{#if entity}
			<h2>{$lang('state')}</h2>
			<span class="status-text">{statusText}</span>

			{#if batteryLevel != null && !hideBattery}
				<h2>{$lang('battery')}</h2>
				<div class="battery-row">
					<div class="battery-icon" style="color: {batteryColor}">
						<Icon icon={batteryIcon} height="none" />
					</div>
					<div class="battery-bar-container">
						<div
							class="battery-bar"
							style="width: {batteryLevel}%; background-color: {batteryColor}"
						></div>
					</div>
					<span class="battery-text">{batteryLevel}%</span>
				</div>
			{/if}
		{/if}

		{#if plans.length > 0}
			<h2>{$lang('vacuum_plans') !== 'vacuum_plans' ? $lang('vacuum_plans') : 'Cleaning plans'}</h2>
			<div class="plans-grid">
				{#each plans as planId, i (i)}
					{@const planEntity = $states[planId]}
					<button class="plan-button" onclick={() => handlePlanPress(planId)} use:Ripple={$ripple}>
						<div class="plan-icon">
							<Icon icon="mdi:play-circle-outline" height="none" />
						</div>
						<span class="plan-label">
							{planEntity?.attributes?.friendly_name?.replace(/^.*?\s/, '') || planId}
						</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if rooms.length > 0}
			<h2>{$lang('rooms') !== 'rooms' ? $lang('rooms') : 'Rooms'}</h2>
			<div class="plans-grid">
				{#each rooms as room, i (i)}
					<button
						class="plan-button"
						onclick={() => handleRoomClean([room.id])}
						use:Ripple={$ripple}
					>
						<div class="plan-icon">
							<Icon icon="mdi:floor-plan" height="none" />
						</div>
						<span class="plan-label">{room.name}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if supports?.FAN_SPEED && fanSpeedOptions}
			<h2>{$lang('fan_speed')}</h2>

			{#if fanSpeedOptions.length <= MAX_ITEMS}
				<div class="button-container">
					{#each fanSpeedOptions as option (option.id)}
						<button
							class:selected={attributes?.fan_speed === option.id}
							onclick={() => handleFanSpeedChange(option.id)}
							use:Ripple={$ripple}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{:else}
				<Select
					options={fanSpeedOptions}
					placeholder={$lang('options')}
					value={attributes?.fan_speed}
					onchange={(event) => handleFanSpeedChange(event)}
				/>
			{/if}
		{/if}

		{#if mopEntity && mopOptions}
			<h2>
				{$lang('mop_intensity') !== 'mop_intensity' ? $lang('mop_intensity') : 'Mop intensity'}
			</h2>

			{#if mopOptions.length <= MAX_ITEMS}
				<div class="button-container">
					{#each mopOptions as option (option.id)}
						<button
							class:selected={mopEntity?.state === option.id}
							onclick={() => handleMopIntensityChange(option.id)}
							use:Ripple={$ripple}
						>
							{option.label}
						</button>
					{/each}
				</div>
			{:else}
				<Select
					options={mopOptions}
					placeholder={$lang('options')}
					value={mopEntity?.state}
					onchange={(event) => handleMopIntensityChange(event)}
				/>
			{/if}
		{/if}

		{#if supports?.TURN_ON || supports?.TURN_OFF || supports?.START || supports?.PAUSE || supports?.STOP || supports?.LOCATE || supports?.RETURN_HOME || supports?.CLEAN_SPOT}
			<h2>{$lang('vacuum_commands')?.replace(':', '')}</h2>
		{/if}

		<div class="button-container">
			{#if supports?.TURN_ON}
				<button
					title={$lang('on')}
					class:selected={entity?.state === 'on'}
					onclick={() => handleClick('turn_on')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.7);">
						<Icon icon="mdi:power-on" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.TURN_OFF}
				<button
					title={$lang('off')}
					class:selected={entity?.state === 'off'}
					onclick={() => handleClick('turn_off')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.7);">
						<Icon icon="mdi:power-off" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.START}
				<button
					title={$lang('start')}
					class:selected={entity?.state === 'cleaning'}
					onclick={() => handleClick('start')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-play-arrow" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.PAUSE}
				<button
					title={$lang('pause')}
					class:selected={entity?.state === 'paused'}
					onclick={() => handleClick('pause')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-pause" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.STOP}
				<button
					title={$lang('stop')}
					class:selected={entity?.state === 'idle'}
					onclick={() => handleClick('stop')}
					use:Ripple={$ripple}
				>
					<div class="icon">
						<Icon icon="ic:round-stop" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.CLEAN_SPOT}
				<button
					title={$lang('clean_spot') !== 'clean_spot' ? $lang('clean_spot') : 'Spot clean'}
					class:selected={false}
					onclick={() => handleClick('clean_spot')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.7);">
						<Icon icon="mdi:target-variant" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.LOCATE}
				<button title={$lang('locate')} onclick={() => handleClick('locate')} use:Ripple={$ripple}>
					<div class="icon" style="transform: scale(0.65);">
						<Icon icon="fa:search" height="none" />
					</div>
				</button>
			{/if}

			{#if supports?.RETURN_HOME}
				<button
					title={$lang('return_home')}
					class:selected={entity?.state === 'returning'}
					onclick={() => handleClick('return_to_base')}
					use:Ripple={$ripple}
				>
					<div class="icon" style="transform: scale(0.85);">
						<Icon icon="ic:round-home" height="none" />
					</div>
				</button>
			{/if}
		</div>

		<ConfigButtons />
	</Modal>
{/if}

<style>
	.button-container > button {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.icon {
		width: 1.6rem;
		height: 1.6rem;
	}

	.status-text {
		font-size: 0.95rem;
		opacity: 0.9;
	}

	.battery-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.battery-icon {
		width: 1.4rem;
		height: 1.4rem;
		flex-shrink: 0;
	}

	.battery-bar-container {
		flex: 1;
		height: 0.5rem;
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.battery-bar {
		height: 100%;
		border-radius: 0.25rem;
		transition: width 300ms ease;
	}

	.battery-text {
		font-size: 0.85rem;
		min-width: 2.5rem;
		text-align: right;
	}

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: 0.5rem;
	}

	.plan-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.8rem 0.5rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgb(100, 100, 100);
		border-radius: 0.6rem;
		color: white;
		cursor: pointer;
		font-family: inherit;
		font-size: 0.85rem;
		transition: background-color 200ms ease;
	}

	.plan-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.plan-icon {
		width: 1.6rem;
		height: 1.6rem;
	}

	.plan-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
</style>
