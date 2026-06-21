# research.md — sagas-durable-store

## Slice scope (from blocker_slices.json key "sagas-durable-store")

Title: Concrete durable SagaStorePort instantiated and wired through engine, service main.ts, and standalone runner (G1).
Severity: blocker. Wave: A. dependsOn: [].
Units: `packages/plugin-sagas-core`, `plugins/sagas`, `plugins/sagas/services`.

The slice has 8 gaps. They are not 8 distinct defects: they are the **same root defect** observed from
8 evidence angles — *no concrete durable `SagaStorePort` exists in the repo, and every composition
root constructs the native engine store-less, so saga state is process-ephemeral and lost on restart.*

## Ground-truth verification (current main, re-baselined post S2/S3/S5/OTel)

Every cited line was re-opened and confirmed. Line numbers below are current.

### Port + engine (confirmed)
- `packages/plugin-sagas-core/src/ports/saga-store-port.ts:23` — `SagaStorePort` interface. Methods:
  `id`, `load`, `save(envelope, {expectedVersion?})`, `appendTransition`, `findByCorrelation`,
  `saveCorrelation`, `delete`. **CONFIRMED.** This is the contract a durable store must implement.
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:67` — `readonly #store?: SagaStorePort` is
  optional. **CONFIRMED.**
- `saga-engine.ts:77` — `this.#store = options.store` (no default). **CONFIRMED.**
- `saga-engine.ts:210` — `const loaded = await this.#store?.load(instanceId)`; store-less ⇒ always
  `undefined` ⇒ `baseState = entry.definition.initialState` every message (line 211). **CONFIRMED:
  every message restarts from initial state when store-less.**
- `saga-engine.ts:259` — `#resolveInstanceId` calls `this.#store?.findByCorrelation(...)`; store-less
  ⇒ undefined ⇒ falls back to deterministic `resolveInstanceId`. **CONFIRMED.**
- `saga-engine.ts:277` — `#persistTransition` early-returns `if (!this.#store) return;` so
  `save`/`saveCorrelation`/`appendTransition` (lines 296,299,304) are silent no-ops. **CONFIRMED.**
- `saga-engine.ts:296-298` — `save(envelope, { expectedVersion: input.loaded?.metadata.version })`
  — optimistic concurrency contract is already wired; a durable store must honor `expectedVersion`.
  **CONFIRMED.**

### Composition roots (all store-less — confirmed)
- `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:89-93` — `createNativeBus` builds
  `createSagaEngine({ ...engineOptions, store: options.store ?? options.engineOptions?.store })`. With
  no native options both are `undefined`. **CONFIRMED.** `SagaRuntimeNativeOptions.store` exists at
  line 30; this is the only injection point. No default, no warning log.
- `plugins/sagas/services/src/main.ts:63` — `sagaRuntime = createSagaRuntime({ adapter: 'native' })`
  with no `native.store`. This is the deployed entrypoint (`import.meta.main` at line 88-90).
  **CONFIRMED.**
- `plugins/sagas/services/src/main.ts:41` — `const dbClient = await ctx.db.getClient()`. Passed only
  to `.withDatabase(dbClient)` (line 56) and `startSagasStreamMirror` (line 66); **never threaded into
  `createSagaRuntime`.** **CONFIRMED (dropped-input).**
- `plugins/sagas/services/src/main.ts:12` — docstring "Prisma store for durable saga state".
  **CONFIRMED — advertised, never wired.**
- `plugins/sagas/src/runtime/saga-supervisor.ts:65-68` — `createDefaultRuntime(this.options.runtimeOptions ?? {})`;
  forwards verbatim, injects no store. **CONFIRMED.** (Evidence said "62-69"; current is 65-68 — minor
  shift, root intact.)
- `plugins/sagas/src/runtime/saga-runner.ts:62-69` — supervisor built with
  `runtimeOptions: { ...options.runtimeOptions, adapter }`; `native.store` never set. **CONFIRMED.**

### No concrete durable store exists (confirmed)
- `grep 'implements SagaStorePort'` repo-wide → only: `AbstractSagaStore` (abstract, stub-only,
  `src/abstracts/abstract-saga-store.ts:16`), `MemorySagaStore` (`src/testing/memory-saga-store.ts:17`,
  test-only), `RecordingSagaStore` (`src/testing/recording-saga-store.ts:25`, test-only), and a
  test-local class in `tests/runtime/saga-store_test.ts`. **CONFIRMED — zero production durable store.**
- `packages/plugin-sagas-core/src/stores/mod.ts` — re-exports only the `SagaStorePort` TYPE (and
  related types/constants); contains no concrete store. Module doc says Group E "keeps concrete
  persistent stores outside the root barrel … so external store implementations can target a stable
  role-named subpath." **CONFIRMED.** This subpath is the intended home for a core-shipped store.
- `plugins/sagas/database/sagas.prisma:3,10` — comments claim "@saga-bus/store-prisma PrismaSagaStore"
  is the durable backing. `deno.json` declares only `@saga-bus/core ^0.2.2`; `store-prisma` is NOT a
  dependency. `PrismaSagaStore` is never imported/constructed. **CONFIRMED — dead promise.**
- `.llm/harness/profiles/sagas/extension-axes.md` marks `KvSagaStore`/`PostgresSagaStore` "(planned)";
  `architecture.md` `createKvSagaStore` is illustrative prose. **CONFIRMED — not implemented.**
- Note in gap `xcut-saga-store-undurable-and-unwired`: docs-site files (`docs/site/...`) do not exist
  in this worktree (docs live on a separate branch). That sub-evidence is **not verifiable here** and
  is dropped from scope; the in-repo `main.ts:12` docstring tagline carries the same claim and IS
  verified.

### Read path divergence (confirmed — informs a locked deferral)
- `plugins/sagas/services/src/routers/v1-handlers.ts:62-71,114` — `listInstances`/`getInstance` read
  from Prisma `db.sagaInstance` when a Prisma client is present.
- `v1-handlers.ts:82-99` + `v1-helpers.ts:84-90` — a **separate** KV read branch uses
  `getSagaDb()` → `createNetscriptDb(sagaInstancesSchema)` collection `sagaInstances` (a
  `@olli/kvdex`-style schema), NOT raw `Deno.Kv`.
- `plugins/sagas/streams/producer.ts:36-51,95-111` — `startSagasStreamMirror` only READS
  `sagaInstance` (findMany) to mirror into a durable stream; never writes `SagaInstance` rows.
- **Conclusion:** the API read path is fed by a DIFFERENT persistence shape than the engine write path
  this slice introduces. Making the read path consume the new store is a separate reconciliation and is
  **deferred-safe** (it does not force rework of the store contract or the engine wiring this slice
  locks). Recorded in the open-decision sweep.

## Reuse target — the proven triggers pattern (gold standard)

Triggers already ships durable runtime stores and wires them, exactly the shape sagas needs:
- `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:27` — `openTriggerRuntimeKv()` returns
  `Deno.openKv(Deno.env.get('NETSCRIPT_TRIGGER_KV_PATH'))`.
- `:32` `KvTriggerEventStore implements TriggerEventStorePort` over a raw `Deno.Kv`, using
  `kv.atomic().check(...).set(...).commit()` for optimistic writes and `kv.list({prefix})` for queries.
- `:104` `KvTriggerIdempotencyStore` uses `atomic().check({versionstamp:null})` for first-wins claims.
- `plugins/triggers/services/src/main.ts:100-105` — service opens KV and constructs the store:
  `const kv = options.kv ?? await openTriggerRuntimeKv(); const eventStore = options.eventStore ?? new KvTriggerEventStore({ kv })`.
- `plugins/triggers/src/runtime/trigger-runtime-processor.ts:38-43` — background processor mirrors the
  same `options.X ?? new KvX({ kv })` default.
- `plugins/triggers/src/runtime/mod.ts:6-8` — stores re-exported from the plugin runtime barrel.

This is the **locked reference**. The saga store mirrors it 1:1.

## APIs to wrap (no reinvention)
- `Deno.openKv(path?)` + `Deno.Kv.atomic().check().set().commit()` + `kv.get<T>()` + `kv.list<T>({prefix})`
  — Web/Deno platform; durable, atomic, optimistic. Wrap directly (doctrine A7).
- `structuredClone` already used by the engine for state cloning (no new helper).
- Optimistic concurrency: the engine already passes `{ expectedVersion }` to `save`. The KV store maps
  this to an atomic `check({ key, versionstamp })` so a stale write is rejected with
  `SagasError.validationFailed`, matching `MemorySagaStore.save` semantics (memory-saga-store.ts:42-50).

## Doctrine constraints
- `docs/architecture/doctrine/08-runtime-state-failure.md:202-221` — at-least-once + idempotency;
  store records state durably. (Applied-key dedup is the SEPARATE `sagas-idempotency-e2e` slice — NOT
  in scope here; this slice delivers durable *state*.)
- doctrine 08:133-134 — `stop()` aborts internal controller and awaits drain. The KV store exposes
  `close()` so the composition root releases the handle on shutdown; full signal-driven drain is the
  separate `service-graceful-shutdown` slice. This slice ensures the store handle is closeable and is
  closed in the service `stop`/finally path where one already exists.
- A11 (name extension axes before abstraction): `KvSagaStore` is the first named member of the
  already-named "saga store" extension axis (`stores/` subpath exists for exactly this).
- F-13 (saga/runtime invariants) applies to ARCHETYPE-3. F-15 (re-export-upstream lint): the store
  wraps `Deno.Kv`; do not re-export Deno types as package surface.

## Debt implications
- Resolves the false "Prisma store for durable saga state" promise. The `main.ts:12` docstring and
  `sagas.prisma:3,10` comments must be corrected to describe the actual KV-backed durable store (or
  the Prisma-as-projection reality), or they become a new doc-vs-impl debt entry.
- `@saga-bus/store-prisma` reference in `sagas.prisma` is dead and must be removed/replaced to avoid
  re-flagging.

## Catalog / Option-A law
- No new npm dependency is needed (raw `Deno.Kv`). No `catalog:` / `jsr:` change. Do NOT touch
  `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or version pins. `@netscript/cli`
  not touched.