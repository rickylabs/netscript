# Commits — 4c-core (`@netscript/plugin-sagas-core`)

| Slice | SHA | Subject | Gates |
|-------|-----|---------|-------|
| C1 | `50d17a5` | `chore(sagas-core): declare runtime package gates` | raw `deno check --unstable-kv` all 19 entrypoints PASS; `deno task test` PASS, 17 passed / 0 failed |
| C2 | `4295c3c` | `fix(sagas-core): publish builder config type contracts` | raw `deno doc --lint mod.ts src/builders/mod.ts src/config/mod.ts src/agent/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C3 | `172f42d` | `fix(sagas-core): publish contract stream type surfaces` | raw `deno doc --lint src/contracts/v1/mod.ts src/domain/mod.ts src/streams/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C4 | `9226dcc` | `fix(sagas-core): publish integration boundary types` | raw `deno doc --lint src/integration/workers/mod.ts src/integration/publisher/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C5 | `0ea4771` | `fix(sagas-core): publish port boundary contracts` | raw `deno doc --lint src/ports/mod.ts` PASS; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C6 | `64711a1` | `fix(sagas-core): publish runtime boundary contracts` | raw `deno doc --lint src/runtime/mod.ts` exit 1 with `private-type-ref-count=0` and 53 C11 `missing-jsdoc` errors remaining; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C7 | `1a3a0f0` | `fix(sagas-core): publish adapter middleware preset contracts` | raw `deno doc --lint src/adapters/mod.ts src/middleware/mod.ts src/presets/mod.ts` exit 1 with `private-type-ref-count=0` and 69 later-slice `missing-jsdoc` errors remaining; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C8 | `89de256` | `fix(sagas-core): publish transport store boundary contracts` | raw `deno doc --lint src/transports/mod.ts src/stores/mod.ts` exit 1 with `private-type-ref-count=0` and C12 `missing-jsdoc` errors remaining; raw `deno check --unstable-kv` all 19 entrypoints PASS |
| C9 | `2fcc508` | `fix(sagas-core): publish abstract testing contracts` | raw `deno doc --lint src/abstracts/mod.ts src/testing/mod.ts` exit 1 with `private-type-ref-count=0` and later-slice `missing-jsdoc` errors remaining; raw `deno check --unstable-kv` all 19 entrypoints PASS |
