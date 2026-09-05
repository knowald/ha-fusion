import { defineConfig, devices } from '@playwright/test';

const FAKE_HASS_PORT = 8124;
const APP_PORT = 5099;

/*
 * Browser smoke tests run the production build (node server.js) from the
 * e2e/fixture directory, so the app reads that directory's data/ instead of
 * the developer's own, against the scripted Home Assistant in fake-hass.mjs.
 * Run `pnpm build` first.
 */
export default defineConfig({
	testDir: './e2e',
	testMatch: '**/*.spec.ts',
	fullyParallel: false,
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://127.0.0.1:${APP_PORT}`,
		trace: 'retain-on-failure',
		viewport: { width: 1280, height: 800 }
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
			cwd: 'e2e/fixture',
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
