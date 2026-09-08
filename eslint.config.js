import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import noBareText from './eslint/no-bare-text.js';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		},
		rules: {
			// svelte components are typescript; tsc checks undefined names and
			// core no-undef false-positives on type-only DOM names like
			// RTCIceCandidateInit (typescript-eslint disables it for .ts files)
			'no-undef': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'test-results/', 'playwright-report/']
	},
	{
		// the original dashboard renders raw HTML in many places; it goes with legacy
		files: ['src/lib/legacy/**'],
		rules: { 'svelte/no-at-html-tags': 'off' }
	},
	{
		// user-facing copy in the rework layers goes through $lang()
		files: [
			'src/lib/Hearth/**/*.svelte',
			'src/lib/Hearth/**/*.ts',
			'src/lib/ui/**/*.svelte',
			'src/lib/ui/**/*.ts',
			'src/routes/+page.svelte'
		],
		ignores: ['**/*.test.ts', '**/testing.ts'],
		plugins: { hearth: { rules: { 'no-bare-text': noBareText } } },
		rules: { 'hearth/no-bare-text': 'error' }
	},
	{
		/*
		 * Temporarily disable certain rules to mitigate
		 * unnecessary distractions during development. Must stay above the
		 * per-layer blocks below, since later flat-config entries win.
		 */
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			// false positive on `prop = $bindable()` destructuring, core rule doesn't understand runes
			'no-useless-assignment': 'off'
		}
	},
	{
		// the rework layers are typed; the count is capped by --max-warnings in the
		// lint script and only goes down. legacy/ stays exempt until it is deleted.
		files: ['src/lib/Hearth/**', 'src/routes/+page.svelte', 'src/routes/+page.server.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		// core and ui are any-free; keep them that way
		files: ['src/lib/core/**', 'src/lib/ui/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'error'
		}
	}
);
