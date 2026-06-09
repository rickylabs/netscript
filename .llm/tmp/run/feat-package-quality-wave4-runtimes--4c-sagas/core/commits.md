# Commits — 4c-core (`@netscript/plugin-sagas-core`)

| Slice | SHA | Subject | Gates |
|-------|-----|---------|-------|
| C1 | `50d17a5` | `chore(sagas-core): declare runtime package gates` | raw `deno check --unstable-kv` all 19 entrypoints PASS; `deno task test` PASS, 17 passed / 0 failed |
| C2 | `4295c3c` | `fix(sagas-core): publish builder config type contracts` | raw `deno doc --lint mod.ts src/builders/mod.ts src/config/mod.ts src/agent/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C3 | `172f42d` | `fix(sagas-core): publish contract stream type surfaces` | raw `deno doc --lint src/contracts/v1/mod.ts src/domain/mod.ts src/streams/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
