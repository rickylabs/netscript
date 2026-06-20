# Context Pack — sagas-prisma-store

## Current State

- Branch: `feat/prime-time/sagas-prisma-store`
- Base: rebased to umbrella `feat/framework-prime-time` at `6e0346cf`.
- Completed slice 1: dedicated durable Prisma models added to `plugins/sagas/database/sagas.prisma`.
- Completed slice 2: `PrismaSagaStore` added with structural Prisma delegates and parity tests.
- Completed slice 3: durable runtime factory supports `backend?: 'kv' | 'prisma'`, optional `kv`, and `dispose()`; service/supervisor teardown use `dispose()`.
- Pushed slices 1-2 with explicit refspec to `origin/feat/prime-time/sagas-prisma-store`.

## Important Constraints

- Do not change `SagaStorePort`, `KvSagaStore` behavior, version pins, `packages/aspire/src/public/mod.ts`, or `scaffold-versions.ts`.
- `@prisma/client` must stay catalog-backed.
- Prisma `SagaIdempotencyPort` is deferred; KV remains the idempotency/applied-key backend.
- Final gate set must name F-13 and include `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.

## Worktree Notes

- Pre-existing OpenHands request artifacts under `.llm/tmp/run/openhands/**/request.md` remain dirty and are unrelated to this slice. They are excluded from implementation commits.

## Latest Gate Evidence

- Slice 2: `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/prisma-saga-store_test.ts` — PASS, 5 tests.
- Slice 2: `deno check --unstable-kv plugins/sagas/src/runtime/prisma-saga-store.ts plugins/sagas/src/runtime/prisma-saga-store_test.ts` — PASS.
- Slice 3: `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/create-durable-saga-runtime_test.ts plugins/sagas/src/runtime/durable-saga-restart_test.ts` — PASS, 6 tests.
- Slice 3: `rtk proxy deno test --unstable-kv --allow-all plugins/sagas/src/runtime/saga-supervisor_test.ts` — PASS, 1 test.
