# Worklog — sagas-prisma-store

## Design

### Public surface

- `plugins/sagas/src/runtime/prisma-saga-store.ts` exports `PrismaSagaStore` and `PrismaSagaStoreOptions`.
- `plugins/sagas/src/runtime/create-durable-saga-runtime.ts` keeps the zero-argument KV-compatible factory and extends options with `backend?: 'kv' | 'prisma'`, `prisma?: PrismaSagaStoreClient`, and `dispose()`.
- `plugins/sagas/src/runtime/saga-store-backend.ts` owns backend constants and config resolution for env/appsettings callers.
- `@netscript/cli` plugin add gains a saga-only backend option that writes appsettings metadata for generated official saga plugins.

### Domain vocabulary

- Saga store backend: `kv | prisma`.
- Durable schema models: `SagaRuntimeState`, `SagaRuntimeTransition`, `SagaRuntimeCorrelation`.
- Prisma adapter delegates: state, transition, correlation delegates plus `$transaction`.

### Ports

- Consumed unchanged: `SagaStorePort` from `@netscript/plugin-sagas-core/runtime`.
- Consumed host DB seam: `ctx.db.getClient()` / `DatabaseAdapter.getClient()` supplies the Prisma client.
- No new core port; Prisma `SagaIdempotencyPort` is deferred.

### Constants

- `SAGA_STORE_BACKENDS = ['kv', 'prisma']`.
- `DEFAULT_SAGA_STORE_BACKEND = 'kv'` only for back-compatible zero-arg runtime creation.
- `NETSCRIPT_SAGA_STORE` selects `kv | prisma` for env-backed composition.
- Appsettings path: `sagas.store.backend` on service/background plugin entries.

### Commit slices

1. `feat(sagas): dedicated Prisma durable saga schema models` — schema only; gate: schema review plus scoped fmt/check where possible.
2. `feat(sagas): PrismaSagaStore implements SagaStorePort` — adapter and tests; gate: focused runtime tests.
3. `refactor(sagas): backend-select dispose durable runtime` — runtime seam and teardown; gate: focused durable runtime/supervisor tests.
4. `feat(sagas): env appsettings saga-store backend selection` — service composition config and tests; gate: focused service/runtime checks.
5. `feat(cli): saga-store backend scaffold option` — CLI option/appsettings wiring and tests; gate: CLI focused tests.
6. `docs(sagas): Postgres durable backend parity` — docs, drift/debt/context; gate: docs review plus final selected gates including F-13 and `scaffold.runtime`.

### Deferred scope

- Prisma `SagaIdempotencyPort` parity is deferred and will be recorded in drift/debt. KV remains the idempotency/applied-key backend for this slice.
- Existing projection tables are not migrated or reused as the durable write path.
- `@netscript/plugin-sagas-core` public contracts remain unchanged.

### Contributor path

- Add or inspect backend variants in `plugins/sagas/src/runtime/saga-store-backend.ts`.
- Add durable adapter behavior beside `KvSagaStore` in `plugins/sagas/src/runtime/`.
- Add scaffold-facing options through `AddPluginInput` and appsettings entry builders, keeping official plugin copy metadata as the source for first-party plugin defaults.

## Activity

| Time | Note |
| --- | --- |
| 2026-06-20 | Loaded brief, plan, research, plan-meta, PLAN-EVAL, doctrine, harness gates, and ground-truth saga/runtime/database/CLI files. |
| 2026-06-20 | Rebased `feat/prime-time/sagas-prisma-store` from `4e2d3dd1` to umbrella tip `6e0346cf`. Pre-existing dirty OpenHands request artifacts are line-ending-only and intentionally excluded from slice commits. |
| 2026-06-20 | Slice 1 added dedicated `SagaRuntimeState`, `SagaRuntimeTransition`, and `SagaRuntimeCorrelation` Prisma models in `plugins/sagas/database/sagas.prisma`. |
| 2026-06-20 | Slice 2 added `PrismaSagaStore` plus parity tests for state round-trip, correlation lookup, transition ordering, stale-version error parity, and delete cascade. |
| 2026-06-20 | Slice 3 refactored `createDurableSagaRuntime` to support KV/Prisma backend selection, optional `kv`, and `dispose()`; service and supervisor teardown now use `dispose()`. |
| 2026-06-20 | Slice 4 added explicit saga-store backend resolution from `NETSCRIPT_SAGA_STORE` or appsettings `sagas.store.backend`, and wired service startup to choose KV or Prisma state storage. |
| 2026-06-20 | Slice 5 added `--saga-store-backend kv|prisma` to public/local plugin add commands and writes explicit saga backend appsettings for saga plugin entries. |

## Gate Evidence

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Diff scope | PASS | `rtk git diff -- plugins/sagas/database/sagas.prisma .../worklog.md` showed only the schema addition and harness worklog. |
| 1 | Prisma schema fmt wrapper | NON_BLOCKING_UNSUPPORTED | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/sagas/database --ext prisma` selected 1 file but `deno fmt --check` exited 1 with no findings; Deno fmt is not useful evidence for `.prisma`. |
| 2 | Focused unit test | PASS | `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/prisma-saga-store_test.ts` — 5 passed, 0 failed. |
| 2 | Focused type check | PASS | `deno check --unstable-kv plugins/sagas/src/runtime/prisma-saga-store.ts plugins/sagas/src/runtime/prisma-saga-store_test.ts` — passed. |
| 3 | Durable runtime tests | PASS | `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts plugins/sagas/src/runtime/durable-saga-restart_test.ts` — 6 passed, 0 failed. |
| 3 | Supervisor teardown test | PASS | `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/saga-supervisor_test.ts` — 1 passed, 0 failed. |
| 3 | Focused type check | PASS | `deno check --unstable-kv plugins/sagas/src/runtime/create-durable-saga-runtime.ts plugins/sagas/src/runtime/mod.ts plugins/sagas/services/src/main.ts plugins/sagas/src/runtime/saga-supervisor.ts plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts` — passed. |
| 4 | Backend resolver tests | PASS | `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/saga-store-backend_test.ts` — 5 passed, 0 failed. |
| 4 | Focused type check | PASS | `deno check --unstable-kv plugins/sagas/src/runtime/saga-store-backend.ts plugins/sagas/src/runtime/saga-store-backend_test.ts plugins/sagas/services/src/main.ts plugins/sagas/src/runtime/mod.ts` — passed. |
| 5 | Focused CLI tests | PASS | `rtk proxy deno test --allow-all packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts packages/cli/src/local/features/plugins/add/add-local-plugin_test.ts packages/cli/src/public/features/plugins/add/add-plugin_test.ts` — 9 passed, 0 failed. |
| 5 | Focused CLI type check | PASS | `deno check --unstable-kv packages/cli/src/kernel/domain/plugin-kind.ts packages/cli/src/public/domain/plugin-add-plan.ts packages/cli/src/public/features/plugins/add/add-plugin-command.ts packages/cli/src/local/features/plugins/add/add-local-plugin-command.ts packages/cli/src/public/features/plugins/add/plan-plugin-add.ts packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts packages/cli/src/public/features/plugins/add/add-plugin.ts packages/cli/src/local/features/plugins/add/add-local-plugin.ts` — passed. |
