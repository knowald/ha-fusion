<script lang="ts">
	let { children = undefined, title = undefined }: { children?: any; title?: any } = $props();
</script>

{@render title?.()}
{@render children?.()}
