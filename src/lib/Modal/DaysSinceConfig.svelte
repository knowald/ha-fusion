<script lang="ts">
	import { dashboard, record, lang, ripple, history, historyIndex, connection, states } from '$lib/Stores';
	import { onDestroy } from 'svelte';
	import { callService } from 'home-assistant-js-websocket';
	import DaysSince from '$lib/Main/DaysSince.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import InputClear from '$lib/Components/InputClear.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import { updateObj } from '$lib/Utils';

	export let isOpen: boolean;
	export let sel: any;
	export let sectionName: string | undefined = undefined;

	let name: string | undefined = sel?.name;
	let icon: string | undefined = sel?.icon;
	let color: string | undefined = sel?.color;
	let entity_id: string | undefined = sel?.entity_id;

	let suggestedEntityId = '';
	let creatingEntity = false;
	let entityError = '';

	// Get current timestamp from entity or use current date
	$: entityState = entity_id ? $states?.[entity_id] : undefined;
	$: last_reset = entityState?.state;

	// Format date for input[type="date"] (YYYY-MM-DD)
	$: dateInputValue = last_reset
		? new Date(last_reset).toISOString().split('T')[0]
		: new Date().toISOString().split('T')[0];

	// Auto-generate entity_id from name
	$: if (name && !entity_id) {
		suggestedEntityId = `input_datetime.days_since_${name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '')}`;
	} else {
		suggestedEntityId = '';
	}

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event);
		$dashboard = $dashboard;
	}

	async function handleDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const dateValue = target.value;
		if (dateValue && entity_id && $connection) {
			try {
				// Convert to ISO string at midnight
				const date = new Date(dateValue + 'T00:00:00');
				await callService($connection, 'input_datetime', 'set_datetime', {
					entity_id: entity_id,
					datetime: date.toISOString().split('.')[0]
				});
			} catch (error) {
				console.error('Failed to set datetime:', error);
			}
		}
	}

	async function setToday() {
		if (entity_id && $connection) {
			try {
				const now = new Date();
				await callService($connection, 'input_datetime', 'set_datetime', {
					entity_id: entity_id,
					datetime: now.toISOString().split('.')[0]
				});
			} catch (error) {
				console.error('Failed to set datetime:', error);
			}
		}
	}

	async function createEntity() {
		if (!suggestedEntityId || !$connection) return;

		creatingEntity = true;
		entityError = '';

		try {
			// Check if entity already exists
			if ($states?.[suggestedEntityId]) {
				// Entity exists, just link it
				entity_id = suggestedEntityId;
				set('entity_id', { target: { value: entity_id } });
				return;
			}

			// Create the input_datetime entity
			await callService($connection, 'input_datetime', 'reload', {});

			// Note: Creating input_datetime via service call isn't directly supported
			// User needs to create it manually via HA UI or configuration.yaml
			entityError = 'Please create the input_datetime entity manually in Home Assistant configuration.';
		} catch (error: any) {
			console.error('Failed to create entity:', error);
			entityError = error.message || 'Failed to create entity';
		} finally {
			creatingEntity = false;
		}
	}

	function linkEntity() {
		if (suggestedEntityId) {
			entity_id = suggestedEntityId;
			set('entity_id', { target: { value: entity_id } });
		}
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('days_since') || 'Days Since'}</h1>

		<h2>{$lang('preview')}</h2>

		<div style:pointer-events="none">
			<DaysSince {sel} {sectionName} />
		</div>

		<h2>{$lang('name')}</h2>

		<InputClear
			condition={name}
			on:clear={() => {
				name = undefined;
				set('name');
			}}
			let:padding
		>
			<input
				name={$lang('name')}
				class="input"
				type="text"
				placeholder={$lang('name') || 'Name'}
				autocomplete="off"
				spellcheck="false"
				bind:value={name}
				on:change={(event) => set('name', event)}
				style:padding
			/>
		</InputClear>

		<h2>{$lang('icon')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={icon}
				on:clear={() => {
					icon = undefined;
					set('icon');
				}}
				let:padding
			>
				<input
					name={$lang('icon')}
					class="input"
					type="text"
					placeholder="mdi:calendar-clock"
					autocomplete="off"
					spellcheck="false"
					bind:value={icon}
					on:change={(event) => set('icon', event)}
					style:padding
				/>
			</InputClear>

			<button
				use:Ripple={$ripple}
				title={$lang('icon')}
				class="icon-gallery"
				on:click={() => {
					window.open('https://icon-sets.iconify.design/', '_blank');
				}}
				style:padding="0.84rem"
			>
				<Icon icon="majesticons:open-line" height="none" />
			</button>
		</div>

		<h2>{$lang('color')}</h2>

		<div class="icon-gallery-container">
			<InputClear
				condition={color}
				on:clear={() => {
					color = undefined;
					set('color');
				}}
				let:padding
			>
				<input
					name={$lang('color')}
					class="input"
					type="text"
					placeholder="rgb(75, 166, 237)"
					autocomplete="off"
					spellcheck="false"
					bind:value={color}
					on:change={(event) => set('color', event)}
					style:padding
				/>
			</InputClear>

			<input
				type="color"
				bind:value={color}
				on:click={() => {
					if (color === undefined) {
						color = '#4ba6ed';
					}
				}}
				on:change={(event) => set('color', event)}
				title={$lang('color')}
			/>
		</div>

		<h2>{$lang('entity') || 'Entity'}</h2>

		{#if !entity_id}
			<div class="entity-setup">
				<p class="entity-help">
					This counter needs an <code>input_datetime</code> entity in Home Assistant to store the
					timestamp.
				</p>

				{#if suggestedEntityId}
					<div class="suggested-entity">
						<code>{suggestedEntityId}</code>
						{#if $states?.[suggestedEntityId]}
							<button use:Ripple={$ripple} class="link-button" on:click={linkEntity}>
								<Icon icon="mdi:link" height="1.2rem" />
								<span>{$lang('use_existing') || 'Use Existing'}</span>
							</button>
						{:else}
							<p class="entity-warning">
								Entity doesn't exist. Create it in Home Assistant:
								<br />
								<strong
									>Settings → Devices & Services → Helpers → Create Helper → Date and/or
									Time</strong
								>
								<br />
								Then use entity ID: <code>{suggestedEntityId}</code>
							</p>
						{/if}
					</div>
				{/if}

				<InputClear
					condition={entity_id}
					on:clear={() => {
						entity_id = undefined;
						set('entity_id');
					}}
					let:padding
				>
					<input
						name="Entity ID"
						class="input"
						type="text"
						placeholder="input_datetime.days_since_..."
						autocomplete="off"
						spellcheck="false"
						bind:value={entity_id}
						on:change={(event) => set('entity_id', event)}
						style:padding
					/>
				</InputClear>

				{#if entityError}
					<p class="error">{entityError}</p>
				{/if}
			</div>
		{:else}
			<div class="entity-linked">
				<div class="entity-badge">
					<Icon icon="mdi:check-circle" height="1.2rem" style="color: #4caf50;" />
					<code>{entity_id}</code>
				</div>
				<button
					use:Ripple={$ripple}
					class="change-button"
					on:click={() => {
						entity_id = undefined;
						set('entity_id');
					}}
				>
					<Icon icon="mdi:swap-horizontal" height="1.2rem" />
					<span>{$lang('change') || 'Change'}</span>
				</button>
			</div>

			<h2>{$lang('last_reset_date') || 'Last Reset Date'}</h2>

			<div class="date-picker-container">
				<input
					type="date"
					class="date-input"
					value={dateInputValue}
					on:change={handleDateChange}
					disabled={!entity_id}
				/>
				<button
					use:Ripple={$ripple}
					class="today-button"
					on:click={setToday}
					title={$lang('set_to_today') || 'Set to Today'}
					disabled={!entity_id}
				>
					<Icon icon="mdi:calendar-today" height="1.3rem" />
				</button>
			</div>
		{/if}

		<h2>{$lang('description') || 'Description'}</h2>
		<p style="margin: 0; opacity: 0.7; font-size: 0.9rem;">
			{$lang('days_since_description') ||
				'Track days since a task was last completed. Click to open details and reset counter.'}
		</p>

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

	.date-picker-container {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.date-input {
		flex: 1;
		padding: 0.75rem 1rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: white;
		font-family: inherit;
		font-size: 1rem;
		color-scheme: dark;
	}

	.date-input:focus {
		outline: none;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.today-button {
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.today-button:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.today-button:disabled,
	.date-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.entity-setup {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.entity-help {
		margin: 0;
		opacity: 0.7;
		font-size: 0.9rem;
	}

	.entity-help code,
	.suggested-entity code {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 0.3rem;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
	}

	.suggested-entity {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.entity-warning {
		margin: 0.5rem 0 0 0;
		font-size: 0.85rem;
		opacity: 0.8;
		line-height: 1.5;
	}

	.link-button,
	.change-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: rgba(76, 175, 80, 0.2);
		border: 1px solid rgba(76, 175, 80, 0.4);
		border-radius: 0.5rem;
		color: white;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: inherit;
	}

	.link-button:hover {
		background-color: rgba(76, 175, 80, 0.3);
		border-color: rgba(76, 175, 80, 0.6);
	}

	.change-button {
		background-color: rgba(255, 152, 0, 0.2);
		border-color: rgba(255, 152, 0, 0.4);
	}

	.change-button:hover {
		background-color: rgba(255, 152, 0, 0.3);
		border-color: rgba(255, 152, 0, 0.6);
	}

	.entity-linked {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.entity-badge {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(76, 175, 80, 0.3);
	}

	.error {
		color: #ff5252;
		margin: 0;
		font-size: 0.9rem;
	}
</style>
