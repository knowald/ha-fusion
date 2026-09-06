import { expect, test } from '@playwright/test';

/* The phone layout: pages stay reachable without scrolling, sheets fit. */

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('button', { name: /Desk lamp/ })).toBeVisible();
});

test('the page strip sits at the top and switches pages without scrolling', async ({ page }) => {
	const strip = page.getByRole('navigation', { name: 'Pages' });
	await expect(strip).toBeInViewport();
	await expect(strip.getByRole('button', { name: /Office/ })).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(page.getByRole('button', { name: 'Edit Hearth configuration' })).toBeInViewport();
	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
	expect(overflow).toBe(0);
});

test('a light popup opens as a bottom sheet and the card sheet leads with its fields', async ({
	page
}) => {
	const tile = page.getByRole('button', { name: /Desk lamp/ });
	const box = (await tile.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(700);
	await page.mouse.up();
	const toggle = page.getByRole('button', { name: 'Toggle light' });
	await expect(toggle).toBeVisible();
	const sheetBox = (await page.locator('.sheet').first().boundingBox())!;
	expect(Math.round(sheetBox.x + sheetBox.width)).toBe(390);
	await page.keyboard.press('Escape');

	await page.getByRole('button', { name: 'Edit Hearth configuration' }).click();
	await page
		.locator('.card-slot', { hasText: 'Lights' })
		.getByRole('button', { name: 'Edit' })
		.click();
	const sheet = page.getByRole('dialog', { name: 'Edit card' });
	await expect(sheet).toBeVisible();
	const title = await sheet.getByLabel('Title').boundingBox();
	const preview = await sheet.locator('.pane').boundingBox();
	expect(title!.y).toBeLessThan(preview!.y);
});
