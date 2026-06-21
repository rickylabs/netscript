# Plan — sagas-prisma-store (Prisma durable `SagaStorePort` backend parity)

Status: PLAN authored (supervisor), ready for PLAN-EVAL. Base branch: `feat/framework-prime-time`
(umbrella; contains merged #74). Slice branch: `feat/prime-time/sagas-prisma-store`. PR → umbrella,
**MUST carry the `e2e-cli-gate` label** (changes scaffold output).

## 1. Goal & scope

Restore **first-class Prisma/Postgres durable saga persistence** as a peer to the merged KV backend,
by adding `PrismaSagaStore implements SagaStorePort` in the plugin layer and making the durable runtime
backend **explicitly selectable** (KV vs Prisma) via env var, appsettings, and a `@netscript/cli`
scaffold option. Additive only — `KvSagaStore` and the #74 contract are untouched. Closes the parity
gap left when #74 recharacterized Postgres as a read-model/projection and dropped the legacy
`@saga-bus/store-prisma` promise.

**In scope:** Prisma store implementation; dedicated durable Prisma schema models; a backward-compatible
selection/teardown refactor of `createDurableSagaRuntime`; env/appsettings/CLI selection; full tests;
docs reconciliation (Postgres is again a durable backend, not only a projection).

**Out of scope (record as deferred, not dropped):** a Prisma `SagaIdempotencyPort` implementation (#75's
idempotency port) — KV remains the idempotency backend for now; Prisma idempotency parity is a possible
fast-follow. Migrating the existing read-model/projection tables. Any change to core
`@netscript/plugin-sagas-core` public surface.

## 2. Archetype & overlays

- **ARCHETYPE-2 (Integration)** for `PrismaSagaStore` — wraps one external system (Prisma/Postgres)
  behind the existing `SagaStorePort`; no new public port.
- **ARCHETYPE-5 (plugin)** for the schema contribution (`plugins/sagas/database/sagas.prisma`) + runtime
  wiring + barrel re-exports.
- **SCOPE-service** overlay for the composition-root selection in `plugins/sagas/services/src/main.ts`.
- **CLI touch** (`@netscript/cli`) for the scaffold backend option (kept minimal; additive prompt/flag).

## 3. Contract (contract-first — NO port change)

The port `SagaStorePort` is already locked (#74). `PrismaSagaStore` implements it verbatim:
`id`, `load`, `save(…,{expectedVersion?})`, `appendTransition`, `findByCorrelation`, `saveCorrelation`,
`delete`. Error parity is part of the contract: optimistic-write conflict throws
`SagasError.validationFailed("Saga store version mismatch for <instanceId>")` — byte-identical to
`KvSagaStore`. Optional `close()` and diagnostic `entries()/transitions()` mirror the KV store.

The selection seam refactor is **backward-compatible**: existing `createDurableSagaRuntime()` callers
keep the KV default; the returned shape stays assignable (add `dispose()`, make `kv` optional/only set
for the KV backend — see §4.3). No consumer break.

## 4. Design

### 4.1 `PrismaSagaStore` — `plugins/sagas/src/runtime/prisma-saga-store.ts`
- Constructed with a host-provided Prisma client (consumer-brings-the-instance idiom):
  `new PrismaSagaStore({ prisma })` where `prisma` comes from `ctx.db.getClient()`
  (`@netscript/database`). The store does NOT open/own the connection lifecycle; `close()` is a no-op or
  delegates per host policy (host owns `dbClient`). `id = 'prisma-saga-store'`.
- Method → table mapping (see §4.2). `save` uses a `$transaction` with `updateMany where {instanceId,
  version: expectedVersion}`; `count === 0 && rowExists` → `validationFailed`; absent row / no
  `expectedVersion` → `create`. `delete` deletes state + transitions + correlations in one
  `$transaction`. `appendTransition` inserts `(instanceId, version, …)`. `findByCorrelation` /
  `saveCorrelation` use the correlation table's `unique(sagaId, correlationKey)`.
- JSON columns hold the `SagaStateEnvelope` / `SagaTransitionRecord` payloads (mirrors KV value storage)
  so domain shape stays the source of truth; indexed scalar columns (`instanceId`, `version`, `sagaId`,
  `correlationKey`) drive lookups and concurrency.

### 4.2 Schema — dedicated durable runtime models (recommended; PLAN-EVAL to confirm)
Add to `plugins/sagas/database/sagas.prisma`, **separate** from the existing projection tables:
- `saga_runtime_state` — PK `instanceId`; cols `sagaId`, `version Int`, `envelope Json`, timestamps.
- `saga_runtime_transition` — PK `(instanceId, version)`; col `record Json`.
- `saga_runtime_correlation` — `@@unique([sagaId, correlationKey])`; col `instanceId`.
Rationale: the port keys on `instanceId` alone, but the projection `SagaInstance` PK is `[sagaName, id]`
— a structural mismatch. Dedicated tables keep #74's read-model/projection framing intact and mirror the
KV namespaces exactly. (Alternative considered: promote `SagaInstance` to the durable table — rejected:
conflates projection + durable write path, requires PK migration, risks API read-model coupling.)

### 4.3 Selection seam refactor — `create-durable-saga-runtime.ts` (backward-compatible)
- Add `backend?: 'kv' | 'prisma'` and `prisma?: PrismaClient` to `DurableSagaRuntimeOptions` (keep
  `store?`/`kv?`/`native?`). Resolution precedence: explicit `store` > `backend`/`prisma` > env
  (`NETSCRIPT_SAGA_STORE`) > **error if unresolved** (no silent default — "explicit choice" is a locked
  requirement; the helper that reads env/appsettings supplies the choice, never an implicit KV fallback
  in the multi-backend entrypoint). For strict back-compat, the existing zero-arg `createDurableSagaRuntime()`
  used by current callers keeps KV (documented), while the scaffold-generated composition root always
  passes an explicit backend.
- Only open `Deno.Kv` when the KV backend is selected. Return `dispose(): Promise<void>` that closes the
  selected store's resource; keep `kv` present only for the KV backend (optional field). Update
  `saga-supervisor.ts` and `services/src/main.ts` to call `durable.dispose()` instead of
  `durable.kv.close()`.

### 4.4 Env / appsettings / CLI selection
- **Env:** `NETSCRIPT_SAGA_STORE=kv|prisma` (KV uses `NETSCRIPT_SAGA_KV_PATH`; Prisma uses the host
  `@netscript/database` connection via `ctx.db.getClient()`).
- **Appsettings:** a `sagas.store.backend` key on the runtime-config/appsettings surface, read by the
  composition root.
- **CLI scaffold:** `@netscript/cli` saga scaffolding offers a saga-store-backend choice (KV vs
  Prisma/Postgres) that wires the chosen backend into the generated `main.ts` + appsettings. Changes
  scaffold output ⇒ `e2e-cli-gate` label + `scaffold.runtime` at eval.

### 4.5 Docs reconciliation
Update `.llm/harness/profiles/sagas/extension-axes.md` (`PostgresSagaStore`/Prisma now implemented, not
"planned"), `architecture.md`, and the `sagas.prisma` header comment + any user-docs caveat that said
"durable write path is KV only" to reflect dual durable backends with explicit selection.

## 5. Commit slices (commit → push → PR comment → append commits.md, per slice)
1. `feat(sagas): dedicated Prisma durable saga schema models` — schema + generated migration/client.
2. `feat(sagas): PrismaSagaStore implements SagaStorePort` — store + unit tests (incl. optimistic
   conflict + delete-cascade).
3. `refactor(sagas): backend-select + dispose() in createDurableSagaRuntime` — seam, supervisor + main
   teardown, barrel re-exports of `PrismaSagaStore`.
4. `feat(sagas): env/appsettings saga-store backend selection` — config resolution + tests.
5. `feat(cli): saga-store backend scaffold option` — `@netscript/cli` prompt/flag + generated wiring.
6. `docs(sagas): Postgres durable backend parity` — extension-axes/architecture/schema-comment/caveats.

## 6. Gates (archetype-2 + archetype-5 + scope-service)
- Scoped `run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts --ext ts,tsx` over
  `plugins/sagas`, `packages/plugin-sagas-core` (unchanged-surface verify), `@netscript/cli` touch.
- `deno test --unstable-kv --allow-all packages/plugin-sagas-core plugins/sagas` (existing suites stay
  green; add Prisma store suite — use a Prisma test client / pglite or a transaction-rollback harness as
  available in repo precedent; if a live Postgres is required, gate behind the runtime e2e).
- `deno publish --dry-run` for the touched publishable units; JSR audit (slow-types acceptable if
  consistent with siblings).
- **`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`** — REQUIRED at eval (scaffold
  output changed); PR carries `e2e-cli-gate`.
- `deno task arch:check` / doctrine scoped (no new FAIL introduced; root baseline-red noted as
  pre-existing per the durable-store/idempotency slices).
- Lock hygiene: `@prisma/client` already cataloged; no `deno.lock` re-resolution churn committed.

## 7. Debt & risks
- **Debt:** Prisma `SagaIdempotencyPort` parity deferred (record in `arch-debt.md` as an explicit,
  scoped follow-up, not a silent drop). Read-model/projection ↔ durable-runtime table sync left to the
  existing stream mirror; not unified here.
- **Risk — seam refactor touches shared teardown** (`kv.close()` → `dispose()`): mitigated by keeping
  `kv` optional and the KV path behavior-identical; covered by existing supervisor/runtime tests.
- **Risk — Prisma store testing without a live DB**: prefer an in-process Postgres (pglite/embedded) or
  transaction-rollback fixture; if unavailable, the durable-contract assertions run under
  `scaffold.runtime` (real Postgres) and unit tests use a typed fake client — call out which in worklog.
- **Risk — "no implicit default" vs back-compat**: the zero-arg KV default is retained ONLY for existing
  internal callers; the scaffold + docs always present an explicit choice. PLAN-EVAL to confirm this
  reconciliation is acceptable or require a hard explicit-choice error everywhere.

## 8. Production/enterprise bar
Real Postgres persistence (no stub/no-op), optimistic-concurrency correctness with KV-identical error
semantics, atomic multi-table delete, host-owned connection lifecycle, full unit + runtime-e2e coverage,
observability via existing saga telemetry (#76) unaffected, graceful dispose on shutdown.
