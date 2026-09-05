<script lang="ts">
	import type { WidgetEditorProps } from '../types';
	import type { EnergyWidget } from './descriptor';
	import EntityField from '../../edit/EntityField.svelte';
	import TextField from '../../edit/TextField.svelte';

	let { initial: initialProp, onchange }: WidgetEditorProps<EnergyWidget> = $props();

	// remounted per target and type, so the initial value is all the form needs
	// svelte-ignore state_referenced_locally
	const initial = initialProp;

	let entity = $state(initial?.entity ?? '');
	let price = $state(typeof initial?.price === 'number' ? String(initial.price) : '');
	let priceEntity = $state(initial?.price_entity ?? '');
	let currency = $state(initial?.currency ?? '');

	$effect(() => {
		const parsedPrice = parseFloat(price);
		onchange({
			fields: {
				entity: entity.trim() || undefined,
				price: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
				price_entity: priceEntity.trim() || undefined,
				currency: currency.trim() || undefined
			}
		});
	});
</script>

<EntityField
	label="Energy sensor (today total or increasing)"
	bind:value={entity}
	domains={['sensor']}
/>
<TextField label="Price per kWh (optional)" bind:value={price} placeholder="0.72" />
<EntityField
	label="Price entity (optional, overrides static price)"
	bind:value={priceEntity}
	domains={['sensor', 'input_number']}
/>
<TextField label="Currency label (optional)" bind:value={currency} placeholder="zł" />
