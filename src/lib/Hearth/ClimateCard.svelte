<script lang="ts">
	import Ripple from '$lib/Actions/ripple';
	import { config, states } from '$lib/Stores';
	import { PRESS_RIPPLE } from './config';
	import type { OverviewCard } from './config';
	import {
		hearthEditMode,
		pendingEntities,
		setClimateHvacMode,
		setClimateTemperature
	} from './store';
	import { openEntityModal } from './modals';
	import Icon from './Icon.svelte';
	import TuneButton from './TuneButton.svelte';

	let { card }: { card: Extract<OverviewCard, { type: 'climate' }> } = $props();

	const HVAC_MODE_ICONS: Record<string, string> = {
		off: 'power_settings_new',
		heat: 'local_fire_department',
		cool: 'ac_unit',
		heat_cool: 'sync_alt',
		auto: 'autorenew',
		dry: 'water_drop',
		fan_only: 'mode_fan'
	};

	let entity = $derived(card.entity ? $states?.[card.entity] : undefined);
	let attributes = $derived(entity?.attributes ?? {});
	let pending = $derived(card.entity !== undefined && $pendingEntities[card.entity] !== undefined);
	let unit = $derived($config?.unit_system?.temperature ?? '°');

	let current = $derived(
		typeof attributes.current_temperature === 'number' ? attributes.current_temperature : null
	);
	let target = $derived(typeof attributes.temperature === 'number' ? attributes.temperature : null);
	let step = $derived(attributes.target_temp_step ?? 0.5);
	let hvacModes = $derived<string[]>(
		Array.isArray(attributes.hvac_modes) ? attributes.hvac_modes : []
	);

	let hint = $derived.by(() => {
		const raw = attributes.hvac_action ?? entity?.state;
		if (!raw) return '';
		const text = String(raw).replace(/_/g, ' ');
		return text.charAt(0).toUpperCase() + text.slice(1);
	});

	// rapid taps step from the optimistic value, not the last HA-confirmed one
	let localTarget = $state<number | null>(null);
	let localTargetTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		void target;
		localTarget = null;
	});

	let displayTarget = $derived(localTarget ?? target);

	function stepTarget(direction: number) {
		if (!card.entity || displayTarget === null) return;
		const min = attributes.min_temp ?? 7;
		const max = attributes.max_temp ?? 35;
		// steps like 0.5 accumulate float noise, snap to one decimal
		const next = Math.round((displayTarget + direction * step) * 10) / 10;
		const clamped = Math.max(min, Math.min(max, next));
		localTarget = clamped;
		clearTimeout(localTargetTimer);
		localTargetTimer = setTimeout(() => (localTarget = null), 5000);
		setClimateTemperature(card.entity, clamped);
	}
</script>

<div class="card">
	<div class="header">
		<div class="title">{card.title ?? 'Climate'}</div>
		<div class="header-side">
			{#if hint}
				<span class="hint">{hint}</span>
			{/if}
			{#if card.entity && !$hearthEditMode}
				<TuneButton onopen={() => card.entity && openEntityModal(card.entity)} />
			{/if}
		</div>
	</div>
	{#if card.entity}
		<div class="body" class:pending>
			<div class="readout">
				<div class="stat">
					<div class="stat-label">Current</div>
					<div class="current-value">
						{current === null ? '-' : current.toFixed(1)}<span class="stat-unit">{unit}</span>
					</div>
				</div>
				<div class="stat">
					<div class="stat-label">Target</div>
					<div class="stepper">
						<span class="step pressable" use:Ripple={PRESS_RIPPLE} onclick={() => stepTarget(-1)}>
							<Icon name="remove" size={18} />
						</span>
						<span class="target-value"
							>{displayTarget === null ? '-' : displayTarget.toFixed(1)}</span
						>
						<span class="step pressable" use:Ripple={PRESS_RIPPLE} onclick={() => stepTarget(1)}>
							<Icon name="add" size={18} />
						</span>
					</div>
				</div>
			</div>
			{#if hvacModes.length}
				<div class="modes">
					{#each hvacModes as mode (mode)}
						<span
							class="mode pressable"
							class:active={entity?.state === mode}
							title={mode}
							use:Ripple={PRESS_RIPPLE}
							onclick={() => card.entity && setClimateHvacMode(card.entity, mode)}
						>
							<Icon name={HVAC_MODE_ICONS[mode] ?? 'thermostat'} size={19} />
						</span>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="placeholder">Pick a climate entity in the card editor</div>
	{/if}
</div>

<style>
	.card {
		padding: 20px;
		border-radius: var(--h-radius-lg);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
	}

	.header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.title {
		font-size: 19px;
		font-weight: 600;
		color: var(--h-text-2);
	}

	.header-side {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.hint {
		font-size: 13px;
		color: var(--h-text-5);
	}

	.readout {
		display: flex;
		gap: 14px;
		margin-top: 16px;
	}

	.stat {
		flex: 1;
		padding: 14px;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
	}

	.stat-label {
		font-size: 13px;
		color: var(--h-text-4);
	}

	.current-value {
		font-size: 34px;
		font-weight: 600;
		color: var(--h-text-1);
		margin-top: 4px;
	}

	.stat-unit {
		font-size: 15px;
		color: var(--h-text-5);
		font-weight: 400;
		margin-left: 2px;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 6px;
	}

	.step {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.08);
		color: var(--h-text-3);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.target-value {
		flex: 1;
		text-align: center;
		font-size: 22px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.modes {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	.mode {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 36px;
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / 0.05);
		border: 1px solid rgb(var(--h-surface-rgb) / 0.07);
		color: var(--h-icon-dim);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
	}

	.mode.active {
		background: rgb(var(--h-accent-rgb) / 0.14);
		border-color: rgb(var(--h-accent-rgb) / 0.32);
		color: var(--h-accent-bright);
	}

	.placeholder {
		margin-top: 16px;
		padding: 22px;
		border-radius: var(--h-radius-md);
		border: 1px dashed rgb(var(--h-surface-rgb) / 0.15);
		color: var(--h-text-6);
		font-size: 14px;
		text-align: center;
	}
</style>
