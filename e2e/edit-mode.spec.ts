import { expect, test, type Page } from '@playwright/test';

/*
 * Edit-mode sweep: every card and widget type goes through its gallery entry,
 * editor and Done, and every sheet opens and closes, with the page error log
 * asserted empty at the end. Cheap insurance for the on-demand editors.
 */

const CARD_NAMES = [
	'Entities',
	'Header',
	'Sensor',
	'Media',
	'Vacuum',
	'Camera',
	'Image',
	'Climate',
	'Scenes',
	'Picture',
	'Days since',
	'Now playing',
	'Fusion'
];
const WIDGET_NAMES = [
	'Clock',
	'Weather',
	'Page navigation',
	'Search',
	'Spacer',
	'Section label',
	'Energy today',
	'Progress',
	'Calendar',
	'Status pill',
	'Entity',
	'Chart',
	'Template',
	'Timer',
	'Notifications',
	'Web page',
	'Fusion widget'
];

function collectPageErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	return errors;
}

test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: /Desk lamp/ })).toBeVisible();
	await page.getByRole('button', { name: 'Edit Hearth configuration' }).click();
});

test('every card type opens its editor and lands on the page', async ({ page }) => {
	const errors = collectPageErrors(page);
	for (const name of CARD_NAMES) {
		await page.getByRole('button', { name: 'Add card' }).click();
		const sheet = page.getByRole('dialog', { name: 'Add card' });
		await expect(sheet).toBeVisible();
		// a new card opens on the type gallery; picking a kind collapses it
		await sheet.getByRole('option', { name: new RegExp(`^${name}\\b`) }).click();
		await expect(sheet.getByRole('button', { name: /Card type/ })).toBeVisible();
		await sheet.getByRole('button', { name: 'Done' }).click();
		await expect(sheet).toBeHidden();
	}
	await expect(page.locator('.card-slot')).toHaveCount(2 + CARD_NAMES.length);
	expect(errors).toEqual([]);
});

test('every widget type opens its editor and lands in the rail', async ({ page }) => {
	const errors = collectPageErrors(page);
	for (const name of WIDGET_NAMES) {
		await page.getByRole('button', { name: 'Add widget' }).click();
		const sheet = page.getByRole('dialog', { name: 'Add widget' });
		await expect(sheet).toBeVisible();
		await sheet.getByRole('option', { name: new RegExp(`^${name}\\b`) }).click();
		await sheet.getByRole('button', { name: 'Done' }).click();
		await expect(sheet).toBeHidden();
	}
	expect(errors).toEqual([]);
});

test('pages, stacks and the settings sheets open and close', async ({ page }) => {
	const errors = collectPageErrors(page);

	await page.getByRole('button', { name: 'Add page' }).first().click();
	const pageSheet = page.getByRole('dialog', { name: 'Add page' });
	await pageSheet.getByLabel('Name').fill('Garage');
	await pageSheet.getByRole('button', { name: 'Done' }).click();
	await page
		.getByRole('button', { name: /Garage/ })
		.first()
		.click();

	await page.getByRole('button', { name: 'Add stack' }).click();
	const stackSheet = page.getByRole('dialog', { name: 'Edit stack' });
	await expect(stackSheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(stackSheet).toBeHidden();
	await expect(page.locator('.stack-slot')).toHaveCount(1);

	for (const [button, title] of [
		['Settings', 'Settings'],
		['Theme', 'Theme']
	] as const) {
		await page.getByRole('button', { name: button }).click();
		const sheet = page.getByRole('dialog', { name: title });
		await expect(sheet).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(sheet).toBeHidden();
	}

	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('button', { name: /Application settings/ }).click();
	const appSheet = page.getByRole('dialog', { name: 'Application settings' });
	await expect(appSheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(appSheet).toBeHidden();

	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('button', { name: /Edit configuration YAML/ }).click();
	const yamlSheet = page.getByRole('dialog', { name: 'Configuration YAML' });
	await expect(yamlSheet).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(yamlSheet).toBeHidden();

	await page.getByRole('button', { name: 'Undo' }).click();
	await page.getByRole('button', { name: 'Redo' }).click();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Edit Hearth configuration' })).toBeVisible();
	expect(errors).toEqual([]);
});
