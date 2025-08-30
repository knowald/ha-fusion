<script lang="ts">
	import { base } from '$app/paths';
	import { motion, lang } from '$lib/Stores';
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import CodeEditor from '$lib/Components/CodeEditor.svelte';
	import Modal from '$lib/Modal/Index.svelte';

	export let isOpen: boolean;

	let transitionend: boolean;
	let message: string | undefined;
	let success = false;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let loading = true;

	let init = '';
	let value = '';
	$: changed = init !== value;

	$: if (!changed && !success) message = undefined;

	onMount(async () => {
		try {
			const response = await fetch(`${base}/_api/custom_css`);
			if (response.ok) {
				const content = await response.json();
				init = content;
				value = content;
			} else {
				throw new Error(`Failed to load CSS file: ${response.status}`);
			}
		} catch (error) {
			displayError(error);
		} finally {
			loading = false;
		}
	});

	async function handleKeyDown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 's') {
			event.preventDefault();
			if (!changed || loading) return;
			await save(value);
		}
	}

	function displayError(error: unknown) {
		clearTimeout(timeout);
		success = false;
		message = String(error);
		console.error(error);
	}

	async function save(cssContent: string) {
		if (loading) return;

		try {
			const response = await fetch(`${base}/_api/custom_css`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: cssContent })
			});

			const data = await response.json();

			if (response.ok && data.action === 'saved') {
				// Update init to mark as saved
				init = cssContent;

				// Show success message
				clearTimeout(timeout);
				success = true;
				message = $lang('saved') + '...';

				// Inject the CSS into the document
				updateCustomCSS(cssContent);

				timeout = setTimeout(() => {
					message = undefined;
				}, 2500);
			} else {
				displayError(data.error || 'Failed to save CSS');
				throw new Error(data.error);
			}
		} catch (error) {
			displayError(error);
			console.error(error);
		}
	}

	function updateCustomCSS(cssContent: string) {
		// Remove existing custom CSS
		const existingStyle = document.getElementById('ha-fusion-custom-css');
		if (existingStyle) {
			existingStyle.remove();
		}

		// Add new custom CSS
		if (cssContent.trim()) {
			const style = document.createElement('style');
			style.id = 'ha-fusion-custom-css';
			style.textContent = cssContent;
			document.head.appendChild(style);
		}
	}
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
	<Modal size="large" on:transitionend={() => (transitionend = true)}>
		<h1 slot="title">{$lang('custom_css')}</h1>

		<br />

		{#if loading}
			<div class="loading">Loading CSS editor...</div>
		{:else}
			<CodeEditor
				{value}
				type="css"
				{init}
				{transitionend}
				autocompleteList={[]}
				on:change={(event) => {
					value = event.detail;
				}}
			/>
		{/if}

		<div class="grid">
			<div style:overflow="hidden" style:align-self="center">
				{#if message}
					<div
						class="message"
						style:color={success ? '#20df20' : 'red'}
						transition:fade={{ duration: $motion }}
					>
						{success ? message : $lang('error_save_yaml').replace('{error}', message)}
					</div>
				{/if}
			</div>

			<button
				class="done action"
				class:changed
				disabled={!changed || loading}
				style:transition="background-color {$motion / 1.5}ms ease"
				on:click={() => save(value)}
			>
				{$lang('save')}
			</button>
		</div>
	</Modal>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: 1rem;
		margin-top: 1.8rem;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 1rem;
	}

	.message {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.message:hover {
		cursor: default;
	}

	.changed {
		font-weight: 500 !important;
		color: #3b0f10 !important;
		background-color: #ffc107 !important;
	}

	.done:disabled {
		opacity: 0.5;
	}

	br {
		margin-bottom: 1rem;
	}
</style>
