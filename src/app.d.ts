// CSS-only packages imported for their side effect; TypeScript 6 checks
// side-effect imports by default and these ship no type declarations
declare module '@fontsource-variable/*';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
