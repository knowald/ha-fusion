<script lang="ts">
	import {
		closePopup,
		hearthConfig,
		lightViews,
		pendingEntities,
		popup,
		toggleLight
	} from './store';
	import BlindPopup from './BlindPopup.svelte';
	import FanPopup from './FanPopup.svelte';
	import Icon from './Icon.svelte';
	import LightPopup from './LightPopup.svelte';

	const meta = {
		light: { icon: 'lightbulb', sub: 'Dimmable light' },
		blind: { icon: 'blinds', sub: 'Window covering' },
		fan: { icon: 'mode_fan', sub: 'Ceiling fan' }
	};
</script>

{#if $popup}
	<div class="overlay" onclick={closePopup}>
		<div class="sheet" onclick={(event) => event.stopPropagation()}>
			<div class="header">
				<div class="icon-tile">
					<Icon name={meta[$popup.kind].icon} size={26} color="var(--h-accent-text)" />
				</div>
				<div class="titles">
					<div class="name">{$popup.name}</div>
					<div class="sub">{meta[$popup.kind].sub}</div>
				</div>
				{#if $popup.kind === 'light'}
					{@const id = $popup.id}
					{@const entity = $hearthConfig.lights.find((light) => light.id === id)?.entity}
					<div
						class="switch pressable"
						class:on={$lightViews[id]?.on}
						class:pending={entity !== undefined && $pendingEntities[entity] !== undefined}
						onclick={() => toggleLight(id)}
					>
						<div class="knob"></div>
					</div>
				{/if}
				<span class="close pressable" onclick={closePopup}>
					<Icon name="close" size={26} />
				</span>
			</div>

			{#if $popup.kind === 'light'}
				<LightPopup id={$popup.id} />
			{:else if $popup.kind === 'blind'}
				<BlindPopup id={$popup.id} />
			{:else}
				<FanPopup entity={$popup.entity} />
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 50;
		background: var(--h-overlay);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sheet {
		width: 440px;
		background: linear-gradient(180deg, var(--h-sheet-0), var(--h-sheet-1));
		border: 1px solid rgb(var(--h-accent-rgb) / 0.18);
		border-radius: var(--h-radius-xl);
		padding: 28px;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
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
		background: rgb(var(--h-accent-rgb) / 0.14);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.titles {
		flex: 1;
	}

	.name {
		font-size: 20px;
		font-weight: 600;
		color: var(--h-text-1);
	}

	.sub {
		font-size: 13px;
		color: var(--h-icon);
	}

	.switch {
		width: 52px;
		height: 30px;
		border-radius: 15px;
		cursor: pointer;
		position: relative;
		transition: background 0.2s;
		flex: none;
		background: rgb(var(--h-surface-rgb) / 0.12);
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

	.close {
		color: var(--h-icon);
		cursor: pointer;
	}
</style>
