# legacy/bridge

The only files outside `src/lib/legacy` may import from. Every module here
wraps one legacy capability Hearth still depends on. Retiring a legacy feature
means deleting its bridge entry; `scripts/check-boundaries.mjs` fails on any
other import into `src/lib/legacy`.
