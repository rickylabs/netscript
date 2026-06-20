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

## TODO (formal research, before plan.md)

- After #74 merges: read the merged `createDurableSagaRuntime` selection seam + `KvSagaStore` to mirror
  surface exactly.
- Confirm the `@netscript/database`/Prisma client wiring + connection-config surface (appsettings/env).
- Inspect `@netscript/cli` saga scaffold to scope the backend-option addition + its E2E impact.
- Decide schema reconciliation (durable store tables vs read-model/projection) with doctrine.
