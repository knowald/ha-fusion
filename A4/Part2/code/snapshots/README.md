# Part 2 source snapshots

- `Change1/src/` is the source tree at commit `b2731a34870bcb79090327234341e431b3c24b28`.
- `Change2/src/` is the source tree at commit `3eb21fc061b3aefa339ae9b9f92cd51f68c4b567`.
- The cumulative source after Change3 is `../src/`, corresponding to commit `632f01bd326e09841d0279fbf5f3ca33c1e4940f`; provenance is in `../evolved_source_provenance.md`.

These copies preserve the source used for version-specific pattern locations and isolated metric measurements. They omit `.git`, dependency folders, local environment files, and generated build output.
- `../src/` is the final CH03 source. Identify it by commit `632f01bd326e09841d0279fbf5f3ca33c1e4940f` and its independent manifest in `Change3_snapshot.sha256`; `Change3_SHA256SUMS` lists every hashed source file.
