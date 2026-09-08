import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/*
 * Renders the review matrix. Each scene is a named setup on the page; every
 * scene is captured at each viewport, and page scenes additionally in the
 * night slot and two presets. Output: matrix-output/<scene>__<viewport>__<theme>.png
 * plus index.html, a contact sheet grouped by family.
 */

const FAKE_HASS = 'http://127.0.0.1:8125';
const OUT = 'matrix-output';

const VIEWPORTS = {
	tablet: { width: 1280, height: 800 },
	portrait: { width: 1024, height: 1366 },
	phone: { width: 390, height: 844 }
} as const;

type Viewport = keyof typeof VIEWPORTS;
type Theme = 'day' | 'night' | 'paper' | 'slate';

interface Scene {
	family: string;
	name: string;
	/** Themes beyond day; page scenes get all four. */
	themes?: Theme[];
	viewports?: Viewport[];
	fullPage?: boolean;
	setup: (page: Page) => Promise<void>;
}

async function longPress(page: Page, name: RegExp) {
	const tile = page.getByRole('button', { name }).first();
	const box = await tile.boundingBox();
	if (!box) throw new Error(`no box for ${name}`);
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(700);
	await page.mouse.up();
	await page.waitForTimeout(400);
}

async function enterEdit(page: Page) {
	await page.getByRole('button', { name: 'Edit Hearth configuration' }).click();
	await page.waitForTimeout(300);
}

async function openCardEditor(page: Page, title: string) {
	await enterEdit(page);
	await page
		.locator('.card-slot', { hasText: title })
		.first()
		.getByRole('button', { name: 'Edit' })
		.click();
	await expect(page.getByRole('dialog', { name: 'Edit card' })).toBeVisible();
	await page.waitForTimeout(600);
}

async function tapDevice(page: Page, name: RegExp) {
	await page
		.getByRole('button', { name: /Devices/ })
		.first()
		.click();
	await page.waitForTimeout(300);
	await page.getByRole('button', { name }).first().click();
	await page.waitForTimeout(600);
}

const ALL: Theme[] = ['day', 'night', 'paper', 'slate'];

const SCENES: Scene[] = [
	{ family: 'pages', name: 'living', themes: ALL, fullPage: true, setup: async () => {} },
	{
		family: 'pages',
		name: 'devices',
		themes: ALL,
		fullPage: true,
		setup: async (page) => {
			await page
				.getByRole('button', { name: /Devices/ })
				.first()
				.click();
			await page.waitForTimeout(400);
		}
	},
	{
		family: 'pages',
		name: 'living-edit',
		themes: ['day', 'night'],
		fullPage: true,
		setup: enterEdit
	},
	{ family: 'popups', name: 'light', setup: (page) => longPress(page, /Shelf lamp/) },
	{ family: 'popups', name: 'light-color', setup: (page) => longPress(page, /LED strip/) },
	{ family: 'popups', name: 'blind', setup: (page) => longPress(page, /Window blind/) },
	{ family: 'popups', name: 'fan', setup: (page) => longPress(page, /Bedroom fan/) },
	{
		family: 'popups',
		name: 'sensor',
		setup: async (page) => {
			await page.getByText('21.5').first().click();
			await page.waitForTimeout(800);
		}
	},
	{
		family: 'popups',
		name: 'media',
		setup: async (page) => {
			await page.locator('.card-slot[data-card-type="media"]').first().click();
			await page.waitForTimeout(800);
		}
	},
	{
		family: 'popups',
		name: 'popover',
		setup: async (page) => {
			await page
				.getByRole('button', { name: /Everything else/ })
				.first()
				.click();
			await page.waitForTimeout(500);
		}
	},
	{ family: 'popups', name: 'confirm-unlock', setup: (page) => tapDevice(page, /Front door lock/) },
	{
		family: 'popups',
		name: 'search',
		setup: async (page) => {
			await page.keyboard.press('f');
			await page.waitForTimeout(400);
			await page.keyboard.type('la');
			await page.waitForTimeout(400);
		}
	},
	...[
		['climate', /Living room thermostat/],
		['vacuum', /Robot vacuum/],
		['alarm', /^Alarm\b/],
		['select', /House mode/],
		['number', /Alarm volume/],
		['text', /Fridge note/],
		['datetime', /Filter changed/],
		['timer', /Laundry/],
		['counter', /Visits/],
		['update', /Home Assistant Core/],
		['humidifier', /Bedroom humidifier/],
		['water-heater', /Water heater/],
		['valve', /Main valve/],
		['lawn-mower', /Lawn mower/],
		['camera', /Front camera/],
		['image', /Floor plan/],
		['media-detail', /Kitchen speaker/]
	].map(([name, pattern]) => ({
		family: 'details',
		name: name as string,
		setup: (page: Page) => tapDevice(page, pattern as RegExp)
	})),
	...[
		'Lights',
		'Header card',
		'Inside',
		'Side by side',
		'Scenes',
		'Picture card',
		'Fusion button'
	].map((title) => ({
		family: 'edit-sheets',
		name: `card-${title.toLowerCase().replace(/\W+/g, '-')}`,
		setup: (page: Page) => openCardEditor(page, title)
	})),
	{
		family: 'edit-sheets',
		name: 'widget-chart',
		setup: async (page) => {
			await enterEdit(page);
			await page.locator('.rail-scroll').getByRole('button', { name: 'Edit' }).nth(10).click();
			await page.waitForTimeout(600);
		}
	},
	{
		family: 'edit-sheets',
		name: 'add-card-gallery',
		setup: async (page) => {
			await enterEdit(page);
			await page.getByRole('button', { name: 'Add card' }).first().click();
			await page.getByRole('button', { name: /CARD TYPE/ }).click();
			await page.waitForTimeout(400);
		}
	},
	{
		family: 'edit-sheets',
		name: 'add-widget',
		setup: async (page) => {
			await enterEdit(page);
			await page.getByRole('button', { name: 'Add widget' }).click();
			await page.waitForTimeout(600);
		}
	},
	...[
		[
			'page',
			async (page: Page) =>
				page
					.getByRole('main')
					.getByRole('button', { name: /Living room/ })
					.first()
					.click()
		],
		[
			'settings',
			async (page: Page) =>
				page.locator('.edit-bar').getByRole('button', { name: 'Settings' }).click()
		],
		[
			'theme',
			async (page: Page) => page.locator('.edit-bar').getByRole('button', { name: 'Theme' }).click()
		],
		[
			'app-settings',
			async (page: Page) => {
				await page.locator('.edit-bar').getByRole('button', { name: 'Settings' }).click();
				await page.getByRole('button', { name: /Application settings/ }).click();
			}
		],
		[
			'yaml',
			async (page: Page) => {
				await page.locator('.edit-bar').getByRole('button', { name: 'Settings' }).click();
				await page.getByRole('button', { name: /Edit configuration YAML/ }).click();
			}
		]
	].map(([name, open]) => ({
		family: 'edit-sheets',
		name: name as string,
		setup: async (page: Page) => {
			await enterEdit(page);
			await (open as (page: Page) => Promise<void>)(page);
			await page.waitForTimeout(800);
		}
	}))
];

async function applyTheme(page: Page, theme: Theme) {
	await page.request.post(`${FAKE_HASS}/_test/state`, {
		data: { entity_id: 'sun.sun', state: theme === 'night' ? 'below_horizon' : 'above_horizon' }
	});
	const query = theme === 'paper' || theme === 'slate' ? `?theme=${theme}` : '';
	await page.goto(`/${query}`);
	await expect(page.getByRole('button', { name: /Desk lamp/ })).toBeVisible();
	await page.waitForTimeout(700);
}

const captured: {
	family: string;
	name: string;
	viewport: Viewport;
	theme: Theme;
	file: string;
	error?: string;
}[] = [];

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const [viewportName, viewport] of Object.entries(VIEWPORTS) as [
	Viewport,
	{ width: number; height: number }
][]) {
	test.describe(viewportName, () => {
		test.use({ viewport, hasTouch: viewportName === 'phone', isMobile: viewportName === 'phone' });
		for (const scene of SCENES) {
			if (scene.viewports && !scene.viewports.includes(viewportName)) continue;
			for (const theme of scene.themes ?? ['day']) {
				test(`${scene.family}/${scene.name} ${theme}`, async ({ page }) => {
					const errors: string[] = [];
					page.on('pageerror', (error) => errors.push(error.message));
					await page.request.post(`${FAKE_HASS}/_test/reset`);
					await applyTheme(page, theme);
					const file = `${scene.name}__${viewportName}__${theme}.png`;
					let error: string | undefined;
					try {
						await scene.setup(page);
					} catch (failure) {
						error = (failure as Error).message.split('\n')[0];
					}
					await page.screenshot({ path: `${OUT}/${file}`, fullPage: scene.fullPage ?? false });
					if (errors.length) error = `${error ?? ''} pageerror: ${errors.join(' | ')}`.trim();
					captured.push({
						family: scene.family,
						name: scene.name,
						viewport: viewportName,
						theme,
						file,
						error
					});
				});
			}
		}
	});
}

test.afterAll(() => {
	const families = [...new Set(captured.map((entry) => entry.family))];
	const cell = (entry: (typeof captured)[number] | undefined) =>
		entry
			? `<figure class="${entry.error ? 'bad' : ''}"><a href="${entry.file}"><img loading="lazy" src="${entry.file}"></a><figcaption>${entry.viewport} / ${entry.theme}${entry.error ? `<br><b>${entry.error}</b>` : ''}</figcaption></figure>`
			: '';
	const sections = families
		.map((family) => {
			const names = [
				...new Set(captured.filter((entry) => entry.family === family).map((entry) => entry.name))
			];
			const rows = names
				.map((name) => {
					const cells = captured.filter((entry) => entry.family === family && entry.name === name);
					return `<h3 id="${family}-${name}">${name}</h3><div class="row">${cells.map(cell).join('')}</div>`;
				})
				.join('');
			return `<section><h2 id="${family}">${family}</h2>${rows}</section>`;
		})
		.join('');
	const nav = families.map((family) => `<a href="#${family}">${family}</a>`).join(' ');
	const failures = captured.filter((entry) => entry.error).length;
	writeFileSync(
		`${OUT}/index.html`,
		`<!doctype html><meta charset="utf-8"><title>Hearth matrix</title>
<style>body{font:14px system-ui;margin:24px;background:#111;color:#ddd}h2{margin-top:40px}h3{margin:24px 0 8px;font-weight:500}
.row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px}figure{margin:0;flex:none}img{max-height:420px;max-width:520px;border:1px solid #333;border-radius:6px;background:#000}
figcaption{font-size:12px;color:#999;margin-top:4px;max-width:520px}figure.bad img{border-color:#c33}figure.bad b{color:#f66}nav a{margin-right:12px}</style>
<h1>Hearth screenshot matrix</h1><p>${captured.length} captures, ${failures} with errors. Generated ${new Date().toISOString()}.</p><nav>${nav}</nav>${sections}`
	);
});
