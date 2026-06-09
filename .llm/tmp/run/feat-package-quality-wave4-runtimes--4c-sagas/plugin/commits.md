# Commits — 4c-plugin (`@netscript/plugin-sagas`)

| Slice | SHA | Subject | Gates |
|-------|-----|---------|-------|
| P1 | `ed4eae9` | `chore(plugin-sagas): enumerate publish gates` | raw `deno check --unstable-kv` all 12 plugin entrypoints exits 1 in `streams/factory.ts` (`StreamStateDefinition` assignability, pending later plugin slice); raw `deno publish --dry-run --allow-dirty` exits 1 on same type error with `slow-type-count=0` |
