// CSS-only packages imported for their side effect; TypeScript 6 checks
// side-effect imports by default and these ship no type declarations.
// Must stay script-scoped (no import/export in this file): inside a module,
// `declare module` becomes an augmentation and the pattern never registers.
declare module '@fontsource-variable/*';
