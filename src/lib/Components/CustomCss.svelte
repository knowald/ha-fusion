<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';

	let style: HTMLStyleElement;

	onMount(async () => {
		try {
			const response = await fetch(`${base}/_api/custom_css`);
			const data = await response.json();

			if (response.ok && data.trim()) {
				style = document.createElement('style');
				style.id = 'ha-fusion-custom-css';
				style.textContent = data;
				document.head.appendChild(style);
			} else if (!response.ok) {
				throw new Error(data);
			}
		} catch (error) {
			console.error('Custom CSS', error);
		}
	});

	onDestroy(() => {
		if (style) {
			document.head.removeChild(style);
		}
	});
</script>
