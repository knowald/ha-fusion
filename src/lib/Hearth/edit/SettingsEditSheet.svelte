<script lang="ts">
	import { lang } from '$lib/core/i18n';
	import { activateOnKeyboard } from '../interaction';
	import Ripple from '$lib/Actions/ripple';
	import { PRESS_RIPPLE } from '../config';
	import { editor, hearthConfig, updateConfig } from '../store';
	import EditSheet from './EditSheet.svelte';
	import Icon from '../Icon.svelte';
	import { wakeLockState } from '../wakeLock';

	let screensaver = $derived(String($hearthConfig.screensaver_minutes ?? 0));
	let screensaverDrift = $derived($hearthConfig.screensaver_drift ?? false);
	let screensaverBrightness = $derived(String($hearthConfig.screensaver_brightness ?? 32));
	let keepScreenOn = $derived($hearthConfig.keep_screen_on ?? true);
	let paddingX = $derived($hearthConfig.padding_x ?? 0);
	let paddingY = $derived($hearthConfig.padding_y ?? 0);

	const SCREENSAVER_OPTIONS = [
		{ value: '0', label: $lang('off') },
		{ value: '1', label: $lang('hearth_after_1_minute') },
		{ value: '5', label: $lang('hearth_after_5_minutes') },
		{ value: '10', label: $lang('hearth_after_10_minutes') },
		{ value: '15', label: $lang('hearth_after_15_minutes') },
		{ value: '30', label: $lang('hearth_after_30_minutes') },
		{ value: '60', label: $lang('hearth_after_1_hour') }
	];
	const SCREENSAVER_BRIGHTNESS_OPTIONS = [
		{ value: '18', label: $lang('hearth_very_dim') },
		{ value: '32', label: $lang('hearth_dim') },
		{ value: '50', label: $lang('fan_speed_medium') },
		{ value: '75', label: $lang('hearth_bright') }
	];

	function setScreensaver(value: string) {
		const minutes = parseInt(value);
		updateConfig((config) => {
			config.screensaver_minutes = minutes > 0 ? minutes : undefined;
		});
	}

	function setScreensaverDrift(enabled: boolean) {
		updateConfig((config) => {
			config.screensaver_drift = enabled ? true : undefined;
		});
	}

	function setScreensaverBrightness(value: string) {
		const brightness = parseInt(value);
		updateConfig((config) => {
			config.screensaver_brightness = brightness === 32 ? undefined : brightness;
		});
	}

	function setKeepScreenOn(enabled: boolean) {
		updateConfig((config) => {
			config.keep_screen_on = enabled ? undefined : false;
		});
	}

	function setPadding(axis: 'padding_x' | 'padding_y', value: string) {
		const pixels = Math.round(parseFloat(value));
		updateConfig((config) => {
			config[axis] = Number.isFinite(pixels) && pixels > 0 ? Math.min(pixels, 300) : undefined;
		});
	}

	function close() {
		editor.set(null);
	}
</script>

<EditSheet title={$lang('settings')} onclose={close} ondone={close}>
	<div class="settings">
		<section>
			<div class="section-title">{$lang('hearth_display_2')}</div>
			<div class="rows">
				<div class="row">
					<div class="row-main">
						<div class="row-label">{$lang('hearth_screensaver')}</div>
					</div>
					<span class="select-wrap">
						<select value={screensaver} onchange={(e) => setScreensaver(e.currentTarget.value)}>
							{#each SCREENSAVER_OPTIONS as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<Icon name="expand_more" size={18} />
					</span>
				</div>
				{#if screensaver !== '0'}
					<div class="row">
						<div class="row-main">
							<div class="row-label">{$lang('hearth_screensaver_drift')}</div>
							<div class="row-sub">{$lang('hearth_slowly_moves_the_clock_to_protect')}</div>
						</div>
						<button
							type="button"
							class="switch pressable"
							class:on={screensaverDrift}
							aria-label={$lang('hearth_screensaver_drift')}
							aria-pressed={screensaverDrift}
							use:Ripple={PRESS_RIPPLE}
							onclick={() => setScreensaverDrift(!screensaverDrift)}
						>
							<span class="knob"></span>
						</button>
					</div>
					<div class="row">
						<div class="row-main">
							<div class="row-label">{$lang('hearth_screensaver_brightness')}</div>
						</div>
						<span class="select-wrap">
							<select
								value={screensaverBrightness}
								onchange={(event) => setScreensaverBrightness(event.currentTarget.value)}
							>
								{#each SCREENSAVER_BRIGHTNESS_OPTIONS as option (option.value)}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
							<Icon name="expand_more" size={18} />
						</span>
					</div>
				{/if}
				<div class="row">
					<div class="row-main">
						<div class="row-label">{$lang('hearth_keep_screen_awake')}</div>
						<div class="row-sub">{$lang('hearth_while_the_dashboard_is_open')}</div>
					</div>
					<div
						class="switch pressable"
						class:on={keepScreenOn}
						use:Ripple={PRESS_RIPPLE}
						onclick={() => setKeepScreenOn(!keepScreenOn)}
						role="button"
						tabindex="0"
						onkeydown={(event) => activateOnKeyboard(event, () => setKeepScreenOn(!keepScreenOn))}
					>
						<div class="knob"></div>
					</div>
				</div>
				{#if keepScreenOn && ($wakeLockState === 'unsupported' || $wakeLockState === 'denied')}
					<div class="setting-warning" role="alert">
						<Icon name="warning" size={18} />
						<span>
							{#if $wakeLockState === 'unsupported'}
								{$lang('hearth_screen_wake_lock_is_unavailable_open')}
							{:else}
								{$lang('hearth_the_browser_denied_the_screen_wake')}
							{/if}
						</span>
					</div>
				{/if}
				<div class="row">
					<div class="row-main">
						<div class="row-label">{$lang('hearth_side_padding')}</div>
						<div class="row-sub">{$lang('hearth_for_screens_whose_frame_covers_the')}</div>
					</div>
					<span class="unit-input">
						<input
							type="number"
							min="0"
							max="300"
							value={paddingX}
							onchange={(event) => setPadding('padding_x', event.currentTarget.value)}
						/>
						<span class="unit">px</span>
					</span>
				</div>
				<div class="row">
					<div class="row-main">
						<div class="row-label">{$lang('hearth_top_bottom_padding')}</div>
					</div>
					<span class="unit-input">
						<input
							type="number"
							min="0"
							max="300"
							value={paddingY}
							onchange={(event) => setPadding('padding_y', event.currentTarget.value)}
						/>
						<span class="unit">px</span>
					</span>
				</div>
			</div>
		</section>

		<section>
			<div class="section-title">{$lang('hearth_advanced')}</div>
			<div class="rows">
				<div
					class="row action pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => editor.set({ kind: 'appSettings' })}
					role="button"
					tabindex="0"
					onkeydown={(event) =>
						activateOnKeyboard(event, () => editor.set({ kind: 'appSettings' }))}
				>
					<Icon name="settings_applications" size={18} />
					<div class="row-main">
						<div class="row-label">{$lang('hearth_application_settings')}</div>
						<div class="row-sub">{$lang('hearth_language_motion_add_ons_version_and')}</div>
					</div>
					<Icon name="chevron_right" size={20} />
				</div>
				<div
					class="row action pressable"
					use:Ripple={PRESS_RIPPLE}
					onclick={() => editor.set({ kind: 'code' })}
					role="button"
					tabindex="0"
					onkeydown={(event) => activateOnKeyboard(event, () => editor.set({ kind: 'code' }))}
				>
					<Icon name="code" size={18} />
					<div class="row-main">
						<div class="row-label">{$lang('hearth_edit_configuration_yaml')}</div>
						<div class="row-sub">{$lang('hearth_edits_the_whole_configuration_as_yaml')}</div>
					</div>
					<Icon name="chevron_right" size={20} />
				</div>
			</div>
		</section>
	</div>
</EditSheet>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 560px;
		margin: 0 auto;
		width: 100%;
	}

	.section-title {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 0 0 8px;
	}

	.rows {
		border-radius: var(--h-radius-sm);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.08 * var(--h-line-scale)));
		background: var(--h-track);
		overflow: hidden;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 16px;
		min-height: 56px;
	}

	.row + .row {
		border-top: 1px solid rgb(var(--h-line-rgb) / calc(0.06 * var(--h-line-scale)));
	}

	.row-main {
		flex: 1;
		min-width: 0;
	}

	.row-label {
		font-size: 14px;
		color: var(--h-text-2);
	}

	.row-sub {
		font-size: 12px;
		color: var(--h-text-6);
		margin-top: 2px;
	}

	.row.action {
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		color: var(--h-icon);
	}

	.row.action:hover {
		background: rgb(var(--h-surface-rgb) / calc(0.04 * var(--h-fill-scale)));
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
		flex: none;
		color: var(--h-icon);
	}

	.select-wrap :global(.mi) {
		position: absolute;
		right: 8px;
		pointer-events: none;
	}

	select {
		appearance: none;
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		padding: 8px 32px 8px 12px;
		outline: none;
		cursor: pointer;
	}

	select:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	option {
		background: var(--h-sheet-0);
	}

	.unit-input {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: none;
	}

	.unit {
		font-size: 13px;
		color: var(--h-text-6);
	}

	.unit-input input {
		width: 72px;
		text-align: right;
		padding: 8px 10px;
		border-radius: var(--h-radius-xs);
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		color: var(--h-text-2);
		font-family: inherit;
		font-size: 14px;
		outline: none;
	}

	.unit-input input:focus {
		border-color: rgb(var(--h-accent-rgb) / calc(0.4 * var(--h-accent-scale)));
	}

	.switch {
		width: 52px;
		height: 30px;
		border-radius: 15px;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex: none;
		background: rgb(var(--h-surface-rgb) / calc(0.12 * var(--h-fill-scale)));
	}

	.switch.on {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
	}

	.knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--h-icon);
		transition: left 0.2s;
	}

	.switch.on .knob {
		left: 25px;
		background: var(--h-on-accent);
	}

	.setting-warning {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 10px 14px;
		border-top: 1px solid rgb(var(--h-bad-rgb) / 0.22);
		background: rgb(var(--h-bad-rgb) / 0.06);
		color: var(--h-bad-text);
		font-size: 12px;
		line-height: 1.4;
	}
</style>
