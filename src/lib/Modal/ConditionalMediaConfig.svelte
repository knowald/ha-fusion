<script lang="ts">
	import {
		states,
		dashboard,
		lang,
		history,
		historyIndex,
		ripple,
		motion,
		selectedLanguage
	} from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigModal from '$lib/Modal/ConfigModal.svelte';
	import { relativeTime, updateObj } from '$lib/Utils';
	import Ripple from '$lib/Actions/ripple';
	import ConditionalMedia from '$lib/Main/ConditionalMedia.svelte';
	import { slide } from 'svelte/transition';
	import InputClear from '$lib/Components/InputClear.svelte';

	let {
		isOpen,
		sel = $bindable(),
		demo = undefined
	}: {
		isOpen: boolean;
		sel: any;
		demo?: string;
	} = $props();

	const debug = false;

	let timeout = $state(sel?.timeout);

	const minExpire = 0;
	const maxExpire = 86399;
	const defaultExpire = 900;

	// fix empty media_players array
	if (!sel?.media_players) {
		$history.splice($historyIndex, 1);
		applySet('media_players', [{ entity_id: '' }]);
	}

	// script-scope equivalent of the set() the ConfigModal snippet provides
	function applySet(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	let options = $derived(genOptions($states, ''));
	let mediaPlayerOptions = $derived(genOptions($states, 'media_player.'));
	let addMediaPlayer = $derived(
		sel?.media_players?.every((item: { entity_id: string }) => item.entity_id)
	);

	function genOptions(states: any, domain: string) {
		return Object.keys(states)
			?.filter((key) => key.startsWith(domain))
			?.sort()
			?.map((key) => ({ id: key, label: key }));
	}

	// don't repeat selected entities across mutiple select
	function filterMediaPlayerOptions(active: string) {
		return mediaPlayerOptions.filter(
			(option) =>
				!sel.media_players.some(
					(entity: { entity_id: string }) => entity.entity_id === option.id
				) || option.id === active
		);
	}

	function formatPausedDuration(seconds: number) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- transient, not rendered
		const now = new Date();
		if (seconds > maxExpire) {
			now.setSeconds(now.getSeconds() + maxExpire);
		} else if (seconds > minExpire) {
			now.setSeconds(now.getSeconds() + seconds);
		}
		return relativeTime(now.toISOString(), $selectedLanguage);
	}

	function handleChange(event: any) {
		const input = event?.target?.value;

		if (input === '' && sel?.timeout) {
			timeout = sel?.timeout;
			return;
		}

		let value = Number(input);

		if (!isNaN(value)) {
			if (value < minExpire) {
				value = minExpire;
			} else if (value > maxExpire) {
				value = maxExpire;
			}

			applySet('timeout', value);
			timeout = value ?? defaultExpire;
		}
	}

	// runs before ConfigModal's own onDestroy record, so the snapshot excludes empty objects
	onDestroy(() => {
		if (sel?.media_players) {
			sel.media_players = sel.media_players.filter(
				(item: Record<string, never>) => Object.keys(item).length > 0
			);
			applySet('media_players', sel.media_players);
		}
	});
</script>

<ConfigModal
	{isOpen}
	bind:sel
	{demo}
	title={`${$lang('conditional')} ${$lang('media')?.toLocaleLowerCase()}`}
>
	{#snippet children(set)}
		<h2>{$lang('preview')}</h2>

		<div class="preview">
			<ConditionalMedia {sel} />
		</div>

		{#if options}
			<h2>{$lang('nothing_playing')}</h2>

			<Select
				computeIcons={true}
				defaultIcon="mdi:image"
				value={sel?.entity_id}
				{options}
				placeholder={$lang('entity')}
				onchange={(event) => set('entity_id', event)}
			/>
		{/if}

		<h2>{$lang('playing')}</h2>

		{#if sel?.media_players?.length}
			<div>
				{#each sel.media_players as item, index (index)}
					<div transition:slide={{ duration: $motion }}>
						<Select
							computeIcons={true}
							defaultIcon="mdi:cast"
							placeholder={$lang('media_player')}
							options={filterMediaPlayerOptions(item.entity_id)}
							value={item.entity_id || ''}
							clearable={sel?.media_players?.length > 1}
							onchange={(event) => {
								// build a new array reference so the change invalidates reactively
								const next = event
									? sel.media_players.map((player: { entity_id: string }, i: number) =>
											i === index ? { entity_id: event } : player
										)
									: sel.media_players.filter((_: unknown, i: number) => i !== index);
								set('media_players', next);
							}}
						/>

						<br />
					</div>
				{/each}

				<button
					class="options action"
					onclick={() => {
						// add empty obj
						set('media_players', [...sel.media_players, {}]);
					}}
					disabled={!addMediaPlayer}
					style:opacity={!addMediaPlayer ? '0.4' : '1'}
					style:cursor={!addMediaPlayer ? 'unset' : 'pointer'}>{$lang('add')}</button
				>
			</div>
		{/if}

		<div class="paused">
			<h2>{$lang('paused')}</h2>
			<span class="time">
				{@html formatPausedDuration(timeout ?? defaultExpire)}
			</span>
		</div>

		<InputClear
			condition={timeout !== undefined}
			onclear={() => {
				set('timeout');
				timeout = undefined;
			}}
		>
			{#snippet children(padding)}
				<input
					min={minExpire}
					max={maxExpire}
					type="number"
					class="input"
					bind:value={timeout}
					placeholder={timeout?.toString() || defaultExpire?.toString()}
					onchange={handleChange}
					autocomplete="off"
					spellcheck="false"
					style:padding
				/>
			{/snippet}
		</InputClear>

		<h2>{$lang('show_area')?.replace('{area}', $lang('time')?.toLocaleLowerCase())}</h2>

		<div class="button-container">
			<button
				class:selected={sel?.show_timeout}
				onclick={() => set('show_timeout', true)}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
			</button>

			<button
				class:selected={!sel?.show_timeout}
				onclick={() => set('show_timeout', false)}
				use:Ripple={$ripple}
			>
				{$lang('no')}
			</button>
		</div>

		<h2>Marquee</h2>

		<div class="button-container">
			<button class:selected={!sel?.marquee} onclick={() => set('marquee')} use:Ripple={$ripple}>
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

		{#if debug}
			<h2>Debug</h2>
			<pre><code>{JSON.stringify(sel, null, 2)}</code></pre>
		{/if}
	{/snippet}
</ConfigModal>

<style>
	.paused {
		display: flex;
		align-items: first baseline;
		justify-content: space-between;
	}

	.time {
		color: rgba(255, 255, 255, 0.5);
	}

	.input[type='number'] {
		color-scheme: dark;
		margin-right: 2rem;
	}

	.preview {
		width: calc(14.5rem * 2 + 0.4rem);
	}
</style>
