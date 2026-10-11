<script lang="ts">
	import type { VisibilityCondition } from '../config';
	import Icon from '../Icon.svelte';
	import EntityField from './EntityField.svelte';
	import SelectField from './SelectField.svelte';
	import TextField from './TextField.svelte';

	let { value = $bindable([]) }: { value?: VisibilityCondition[] } = $props();

	const TYPE_OPTIONS = [
		{ value: 'entity', label: 'Entity state' },
		{ value: 'media', label: 'Media query' }
	];

	function rowType(condition: VisibilityCondition): 'entity' | 'media' {
		return 'media' in condition ? 'media' : 'entity';
	}

	function setRowType(index: number, type: string) {
		value[index] = type === 'media' ? { media: '' } : { entity: '', state: '' };
	}

	function entityValue(index: number): string {
		const condition = value[index];
		return 'entity' in condition ? condition.entity : '';
	}

	function setEntity(index: number, entity: string) {
		const condition = value[index];
		if ('entity' in condition) condition.entity = entity;
	}

	// entity conditions collapse `state`/`state_not` into a single text field
	// plus the "must not match" toggle - a row only ever sets one of the two
	function stateValue(index: number): string {
		const condition = value[index];
		return 'entity' in condition ? (condition.state ?? condition.state_not ?? '') : '';
	}

	function isStateNot(index: number): boolean {
		const condition = value[index];
		return 'entity' in condition && condition.state_not !== undefined;
	}

	function setState(index: number, text: string) {
		const condition = value[index];
		if (!('entity' in condition)) return;
		if (isStateNot(index)) condition.state_not = text;
		else condition.state = text;
	}

	function setStateNot(index: number, notMatch: boolean) {
		const condition = value[index];
		if (!('entity' in condition)) return;
		const text = condition.state ?? condition.state_not ?? '';
		delete condition.state;
		delete condition.state_not;
		if (notMatch) condition.state_not = text;
		else condition.state = text;
	}

	function mediaValue(index: number): string {
		const condition = value[index];
		return 'media' in condition ? condition.media : '';
	}

	function setMedia(index: number, media: string) {
		const condition = value[index];
		if ('media' in condition) condition.media = media;
	}

	function addRow() {
		value.push({ entity: '', state: '' });
	}

	function removeRow(index: number) {
		value.splice(index, 1);
	}
</script>

<div class="group-label">VISIBILITY</div>
{#each value as condition, index (index)}
	<div class="visibility-row">
		<div class="visibility-fields">
			<SelectField
				label="Condition type"
				value={rowType(condition)}
				options={TYPE_OPTIONS}
				onchange={(type) => setRowType(index, type)}
			/>
			{#if rowType(condition) === 'entity'}
				<EntityField
					label="Entity"
					bind:value={() => entityValue(index), (entity) => setEntity(index, entity)}
				/>
				<TextField
					label="State"
					placeholder="on"
					bind:value={() => stateValue(index), (state) => setState(index, state)}
				/>
				<label class="check">
					<input
						type="checkbox"
						checked={isStateNot(index)}
						onchange={(event) => setStateNot(index, event.currentTarget.checked)}
					/>
					<span>Must not match</span>
				</label>
			{:else}
				<TextField
					label="Media query"
					placeholder="(max-width: 700px)"
					bind:value={() => mediaValue(index), (media) => setMedia(index, media)}
				/>
			{/if}
		</div>
		<span class="remove" onclick={() => removeRow(index)}>
			<Icon name="delete" size={20} />
		</span>
	</div>
{/each}
<div class="add-row" onclick={addRow}>
	<Icon name="add" size={18} />
	<span>Add condition</span>
</div>

<style>
	.group-label {
		font-family: var(--h-font-mono);
		font-size: 11px;
		letter-spacing: 2px;
		color: var(--h-label);
		margin: 18px 0 10px;
	}

	.visibility-row {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 12px 0;
		border-radius: var(--h-radius-sm);
		background: var(--h-inset);
		margin-bottom: 10px;
	}

	.visibility-fields {
		flex: 1;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--h-text-3);
		margin: -4px 0 14px;
		cursor: pointer;
	}

	.check input {
		accent-color: var(--h-accent-deep);
		width: 16px;
		height: 16px;
	}

	.remove {
		color: var(--h-icon);
		cursor: pointer;
		margin-top: 32px;
	}

	.remove:hover {
		color: var(--h-bad-text);
	}

	.add-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px;
		border-radius: var(--h-radius-xs);
		border: 1px dashed rgb(var(--h-line-rgb) / calc(0.15 * var(--h-line-scale)));
		color: var(--h-text-6);
		font-size: 14px;
		cursor: pointer;
	}

	.add-row:hover {
		color: var(--h-text-4);
	}
</style>
