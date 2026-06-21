# plan.md — sagas-durable-store

## Locked scope

Deliver a **production durable `SagaStorePort` implementation** (`KvSagaStore`, backed by raw
`Deno.Kv`) and **wire it through every saga composition root** (`create-saga-runtime` default path,
service `main.ts`, standalone `saga-runner`/`saga-supervisor`) so deployed and standalone saga runtimes
persist instance state across restart. Mirror the proven triggers durable-store pattern 1:1. Correct
the dead "Prisma store" / "@saga-bus/store-prisma" promises to match reality.

Out of scope (separate Wave-A slices, deferred-safe): applied-key idempotency dedup
(`sagas-idempotency-e2e`), telemetry spans (`sagas-telemetry-spans`), signal-driven graceful drain
(`service-graceful-shutdown`), and reconciling the HTTP read path (`v1-handlers` Prisma/kvdex branches)
to consume the new store.

## Archetype + overlays
- Core seam: ARCHETYPE-3 (Runtime/Behavior) — `@netscript/plugin-sagas-core`.
- Concrete store + wiring: ARCHETYPE-5 (Plugin Package) — `@netscript/plugin-sagas`.
- Overlay: SCOPE-service (composition root in `plugins/sagas/services/src/main.ts`).

## Design

### Contract (already exists — reuse, do not change)
`SagaStorePort` (`packages/plugin-sagas-core/src/ports/saga-store-port.ts:23`) is the locked contract:
`id`, `load`, `save(envelope,{expectedVersion?})`, `appendTransition`, `findByCorrelation`,
`saveCorrelation`, `delete`. The engine already drives it correctly (saga-engine.ts:210/259/277).
**No port change.** The only gap is the absence of a durable implementor and the store-less defaults.

### New concrete store — `KvSagaStore`
Location: `plugins/sagas/src/runtime/kv-saga-store.ts` (mirrors
`plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts`). Implements `SagaStorePort` over a raw
`Deno.Kv`.

Key layout (prefix default `['sagas']`, overridable via options):
- state envelope: `['sagas','state', instanceId] -> SagaStateEnvelope`
- correlation index: `['sagas','correlation', sagaId, correlationKey] -> instanceId`
- transition log: `['sagas','transition', instanceId, version] -> SagaTransitionRecord`

Semantics:
- `save(envelope,{expectedVersion})`: atomic `check({ key: stateKey, versionstamp })` against the
  versionstamp captured at the matching `load`. To honor the existing optimistic protocol simply and
  durably, store the envelope and gate on `expectedVersion` by reading current envelope version inside
  an atomic transaction (`get` then `atomic().check(commitResult versionstamp).set()`); on mismatch
  reject with `SagasError.validationFailed(...)` — identical error shape to `MemorySagaStore.save`.
- `load`: `kv.get<SagaStateEnvelope>(stateKey)`.
- `findByCorrelation`: `kv.get<SagaInstanceId>(correlationKey)`.
- `saveCorrelation`: `kv.set(correlationKey, instanceId)`.
- `appendTransition`: `kv.set(transitionKey(instanceId, record.version), record)`.
- `delete`: atomic delete of state + transitions (`kv.list` the transition prefix) + correlation entry.
- `id = 'kv-saga-store'`.
- Provide `entries()`/`transitions(instanceId)` read helpers ONLY if needed by tests; keep surface
  minimal (avoid F-5/F-16 surface bloat).

Opener: `openSagaRuntimeKv(): Promise<Deno.Kv>` = `Deno.openKv(Deno.env.get('NETSCRIPT_SAGA_KV_PATH'))`
(mirrors `openTriggerRuntimeKv`). Store accepts `{ kv: Deno.Kv; prefix?; now? }`.

Lifecycle: expose `close(): void` that calls `this.#kv.close()` so the composition root can release the
handle. The store does NOT own opening in tests (caller injects an in-memory `Deno.openKv(':memory:')`).

### Default wiring (the blocker fix)
The native composition root must default to a durable store while remaining injectable/testable.

Chosen placement of the default-construction (LOCKED): **plugin layer**, NOT the core package — exactly
like triggers (core `createTriggerProcessor` stays store-agnostic; the plugin
`createRuntimeTriggerProcessor` injects the KV store). Rationale: `@netscript/plugin-sagas-core` must
stay platform-neutral and KV-free (it currently has zero `Deno.openKv` usage); the durable adapter and
its default belong to `@netscript/plugin-sagas`. This keeps core JSR-publishable without a Deno-KV
runtime dependency and respects layering.

Concretely, add a plugin-layer factory `createDurableSagaRuntime(options?)` in
`plugins/sagas/src/runtime/create-durable-saga-runtime.ts`:
- opens KV (`options.kv ?? await openSagaRuntimeKv()`),
- constructs `store = options.store ?? new KvSagaStore({ kv })`,
- returns `{ runtime: createSagaRuntime({ adapter:'native', native:{ store, ...options.native } }), store, kv }`
  so callers can close on shutdown.
- `createSagaRuntime` core default path is left unchanged (store-agnostic) — but its store-less
  behavior is made **non-silent**: emit a one-time `warn` via the existing `NoopLogger`/`LoggerPort`
  seam (`logger.ts`) when `createNativeBus` builds an engine with no store, so a misconfigured raw
  consumer is not silently non-durable (closes gap `sagas-core-storeless-engine-default`'s "no warning
  logged" finding without forcing a Deno-KV dep into core).

### Composition-root rewiring
1. `plugins/sagas/services/src/main.ts` — replace `createSagaRuntime({ adapter:'native' })` (line 63)
   with `createDurableSagaRuntime()`; keep the returned `store`/`kv` so the existing service teardown
   path closes the KV handle. Update the `withContext` capture to expose the durable runtime. Correct
   the line-12 docstring to "Durable KV-backed saga state store".
2. `plugins/sagas/src/runtime/saga-runner.ts` + `saga-supervisor.ts` — the standalone runner must also
   default to durable. Add a default `createRuntime` that uses `createDurableSagaRuntime` when no
   `runtimeOptions.native.store` is supplied, so `runSagaRunner()` / `SagaRuntimeSupervisor` are durable
   by default. Preserve the existing `createRuntime`/`runtimeOptions` injection seams for tests.
3. `plugins/sagas/src/runtime/mod.ts` — re-export `KvSagaStore`, `openSagaRuntimeKv`,
   `createDurableSagaRuntime` (+ option types) from the plugin runtime barrel (mirrors triggers
   runtime barrel).

### Doc/promise correction
- `plugins/sagas/database/sagas.prisma:1-10` — remove `@saga-bus/store-prisma PrismaSagaStore`
  references; describe the Postgres tables as a **read-model/projection** (the API read path), not the
  engine's durable store. (No schema field changes — comment-only, to avoid migration churn.)
- `plugins/sagas/services/src/main.ts:12` docstring — corrected as above.

## Commit slices (ordered, each independently gate-able)

1. **`feat(sagas): KvSagaStore durable SagaStorePort`**
   - Files: `plugins/sagas/src/runtime/kv-saga-store.ts` (new),
     `plugins/sagas/src/runtime/kv-saga-store_test.ts` (new).
   - Proves: a production `SagaStorePort` over `Deno.Kv` with optimistic-write + correlation +
     transition log + delete; round-trips state, rejects stale `expectedVersion`.
   - Gate: `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/kv-saga-store_test.ts`;
     `run-deno-check.ts --root plugins/sagas/src/runtime --ext ts`.

2. **`feat(sagas): openSagaRuntimeKv + createDurableSagaRuntime default wiring`**
   - Files: `plugins/sagas/src/runtime/create-durable-saga-runtime.ts` (new) + test;
     `plugins/sagas/src/runtime/mod.ts` (barrel re-exports).
   - Proves: default factory opens KV, injects `KvSagaStore`, returns runtime+store+kv; respects
     injected store/kv; closeable.
   - Gate: targeted `deno test --unstable-kv`; check on `plugins/sagas/src/runtime`.

3. **`feat(sagas-core): warn on store-less native engine composition`**
   - Files: `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts` (one-time warn via
     `LoggerPort`), optional `SagaRuntimeNativeOptions.logger?` passthrough; test.
   - Proves: store-less default emits a warning (no silent non-durability); no behavior change when a
     store is present.
   - Gate: `cd packages/plugin-sagas-core && deno task check` (full export map);
     `deno test --unstable-kv --allow-all packages/plugin-sagas-core/tests/runtime/`.

4. **`feat(sagas): wire durable runtime into service composition root`**
   - Files: `plugins/sagas/services/src/main.ts` (use `createDurableSagaRuntime`, capture store/kv,
     close on teardown, fix docstring).
   - Proves: deployed entrypoint constructs a store-backed engine; dbClient no longer the only DB
     consumer.
   - Gate: `run-deno-check.ts --root plugins/sagas/services --ext ts`;
     integration test in slice 6.

5. **`feat(sagas): durable-by-default standalone runner/supervisor`**
   - Files: `plugins/sagas/src/runtime/saga-runner.ts`, `saga-supervisor.ts` (default durable
     `createRuntime`); test asserting standalone runtime gets a store.
   - Gate: targeted `deno test --unstable-kv`; check on `plugins/sagas/src/runtime`.

6. **`test(sagas): cross-restart durability + failure-path integration`**
   - Files: `plugins/sagas/src/runtime/durable-saga-restart_test.ts` (new).
   - Proves (integration): publish to a saga via `createDurableSagaRuntime` over an in-memory
     `Deno.openKv(':memory:')` shared KV; stop; build a SECOND runtime over the SAME Kv; publish a
     correlated message; assert state resumed from persisted version (not `initialState`). Failure
     path: concurrent stale `expectedVersion` write rejected.
   - Gate: `deno test --unstable-kv --allow-all plugins/sagas/src/runtime/durable-saga-restart_test.ts`.

7. **`docs(sagas): correct Prisma-store promise in schema + service docstring`**
   - Files: `plugins/sagas/database/sagas.prisma` (comments), `plugins/sagas/services/src/main.ts:12`
     (docstring).
   - Gate: `run-deno-fmt.ts --root plugins/sagas --ext ts` (TS only); manual diff review (no .prisma
     fmt gate).

8. **`chore(sagas): full validation sweep`**
   - Gate: `cd plugins/sagas && deno task check`; `cd packages/plugin-sagas-core && deno task check`;
     `run-deno-lint.ts` + `run-deno-fmt.ts --ext ts` on both src roots;
     `plugins/sagas` `deno task test`. No scaffold output changes ⇒ `e2e:cli` NOT required for this
     slice (run only at evaluator/merge-readiness if requested).

## Gates to run (summary)
- Per-slice: `deno check --unstable-kv` via `.llm/tools/run-deno-check.ts` (scoped roots, `--ext ts`);
  targeted `deno test --unstable-kv --allow-all`.
- Package-quality: `run-deno-lint.ts`, `run-deno-fmt.ts --ext ts` on `plugins/sagas/src`,
  `plugins/sagas/services/src`, `packages/plugin-sagas-core/src`.
- Fitness (ARCHETYPE-3/5, manual/PENDING_SCRIPT): F-5 surface (3 new plugin runtime exports — within
  budget), F-13 saga invariants (durable state path now real), F-15 (no Deno re-export), F-16/F-18
  (single new file per concern, barrel-only re-export).
- `publish:dry-run` on both packages (no new dep ⇒ should stay green).
- NOT run here: `e2e:cli` (no scaffold-output change), aspire runtime smoke.

## Risk register
- **R1 KV optimistic-write semantics differ from Memory store.** Mitigation: slice 1 + slice 6 test
  the stale-version rejection path explicitly against `MemorySagaStore` parity.
- **R2 Core warn-on-storeless could spam logs.** Mitigation: one-time guard flag; default `NoopLogger`
  so silent unless a logger injected.
- **R3 Read-path divergence** (API reads Prisma/kvdex, engine writes raw Deno.Kv). Mitigation: declared
  out-of-scope and deferred-safe (no contract rework); documented in open-decision sweep so PLAN-EVAL
  sees it is intentional, not missed.
- **R4 Standalone runner default opens KV in environments without KV.** Mitigation: env-driven path
  + injection seam preserved; tests use `:memory:`.

## jsr-audit (planned public surface)
- `@netscript/plugin-sagas-core`: no new root exports; warn-seam is internal. Slow-type risk: none
  (reuses existing typed `SagaStorePort`). PASS-shaped.
- `@netscript/plugin-sagas` runtime subpath: +`KvSagaStore`, `openSagaRuntimeKv`,
  `createDurableSagaRuntime` (+ option types). All concrete, fully-typed, no `Deno.Kv` re-export as
  public type (accept it as a constructor param type — same pattern as triggers, already JSR-clean).
  No `any`, no inferred-return slow types (explicit return annotations required). PASS-shaped.