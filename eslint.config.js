import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
		// the rework layers are typed; the count is capped by --max-warnings in the
		// lint script and only goes down. legacy/ stays exempt until it is deleted.
		files: ['src/lib/Hearth/**', 'src/lib/ui/**', 'src/lib/core/**', 'src/routes/hearth/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		/*
		 * Temporarily disable certain rules to mitigate
		 * unnecessary distractions during development.
		 */
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'svelte/no-at-html-tags': 'off',
			// false positive on `prop = $bindable()` destructuring, core rule doesn't understand runes
			'no-useless-assignment': 'off'
		}
	}
);
