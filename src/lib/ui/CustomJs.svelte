<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';

	let script: HTMLScriptElement | undefined;
	let objectUrl: string | undefined;
	let active = true;

	onMount(async () => {
		try {
			const response = await fetch(`${base}/_api/custom_js`);
			const data = await response.json();
			// the component may be gone by the time the file arrives
			if (!active) return;

			if (response.ok) {
				script = document.createElement('script');
				const blob = new Blob([data], {
					type: 'application/javascript'
				});
				objectUrl = URL.createObjectURL(blob);
				script.src = objectUrl;
				document.head.appendChild(script);
			} else {
				throw new Error(data);
			}
		} catch (error) {
			console.error('Custom JavaScript', error);
		}
	});

	onDestroy(() => {
		active = false;
		script?.remove();
		if (objectUrl) URL.revokeObjectURL(objectUrl);
	});
</script>
