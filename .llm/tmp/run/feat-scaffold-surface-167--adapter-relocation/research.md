# #172b/c/d Adapter Relocation + Primitive Migration — Research

Run-id suffix: `adapter-relocation` (same branch `feat/scaffold-surface-167`, PR #172).
Archetype: **ARCHETYPE-5** (plugin connectors) + sibling **ARCHETYPE-2/3** core packages
(`@netscript/plugin-<kind>-core`). Scope: package/plugin surface → `netscript-doctrine` + `jsr-audit`.

## Guiding principle (corrected 2026-06-30 per user)

`@netscript/plugin-<kind>-core` **should depend on NetScript primitives** (`@netscript/kv`,
`@netscript/cron`, `@netscript/watchers`, …). Relying on first-party primitives instead of
hand-rolling backends is the **encouraged** direction — it is the reference behavior we want
community plugin / plugin-core authors to copy. There is **no** rule to minimize `-core`
dependencies; adding a `@netscript/*` dep to a `-core` package is a feature of the design, not a cost
to weigh. (An earlier draft of this file invented a "minimize core deps / split adapters out" tradeoff
— that was wrong and has been removed.)

## Problem statement

Two intertwined defects in the three connectors that still ship runtime adapters under
`plugins/<kind>/src/runtime/`:

1. **Thinness violation (placement):** reusable port→backend adapters live in the connector, not in
   `-core`. The #157→#172 law puts convention-bearing primitives in `-core`; the connector keeps
   specifics only.
2. **Primitive-bypass (engine lock):** the **sagas** and **triggers** KV stores are hardwired to raw
   `Deno.Kv` / `Deno.openKv`, bypassing `@netscript/kv` — so they are **locked to the Deno KV engine**
   and forfeit Redis, in-memory, and reactive-watch that `@netscript/kv` provides for free. The
   **workers** idempotency store already does it right (depends on `@netscript/kv` types + a
   `KvStore`-shaped structural port, injected handle) and is the reference pattern.

This relocation+migration was **not** in the PASSed `feat/scaffold-surface-167` plan (that covered the
scaffold-surface contract S1–S7, not runtime-store engine choice), so it is net-new and PLAN-EVAL-gated.

## The `@netscript/kv` surface (the primitive being adopted)

`@netscript/kv` — "Reactive key-value abstraction for Redis, Deno KV, and in-memory backends":
- Engine-agnostic lifecycle: `getKv`, `getRawKv`, `getActiveProvider`, `getKvPath`, `closeKv`,
  `resetKv`, `isKvInitialized`, `getRedisConnectionFromEnv`, `type KvProvider`, `type SharedKvConfig`.
- `KvStore` interface (`packages/kv/types/kv-store.ts`, `extends AsyncDisposable`): `get<T>(key):
  Promise<KvEntry<T>|null>`, `set(key,value,opts)`, `delete(key)`, `list<T>({prefix}): AsyncIterable`
  (confirmed by the `runKvStoreContract` test exercising set/get/list/delete). Atomic types
  `AtomicCheck` (versionstamp), `AtomicMutation`, `AtomicResult` are exported for optimistic
  concurrency.
- Adapters: `DenoKvAdapter`, `MemoryKvAdapter`, and `@netscript/kv/redis`. So the engine is chosen at
  the composition root (config/env), not baked into the store.

## Relocation + migration map (grounded against current worktree)

### #172b — sagas → `packages/plugin-sagas-core/`
| File (connector) | Action | Target |
|--|--|--|
| `prisma-saga-store.ts` (`PrismaSagaStore`, `PrismaSagaStoreClient`, `PrismaSagaStoreOptions`) | **relocate** (dep-free — structural Prisma delegate, no `@prisma/client` import) | `-core/src/stores/` |
| `kv-saga-store.ts` (`KvSagaStore`, `openSagaRuntimeKv`) | **relocate + migrate to `@netscript/kv`** | `-core/src/stores/` |
| `kv-saga-runtime-stores.ts` (`KvSagaAppliedKeyStore`, `KvSagaIdempotencyStore`) | **relocate + migrate** | `-core/src/stores/` |
| `saga-store-backend.ts` (`resolveSagaStoreBackend`, `SAGA_STORE_BACKEND_ENV`, `SAGA_STORE_BACKENDS`) | **relocate** (follows the store classes) | `-core/src/stores/` |

`KvSagaStore` today: `kv: Deno.Kv`, `Deno.openKv(...)`, `Deno.KvKey`, optimistic save via
`kv.atomic().check({key,versionstamp}).set().commit()`, `kv.list({prefix})` for delete/entries/
transitions. Migration → depend on `@netscript/kv` `KvStore` + atomic types (mirror the workers
structural-port pattern), open via `getKv()`/adapter at the composition root. The versionstamp
optimistic check ports to `AtomicCheck[]`/`atomic(checks, mutations)`; `list({prefix})` exists on
`KvStore`. **`plugin-sagas-core` gains a `@netscript/kv` dep — desired.**

### #172c — triggers → `packages/plugin-triggers-core/`
| File (connector) | Action | New `-core` dep (desired) |
|--|--|--|
| `kv-trigger-runtime-stores.ts` (`KvTriggerEventStore`, `KvTriggerIdempotencyStore`, `KvTriggerDlqStore`) | **relocate + migrate to `@netscript/kv`** (today hardwired `Deno.Kv`/`Deno.openKv`/fluent atomic) | `@netscript/kv` |
| `cron-trigger-scheduler-adapter.ts` (`CronTriggerSchedulerAdapter`, binds `@netscript/cron`) | **relocate** | `@netscript/cron` |
| `watchers-file-watcher-adapter.ts` (`WatchersFileWatcherAdapter`, binds `@netscript/watchers`) | **relocate** | `@netscript/watchers` |

`triggers-core` currently imports only `@std/assert`+`zod`; after this it depends on `@netscript/kv`,
`@netscript/cron`, `@netscript/watchers`. Core already exports `./adapters` (hmac/memory webhook
verifiers) + `./testing`, so port→backend adapters in core are established precedent.

### #172d — workers → `packages/plugin-workers-core/`
| File (connector) | Action | Dep |
|--|--|--|
| `worker/worker-idempotency-store.ts` (`KvWorkerIdempotencyStore`) | **relocate only** — already on `@netscript/kv` (reference pattern) | add `@netscript/kv` to workers-core imports |

### streams + auth — no runtime adapters to relocate.

## Open decisions (for the Plan + PLAN-EVAL)
- **D2 — public surface break (zero-compat).** Stores move from `@netscript/plugin-<kind>/runtime`
  to `@netscript/plugin-<kind>-core/{stores,adapters}`; under alpha zero-compat the connector
  `./runtime` re-export drops them (no shim). Pre-flight grep proves no first-party consumer
  (scaffold emitter, e2e, docs) imports them via the connector path; record the break.
- **D3 — `saga-store-backend.ts` placement.** Reusable env-driven backend selection over the core
  store classes → `-core/src/stores/`; connector keeps only the call in its composition root.
- **D4 — connector imports stores from `-core`** directly (thinness); no connector `./runtime` store
  re-export.
- **(No D1.)** Whether `-core` may take `@netscript/*` deps is not a decision — it is encouraged.

## Cycle / layering safety
core imports only its own domain/ports + the primitive packages (`@netscript/kv`/`cron`/`watchers`),
never the connector. Connector→core is allowed. `@netscript/kv`/`cron`/`watchers` do not import any
`@netscript/plugin-*-core`, so no cycle. `arch:check` enforces no connector→core leak.

## Gates (per touched package)
Scoped `run-deno-check/lint/fmt --ext ts,tsx`; `deno test --unstable-kv --allow-all` (relocated store
tests move with the files; add a `@netscript/kv` memory-adapter test proving engine-agnostic behavior);
`deno publish --dry-run --allow-dirty` (no new slow types; triggers-core keeps its existing
`--allow-slow-types`, must not regress further); `deno task arch:check`; new deps land via normal
resolution, no `deno.lock` hand-edit; zero new `any`/casts (only the 2 sanctioned categories).

## Pre-flight verification (supervisor-run, 2026-06-30 — PLAN-EVAL cycle-1 fixes #1/#2)

Re-ran the D2 surface-break grep across `docs/`, `packages/{cli,sdk,service,plugin}`,
`plugins/*/services`, `e2e`, and tests for every connector `./runtime` import of a **relocated**
symbol. Findings (full repo, `node_modules` excluded):

- **Sole import that breaks under D2:** `docs/site/capabilities/durable-sagas.md:331` — a rendered
  `{{ comp.tabbedCode }}` fence whose `code:` string is
  `import { createDurableSagaRuntime, resolveSagaStoreBackend } from '@netscript/plugin-sagas/runtime';`.
  `resolveSagaStoreBackend` **relocates** (D3 → `-core/stores`); `createDurableSagaRuntime` **stays**
  in the connector `./runtime`. Fix = split the import (see S-b sub-step), not delete the fence.
- **All other `@netscript/plugin-<kind>/runtime` references import symbols that STAY** and are
  therefore NOT broken by D2:
  - `docs/site/explanation/durability-model.md:158,302`, `docs/site/tutorials/storefront/04-checkout-saga.md:217`,
    `plugins/workers/src/cli/official-sample-configuration.ts:378` → import `createDurableSagaRuntime`
    / `createSagaPublisher` (both stay in connector `./runtime`). Valid post-D2.
  - `durable-sagas.md:40,313,355`, `explanation/plugin-system.md:69`, `reference/sagas/index.md:27,67`,
    `reference/triggers/index.md:67` → prose describing the `./runtime` subpath (which still exists).
  - `plugins/{sagas,triggers}/src/adapter/plugin.ts` `wiringEntry:` + `plugins/*/src/runtime/mod.ts`
    `@module` tags → connector-internal, rewritten by the slice itself.
- **Reference-page store mentions are PORT interfaces, not relocated concrete stores:**
  `reference/sagas/index.md:95,211` (`SagaStorePort`) and `reference/triggers/index.md:139`
  (`TriggerEventStorePort`) already point at `@netscript/plugin-<kind>-core/ports` — the relocated
  concrete classes (`KvSagaStore`/`PrismaSagaStore`/`resolveSagaStoreBackend`/the triggers KV stores)
  are **not** enumerated as connector-`./runtime` exports anywhere in `docs/site/reference`. No
  reference-page rewrite needed.

**Net D2 doc surface: exactly one line** (`durable-sagas.md:331`), handled by S-b sub-step S-b.5
below. The implementer re-runs this grep post-migration and pastes the zero-match result into
`worklog.md` (Gate evidence).

### Name collision discovered (PLAN-EVAL fix #2)

`packages/plugin-triggers-core/src/testing/kv-trigger-event-store.ts:5` already defines
`export class KvTriggerEventStore implements TriggerEventStorePort` (a `Deno.Kv`-typed **test
double**), re-exported from `src/testing/mod.ts:4`. The relocated production store (also named
`KvTriggerEventStore`, currently `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:32`,
consumed by `plugins/triggers/services/src/main.ts:39,145` via `runtime/mod.ts:6`) lands in
`-core/src/stores/` — a hard name collision inside the same package.

The repo's own taxonomy resolves it: `.llm/harness/profiles/triggers/extension-axes.md:18` documents
the event-store axis implementers as **`KvTriggerEventStore` (the real KV store) + `MemoryTriggerEventStore` +
`RecordingTriggerEventStore`** — i.e. the testing fixture is *misnamed* `Kv*` when its sibling test
doubles are `Memory*`/`Recording*`. Deconflict = **rename the testing fixture
`KvTriggerEventStore` → `MemoryTriggerEventStore`** (aligning it with the documented taxonomy),
freeing the canonical `KvTriggerEventStore` name for the relocated `@netscript/kv`-backed production
store. See S-c sub-step S-c.5.

## Implementation lane
Net-new framework-source relocation + behavior-affecting persistence migration → **WSL Codex
daemon-attached slice**, supervisor verifies + commits + pushes. Gated on PLAN-EVAL PASS.
