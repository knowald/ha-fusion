import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		plugins: [svelteTesting()],
		test: {
			include: ['src/**/*.test.ts'],
			// the browser resolve condition from svelteTesting() needs a DOM even for
			// store-only tests, since Svelte's client runtime touches window on import
			environment: 'jsdom',
			setupFiles: ['./vitest.setup.ts'],
			coverage: {
				provider: 'v8',
				include: ['src/lib/{Hearth,ui,core}/**/*.{ts,svelte}'],
				exclude: ['**/*.test.ts', '**/*.d.ts'],
				reporter: ['text-summary'],
				// a floor, not a target: raise it as coverage grows, never lower it
				thresholds: {
					lines: 15,
					functions: 11,
					branches: 14,
					statements: 13
				}
			}
		}
	})
);
