<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import Ripple from '$lib/ui/actions/ripple';
	import { configuration } from '$lib/core/app/configuration';
	import { motion } from '$lib/core/app/motion';
	import { lang, selectedLanguage, translation } from '$lib/core/i18n';
	import { PRESS_RIPPLE } from '../config';
	import { editor } from '../store';
	import EditSheet from './EditSheet.svelte';
	import Icon from '../Icon.svelte';

	let languages = $state<{ value: string; label: string }[]>([]);
	let locale = $state($selectedLanguage || 'en');
	let reduceMotion = $state($motion === 0);
	let youtube = $state($configuration?.addons?.youtube ?? false);
	let maptilerKey = $state($configuration?.addons?.maptiler?.apikey ?? '');
	let token = $state($configuration?.token ?? '');
	let customJs = $state($configuration?.custom_js ?? false);
	let installedVersion = $state<string>();
	let saveError = $state<string | null>(null);
	let saving = $state(false);

	onMount(async () => {
		try {
			const [languageResponse, versionResponse] = await Promise.all([
				fetch(`${base}/_api/list_languages`),
				fetch(`${base}/_api/version`)
			]);
			if (languageResponse.ok) {
				const codes: string[] = await languageResponse.json();
				languages = codes.map((code) => {
					const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) || code;
					return { value: code, label: name.charAt(0).toUpperCase() + name.slice(1) };
				});
			}
			if (versionResponse.ok) installedVersion = (await versionResponse.json())?.installed;
		} catch (error) {
			console.error(error);
		}
	});

	function close() {
		editor.set(null);
	}

	function back() {
		editor.set({ kind: 'settings' });
	}

	async function done() {
		if (saving) return;
		saving = true;
		saveError = null;

		const next = {
			...($configuration ?? {}),
			locale,
			addons: {
				...($configuration?.addons ?? {}),
				youtube,
				maptiler: { ...($configuration?.addons?.maptiler ?? {}), apikey: maptilerKey }
			}
		};
		if (reduceMotion) next.motion = false;
		else delete next.motion;
		if (token.trim()) next.token = token.trim();
		else delete next.token;
		if (customJs) next.custom_js = true;
		else delete next.custom_js;

		try {
			const json: Record<string, unknown> = { ...next };
			delete json.hassUrl;
			const response = await fetch(`${base}/_api/save_config`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(json)
			});
			if (!response.ok) {
				saveError = `Save failed [${response.status}]`;
				return;
			}

			$configuration = next;
			$selectedLanguage = locale;
			$motion = reduceMotion ? 0 : 190;
			document.documentElement.lang = locale || 'en';

			const translationResponse = await fetch(`${base}/_api/get_translation`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ locale })
			});
			if (translationResponse.ok) $translation = await translationResponse.json();
			close();
		} catch (error) {
			console.error(error);
			saveError = 'Save failed';
		} finally {
			saving = false;
		}
	}

	function handleKeyFocus(event: FocusEvent) {
		const target = event.target as HTMLInputElement;
		target.type = event.type === 'focus' ? 'text' : 'password';
	}

	function openClassicDashboard() {
		location.assign(`${base}/classic`);
	}

	function handleLogout() {
		if (!confirm('Log out and clear the Home Assistant session?')) return;
		localStorage.removeItem('hassTokens');
		location.reload();
	}
</script>

<EditSheet
	title={$lang('hearth_application_settings')}
	onclose={close}
	onback={back}
	ondone={done}
	doneDisabled={saving}
>
	<div class="settings">
		<div class="section-note">{$lang('hearth_changes_are_staged_until_you_choose')}</div>
		<div class="rows">
			{#if languages.length}
				<div class="row">
					<div class="row-main"><div class="row-label">{$lang('language')}</div></div>
					<span class="select-wrap">
						<select bind:value={locale}>
							{#each languages as option (option.value)}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						<Icon name="expand_more" size={18} />
					</span>
				</div>
			{/if}
			<div class="row">
				<div class="row-main"><div class="row-label">{$lang('hearth_reduce_motion')}</div></div>
				<button
					type="button"
					class="switch pressable"
					class:on={reduceMotion}
					aria-label={$lang('hearth_reduce_motion')}
					aria-pressed={reduceMotion}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => (reduceMotion = !reduceMotion)}
				>
					<span class="knob"></span>
				</button>
			</div>
			<div class="row">
				<div class="row-main"><div class="row-label">{$lang('hearth_youtube_add_on')}</div></div>
				<button
					type="button"
					class="switch pressable"
					class:on={youtube}
					aria-label={$lang('hearth_youtube_add_on')}
					aria-pressed={youtube}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => (youtube = !youtube)}
				>
					<span class="knob"></span>
				</button>
			</div>
			<div class="row">
				<div class="row-main"><div class="row-label">{$lang('hearth_maptiler_api_key')}</div></div>
				<input
					class="inline-text"
					type="password"
					bind:value={maptilerKey}
					placeholder="API key"
					autocomplete="new-password"
					spellcheck="false"
					onfocus={handleKeyFocus}
					onblur={handleKeyFocus}
				/>
			</div>
			<div class="row">
				<div class="row-main">
					<div class="row-label">{$lang('hearth_long_lived_token')}</div>
					<div class="row-sub">{$lang('hearth_token_hint')}</div>
				</div>
				<input
					class="inline-text"
					type="password"
					bind:value={token}
					placeholder="eyJ..."
					autocomplete="new-password"
					spellcheck="false"
					onfocus={handleKeyFocus}
					onblur={handleKeyFocus}
				/>
			</div>
			<div class="row">
				<div class="row-main">
					<div class="row-label">{$lang('hearth_custom_js')}</div>
					<div class="row-sub">{$lang('hearth_custom_js_sub')}</div>
				</div>
				<button
					type="button"
					class="switch pressable"
					class:on={customJs}
					aria-label={$lang('hearth_custom_js')}
					aria-pressed={customJs}
					use:Ripple={PRESS_RIPPLE}
					onclick={() => (customJs = !customJs)}
				>
					<span class="knob"></span>
				</button>
			</div>
			<div class="row">
				<div class="row-main"><div class="row-label">{$lang('version')}</div></div>
				<span class="row-value">{installedVersion ?? $lang('hearth_loading')}</span>
			</div>
		</div>
		{#if saveError}<div class="error" role="alert">{saveError}</div>{/if}

		<div class="rows">
			<button
				type="button"
				class="row action pressable"
				onclick={() => editor.set({ kind: 'customCss' })}
			>
				<Icon name="css" size={18} />
				<div class="row-main">
					<div class="row-label">{$lang('hearth_custom_css')}</div>
					<div class="row-sub">{$lang('hearth_custom_css_sub')}</div>
				</div>
				<Icon name="chevron_right" size={20} />
			</button>
			<button type="button" class="row action pressable" onclick={openClassicDashboard}>
				<Icon name="grid_view" size={18} />
				<div class="row-main">
					<div class="row-label">{$lang('hearth_classic_dashboard')}</div>
					<div class="row-sub">{$lang('hearth_back_to_the_original_ha_fusion')}</div>
				</div>
				<Icon name="chevron_right" size={20} />
			</button>
			<button type="button" class="row action danger pressable" onclick={handleLogout}>
				<Icon name="logout" size={18} />
				<div class="row-main">
					<div class="row-label">{$lang('log_out')}</div>
					<div class="row-sub">{$lang('hearth_clears_the_home_assistant_session')}</div>
				</div>
			</button>
		</div>
	</div>
</EditSheet>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 18px;
		max-width: 560px;
		margin: 0 auto;
		width: 100%;
	}

	.section-note,
	.error {
		font-size: 12px;
		color: var(--h-text-6);
	}

	.error {
		color: var(--h-bad-text);
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
		width: 100%;
		box-sizing: border-box;
		padding: 12px 16px;
		min-height: 56px;
		border: 0;
		background: none;
		font: inherit;
		text-align: left;
		color: var(--h-icon);
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

	.row-value {
		font-size: 14px;
		color: var(--h-text-3);
	}

	.row.action {
		cursor: pointer;
	}

	.row.action.danger .row-label {
		color: var(--h-bad-text);
	}

	.select-wrap {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--h-icon);
	}

	.select-wrap :global(.mi) {
		position: absolute;
		right: 8px;
		pointer-events: none;
	}

	select,
	.inline-text {
		border: 1px solid rgb(var(--h-line-rgb) / calc(0.1 * var(--h-line-scale)));
		border-radius: var(--h-radius-xs);
		background: rgb(var(--h-surface-rgb) / calc(0.06 * var(--h-fill-scale)));
		color: var(--h-text-2);
		font: inherit;
		font-size: 14px;
		padding: 8px 12px;
		outline: none;
	}

	select {
		appearance: none;
		padding-right: 32px;
	}

	.inline-text {
		width: min(240px, 45%);
	}

	.switch {
		width: 52px;
		height: 30px;
		padding: 0;
		border: 0;
		border-radius: 15px;
		cursor: pointer;
		position: relative;
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
</style>
