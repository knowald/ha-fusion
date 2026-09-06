import { defineConfig, devices } from '@playwright/test';

const FAKE_HASS_PORT = 8125;
const APP_PORT = 5098;

/*
 * Screenshot matrix for the visual review: every Hearth surface at three
 * viewports in day and night themes, against e2e/fixture-matrix, which
 * configures every card and widget type. Run `pnpm build` first, then
 * `pnpm matrix`; open matrix-output/index.html.
 */
export default defineConfig({
	testDir: './e2e/matrix',
	testMatch: '**/*.spec.ts',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 60_000,
	expect: { timeout: 8_000 },
	reporter: 'list',
	outputDir: './matrix-output/.playwright',
	use: {
		baseURL: `http://127.0.0.1:${APP_PORT}`,
		actionTimeout: 8_000,
		trace: 'off'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: [
		{
			command: 'node e2e/fake-hass.mjs',
			port: FAKE_HASS_PORT,
			env: { FAKE_HASS_PORT: String(FAKE_HASS_PORT) },
			reuseExistingServer: false
		},
		{
			command: 'node ../../server.js',
			cwd: 'e2e/fixture-matrix',
			port: APP_PORT,
			env: {
				PORT: String(APP_PORT),
				HASS_URL: `http://127.0.0.1:${FAKE_HASS_PORT}`,
				ADDON: 'false',
				NODE_ENV: 'production'
			},
			reuseExistingServer: false
		}
	]
});
