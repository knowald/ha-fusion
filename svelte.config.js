import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter()
	},
	typescript: {
		config(config) {
			config.include.push('../global.d.ts');
		}
	},
	// the original dashboard predates keyboard support and is being retired;
	// hearth and ui components are held to the full a11y rule set by
	// scripts/check-hearth-a11y.mjs
	onwarn(warning, defaultHandler) {
		if (warning.code.startsWith('a11y') && warning.filename?.includes('/src/lib/legacy/')) return;
		defaultHandler(warning);
	},
	vitePlugin: {
		// our components are fully migrated; fail compilation on legacy syntax,
		// but leave node_modules deps (e.g. svelte-tiny-virtual-list) in legacy mode
		dynamicCompileOptions({ filename }) {
			if (!filename.includes('node_modules')) {
				return { runes: true };
			}
		},
		// dev inspector
		inspector: {
			toggleKeyCombo: 'control-shift',
			showToggleButton: 'never'
		}
	}
};

export default config;
