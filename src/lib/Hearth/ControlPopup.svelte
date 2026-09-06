<script lang="ts">
	import { ICON } from './iconSizes';
	import { lang } from '$lib/core/i18n';
	import { states } from '$lib/core/ha/entities';
	import { closePopup, popup } from './store';
	import { pushLayer } from '$lib/ui/layers';
	import { controlOverrides, pendingEntities } from '$lib/core/ha/commands';
	import { lightViewFor, toggleLight } from '$lib/core/domains/light';
	import BlindPopup from './BlindPopup.svelte';
	import FanPopup from './FanPopup.svelte';
	import Icon from './Icon.svelte';
	import LightPopup from './LightPopup.svelte';
	import MediaPopup from './MediaPopup.svelte';
	import SensorPopup from './SensorPopup.svelte';
	import DetailPopup from './DetailPopup.svelte';
	import { domainIcon } from '$lib/core/domains';
	import { getDomain } from '$lib/core/ha/entities';

	const meta = {
		light: { icon: 'lightbulb', sub: 'hearth_dimmable_light' },
		blind: { icon: 'blinds', sub: 'hearth_window_covering' },
		fan: { icon: 'mode_fan', sub: 'hearth_ceiling_fan' },
		media: { icon: 'music_note', sub: 'hearth_media_player' },
		sensor: { icon: 'monitoring', sub: 'hearth_last_24_hours' }
	};

	// the detail sheet takes its icon and caption from the entity's domain
	function headerFor(current: NonNullable<typeof $popup>) {
		if (current.kind !== 'detail') {
			return { icon: meta[current.kind].icon, sub: $lang(meta[current.kind].sub) };
		}
		return {
			icon: domainIcon(current.entity),
			sub: (getDomain(current.entity) ?? '').replaceAll('_', ' ')
		};
	}

	$effect(() => {
		if ($popup) return pushLayer(closePopup);
	});
</script>

{#if $popup}
	<div class="overlay" onclick={closePopup} role="presentation">
		{#if $popup.kind === 'media'}
			<!-- the media sheet is full-bleed art with its own chrome -->
			<MediaPopup entity={$popup.entity} />
		{:else}
			<div class="sheet" onclick={(event) => event.stopPropagation()} role="presentation">
				<div class="header">
					<div class="icon-tile">
						<Icon name={headerFor($popup).icon} size={ICON.tile} color="var(--h-accent-text)" />
					</div>
					<div class="titles">
						<div class="name">{$popup.name}</div>
						<div class="sub">{headerFor($popup).sub}</div>
					</div>
					{#if $popup.kind === 'light'}
						{@const entity = $popup.entity}
						<button
							type="button"
							class="switch pressable"
							class:on={lightViewFor(entity, $states, $controlOverrides).on}
							aria-label={$lang('hearth_toggle_light')}
							aria-pressed={lightViewFor(entity, $states, $controlOverrides).on}
							class:pending={$pendingEntities[entity] !== undefined}
							onclick={() => toggleLight(entity)}
						>
							<div class="knob"></div>
						</button>
					{/if}
					<button
						type="button"
						class="close pressable"
						aria-label={$lang('hearth_close')}
						onclick={closePopup}
					>
						<Icon name="close" size={ICON.tile} />
					</button>
				</div>

				{#if $popup.kind === 'light'}
					<LightPopup entity={$popup.entity} sliderUpdates={$popup.sliderUpdates} />
				{:else if $popup.kind === 'blind'}
					<BlindPopup entity={$popup.entity} sliderUpdates={$popup.sliderUpdates} />
				{:else if $popup.kind === 'sensor'}
					<SensorPopup entity={$popup.entity} />
				{:else if $popup.kind === 'detail'}
					<DetailPopup entity={$popup.entity} />
				{:else}
					<FanPopup entity={$popup.entity} />
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: var(--h-layer-popup);
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	.sheet {
		box-sizing: border-box;
		width: min(440px, 100%);
		max-height: calc(100dvh - 32px);
		overflow-y: auto;
		overscroll-behavior: contain;
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / calc(0.18 * var(--h-accent-scale)));
		border-radius: var(--h-radius-xl);
		padding: 28px;
		box-shadow: 0 40px 100px var(--h-scrim);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.icon-tile {
		width: 48px;
		height: 48px;
		border-radius: var(--h-radius-sm);
		background: rgb(var(--h-accent-rgb) / calc(0.14 * var(--h-accent-scale)));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.titles {
		flex: 1;
	}

	.name {
		font-size: var(--h-type-title);
		font-weight: 600;
		color: var(--h-text-1);
	}

	.sub {
		font-size: var(--h-type-secondary);
		color: var(--h-icon);
	}

	.switch {
		width: 52px;
		height: 30px;
		border-radius: var(--h-radius-sm);
		cursor: pointer;
		position: relative;
		transition: background var(--h-motion-base);
		flex: none;
		background: rgb(var(--h-surface-rgb) / calc(0.12 * var(--h-fill-scale)));
		border: 0;
		padding: 0;
	}

	.switch.on {
		background: linear-gradient(135deg, var(--h-accent-deep), var(--h-accent-bright));
	}

	.knob {
		position: absolute;
		top: 4px;
		left: 4px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--h-icon);
		transition: left var(--h-motion-base);
	}

	.switch.on .knob {
		left: 24px;
		background: var(--h-on-accent);
	}

	.close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--h-icon);
		cursor: pointer;
	}
	@media (max-width: 700px) {
		.overlay {
			align-items: flex-end;
			padding: 0;
		}

		.sheet {
			width: 100%;
			max-height: calc(100dvh - 24px);
			border-radius: var(--h-radius-xl) var(--h-radius-xl) 0 0;
			border-bottom: 0;
			padding: 22px 20px calc(24px + env(safe-area-inset-bottom));
		}
	}
</style>
