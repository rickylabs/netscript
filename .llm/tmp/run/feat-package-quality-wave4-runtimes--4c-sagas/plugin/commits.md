# Commits — 4c-plugin (`@netscript/plugin-sagas`)

| Slice | SHA | Subject | Gates |
|-------|-----|---------|-------|
| P1 | `ed4eae9` | `chore(plugin-sagas): enumerate publish gates` | raw `deno check --unstable-kv` all 12 plugin entrypoints exits 1 in `streams/factory.ts` (`StreamStateDefinition` assignability, pending later plugin slice); raw `deno publish --dry-run --allow-dirty` exits 1 on same type error with `slow-type-count=0` |
| P2 | `bcab195` | `fix(plugin-sagas): publish contract manifest surfaces` | targeted raw `deno doc --lint mod.ts src/public/mod.ts contracts/v1/mod.ts` exits 1 with `private-type-ref-count=0`, `missing-jsdoc-count=3` (constants docs pending P6); raw `deno check --unstable-kv` all 12 plugin entrypoints exits 1 only in `streams/factory.ts` (`StreamStateDefinition` assignability, pending plugin slice) |
