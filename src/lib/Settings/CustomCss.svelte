<script lang="ts">
	import { lang, ripple } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import CustomCssModal from '$lib/Modal/CustomCssModal.svelte';
	import Ripple from 'svelte-ripple';

	async function openEditor() {
		openModal(CustomCssModal);
	}
</script>

<div class="container">
	<div>
		<h2>{$lang('custom_css')}</h2>
		<p><code>/data/custom_css.css</code></p>
	</div>

	<div style:margin-top="1.3rem">
		<button class="editor-button" on:click={openEditor} use:Ripple={$ripple}>
			{$lang('open_editor')}
		</button>
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
	}

	p {
		margin-block-end: 0.6rem;
		font-size: 0.9rem;
		opacity: 0.75;
	}

	p:hover {
		cursor: default;
	}

	code {
		font-size: 0.9rem;
		background-color: rgba(0, 0, 0, 0.2);
		padding: 0.2rem 0.4rem;
		border-radius: 0.4rem;
	}

	.editor-button {
		background-color: #4a9eff;
		color: white;
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.editor-button:hover {
		background-color: #3a8eef;
	}

	.editor-button:active {
		background-color: #2a7edf;
	}
</style>
