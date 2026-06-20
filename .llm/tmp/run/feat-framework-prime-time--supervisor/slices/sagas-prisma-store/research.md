# Research — sagas-prisma-store (durable saga store, Prisma backend parity)

Status: seeded (pre-research/plan). **Depends on #74 (`sagas-durable-store`) merging first** — consumes
the merged `createDurableSagaRuntime` backend-selection seam and the locked `SagaStorePort`.

## Origin (user, 2026-06-20)

The old saga implementation (wrapping the `@saga-bus/*` lib) shipped a **Prisma durable saga store**
(`@saga-bus/store-prisma`). The new #74 durable store is **KV-only** (`KvSagaStore` over `Deno.Kv`) and
its slice-7 docs change deliberately REMOVED the `@saga-bus/store-prisma` promise, recharacterizing
Postgres as a read-model/projection. That dropped Prisma durable-store parity. User: "the new one
should also support it." → restore Prisma as a first-class durable backend.

## Locked decisions (user, 2026-06-20)

- **Delivery vehicle: fast-follow additive adapter slice** (NOT a reopen of #74). #74 merges as-is;
  this slice adds Prisma additively. No rework of `KvSagaStore`.
- **`PrismaSagaStore implements SagaStorePort`** — consumes the already-locked port from
  `@netscript/plugin-sagas-core` (no port change), exactly the seam KvSagaStore plugs into. Same
  multi-adapter idiom as `@netscript/queue` (KV/Postgres/Redis) and the auth adapters.
- **Both backends first-class — explicit choice (no implicit default).** The composition root must
  select KV or Prisma; neither is silently defaulted. Selection is available three ways:
  1. **env var** (e.g. `NETSCRIPT_SAGA_STORE=kv|prisma`, with `NETSCRIPT_SAGA_KV_PATH` /
     Prisma/`@netscript/database` connection respectively),
  2. **appsettings** config (the runtime-config/appsettings surface), and
  3. **CLI scaffold option** — `@netscript/cli` saga scaffolding offers a saga-store-backend choice
     (KV vs Prisma/Postgres) that wires the chosen backend into the generated composition root +
     appsettings.
- **Deps via catalog.** Reuse the already-cataloged `@prisma/client ^7.8.0` +
  `@netscript/database`; no new third-party dep into core `@netscript/plugin-sagas-core`.

## Placement (to confirm in plan)

- `PrismaSagaStore`: plugin layer (`@netscript/plugin-sagas`), alongside `KvSagaStore`, mirroring how
  the durable adapter lives in the plugin (core stays platform-neutral / KV-free / Prisma-free).
- Backend-selection helper extends `createDurableSagaRuntime({ store } | { backend: 'kv'|'prisma' })`
  added in #74 — resolve env/appsettings → concrete store.
- Schema: better to contribute the saga-store Prisma models via the plugin **database
  schema-contribution** mechanism (Archetype 5; `plugins/sagas/database/sagas.prisma`). NOTE: #74's
  slice-7 reframed those tables as a read-model — this slice must reconcile: the durable engine store
  tables vs the API read-model/projection. Decide whether they share tables or are distinct.

## Archetype + overlays (draft)

- ARCHETYPE-2 (Integration) for the Prisma store adapter (wrap one external system: Prisma/Postgres
  behind `SagaStorePort`); ARCHETYPE-5 (plugin) for wiring + schema contribution; SCOPE-service for
  the composition root; plus a CLI scaffold touch (`@netscript/cli`).

## Open questions for plan → PLAN-EVAL

1. Optimistic-write parity: `SagaStorePort.save(envelope,{expectedVersion})` over Prisma — use a
   `version` column + conditional `UPDATE ... WHERE version = expectedVersion` (or Prisma optimistic
   concurrency) to match KvSagaStore's versionstamp-check semantics and the `MemorySagaStore` error
   shape (`SagasError.validationFailed`).
2. Transition log + correlation index table design (mirror the KV key layout:
   state envelope / correlation / transition).
3. Shared-vs-separate tables with the #74 read-model/projection framing.
4. Transaction boundaries for `delete` (state + transitions + correlation atomically).
5. CLI scaffold UX: prompt/flag name, generated appsettings keys, generated composition-root code for
   each backend; E2E coverage (`scaffold.runtime`) impact — adding a backend option likely DOES change
   scaffold output, so this slice may require `deno task e2e:cli run scaffold.runtime` at eval.

## Precedents (internal)

- `@netscript/queue` multi-adapter (KV/Postgres/Redis) + `DeadLetterStorePort` (#80) — per-backend
  durable stores behind one port.
- `@netscript/prisma-adapter-mysql` — standalone Archetype-2 Prisma adapter package precedent.
- #74 `KvSagaStore` + `createDurableSagaRuntime` — the sibling backend + selection seam this extends.

## Formal research — post-#74-merge findings (supervisor, 2026-06-20)

#74 is merged into the umbrella; the seam + reference impl were read directly. Grounded facts:

### The locked contract — `SagaStorePort` (`packages/plugin-sagas-core/src/ports/saga-store-port.ts`)
8 methods, all keyed primarily on `instanceId`: `load(instanceId)`, `save(envelope,{expectedVersion?})`,
`appendTransition(instanceId, record)`, `findByCorrelation(sagaId, correlationKey)`,
`saveCorrelation(entry)`, `delete(instanceId)`, plus `readonly id: string`. The store subpath
(`src/stores/mod.ts`) ALSO re-exports `SagaIdempotencyPort` (#75 work) — parity scope is the
`SagaStorePort` (idempotency is a separate port; out of scope unless the Prisma idempotency store is
explicitly added — recommend deferring to keep this slice additive).

### Reference impl — `KvSagaStore` (`plugins/sagas/src/runtime/kv-saga-store.ts`)
- Optimistic write: `save` reads current, compares `metadata.version` to `expectedVersion`, then a KV
  `atomic().check({versionstamp}).set().commit()`; on conflict throws
  `SagasError.validationFailed("Saga store version mismatch for <id>")`. **PrismaSagaStore must
  reproduce this exact error shape.**
- Beyond the port it also exposes `entries()`, `transitions(instanceId)`, and `close()` (closes the KV
  handle). Mirror `close()` (dispose the Prisma resource the store owns) and the diagnostic
  `entries()/transitions()` for test/parity.
- Key layout: `['sagas','state',instanceId]`, `['sagas','correlation',sagaId,correlationKey]→instanceId`,
  `['sagas','transition',instanceId,version]` → the three Prisma tables mirror these namespaces.

### The selection seam — `createDurableSagaRuntime` (`plugins/sagas/src/runtime/create-durable-saga-runtime.ts`)
- Already accepts an injectable `store?: SagaStorePort` (`store = options.store ?? options.native?.store
  ?? new KvSagaStore({ kv })`). **No port change needed** — Prisma plugs in as `options.store`.
- BUT it **unconditionally opens `Deno.Kv`** (`kv = options.kv ?? await openSagaRuntimeKv()`) and returns
  `kv` as a REQUIRED field; `saga-supervisor.ts:142` and `services/src/main.ts:86` call
  `durable.kv.close()` on stop. ⇒ Seam refactor needed: when a non-KV store is selected, do NOT
  force-open KV; generalize teardown to `dispose()` (or `kv?.close()` + `store.close?.()`). This is the
  one seam change this slice owns; it is additive/backward-compatible (KV path unchanged).

### Prisma client wiring (`plugins/sagas/services/src/main.ts:44`)
- The host provides the client via `ctx.db.getClient()` (`@netscript/database` / `PluginServiceContext.db`).
  `main.ts` already holds `dbClient`. ⇒ Prisma backend path passes that same client into the store
  (consumer-brings-the-instance idiom, same as queue/db providers). No new connection management in the
  store; it receives a configured `PrismaClient`.

### Schema reconciliation — RESOLVED recommendation
`plugins/sagas/database/sagas.prisma` already has `SagaInstance` (with `version`, `correlationId`,
`state Json`, composite PK `[sagaName, id]`) + `SagaExecutionHistory` + `SagaDefinition`, explicitly
framed by #74 as a **read-model/projection**, NOT the durable write path. The port keys on `instanceId`
alone, but `SagaInstance`'s PK is `[sagaName, id]` — a structural mismatch. **Recommend DEDICATED durable
runtime tables** (e.g. `saga_runtime_state` keyed by `instanceId`, `saga_runtime_transition`
`(instanceId, version)`, `saga_runtime_correlation` `unique(sagaId, correlationKey)`) mirroring the KV
namespaces, leaving the projection tables untouched for API/analytics. This keeps durable-write and
read-model concerns separate (matches #74's framing) and avoids overloading projection PK semantics.
PLAN-EVAL to confirm dedicated-vs-shared.

### Optimistic concurrency over Prisma
`save(envelope,{expectedVersion})` → in a transaction: `updateMany where {instanceId, version:
expectedVersion} data {…, version: expectedVersion+1}`; if `count === 0` and the row exists → throw
`SagasError.validationFailed` (same shape as KV). First write (`expectedVersion` undefined / no row) →
`create`. `delete` wraps state + transitions + correlation deletes in one `$transaction`.

### Deps + CLI
- `@prisma/client ^7.8.0` already cataloged; `@netscript/database` already a dep. No new third-party dep
  into core `@netscript/plugin-sagas-core` (stays platform-neutral). Prisma store lives in the plugin
  (`@netscript/plugin-sagas`), alongside `KvSagaStore`.
- CLI scaffold backend option: the generated composition root (`services/src/main.ts` template) + its
  appsettings get a `saga-store-backend` choice. **Confirmed E2E impact**: this changes scaffold output
  ⇒ the slice PR MUST carry the `e2e-cli-gate` label and `deno task e2e:cli run scaffold.runtime` runs
  at eval (per the E2E-gating decision). Exact `@netscript/cli` scaffold file paths to be enumerated in
  the generator's implementation-research step.

### Open items deferred to implementation-research (generator)
- Exact `@netscript/cli` saga scaffold files for the backend prompt/flag + generated appsettings keys.
- Whether to also surface `entries()/transitions()` on the Prisma store (recommended for test parity).
