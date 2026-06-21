# plan.md — sagas-idempotency-e2e

## Locked scope
Make saga idempotency durable and end-to-end:
1. Extend the HTTP publish contract + service seams to accept and thread `idempotencyKey`.
2. Ship a durable KV-backed `SagaIdempotencyPort` in the `plugins/sagas` layer and wire it into every saga composition root (HTTP service, standalone runner/supervisor).
3. Add a durable applied-key guard at the `SagaEngine` boundary so a replayed message is recognized as "already applied" and does NOT re-run handler effects or re-persist transitions — satisfying doctrine 08 exactly-once-effective.
4. Declare the delivery guarantee in the package/README.

Out of scope (deferred, safe): durable `SagaStorePort` state envelopes (sibling slice `sagas-durable-store`); cascade-target idempotency beyond existing bridge behavior; spawn/signal/query runtime.

## Archetype + overlays
- ARCHETYPE-3 (runtime/behavior) for `packages/plugin-sagas-core`.
- SCOPE-service overlay for `plugins/sagas/services` (HTTP contract + composition root).
- Gate family: universal F-1…F-18 + **F-13 saga/runtime invariants**; Static gates required; Consumer-import validation required (Arch 3). Runtime/Aspire validation NOT triggered (no scaffold change).

## Contract-first design

### C1 — Engine applied-key port (NEW, core, interface-only at engine layer)
`packages/plugin-sagas-core/src/ports/saga-applied-key-port.ts`:
```ts
export type SagaAppliedKeyOutcome = Readonly<{ applied: boolean }>; // applied=true => first time recorded; false => already applied (duplicate)
export interface SagaAppliedKeyStore {
  /** Atomically record (instanceId, idempotencyKey); returns applied=false if already present. */
  recordApplied(instanceId: SagaInstanceId, idempotencyKey: string): Promise<SagaAppliedKeyOutcome>;
}
```
Re-export from `src/ports/mod.ts` and `src/stores/mod.ts`. This is the doctrine "applied-keys store". Default (when none injected): an in-process `MemorySagaAppliedKeyStore` (Map-based, co-located in `src/runtime/saga-applied-keys.ts`) so the engine is never silently a no-op; production injects the durable KV impl. The default is a REAL store (records + rejects), explicitly doc-flagged "process-local; inject durable in production" — not a stub.

### C2 — Engine guard wiring
`SagaEngineOptions` (`saga-engine.ts:51-55`) gains `appliedKeys?: SagaAppliedKeyStore`. Constructor defaults to `new MemorySagaAppliedKeyStore()`. In `#handleEntry` (`:197-251`), AFTER `instanceId` resolution and BEFORE handler invocation, if `message.idempotencyKey` is present: call `recordApplied(instanceId, message.idempotencyKey)`; if `applied===false`, SHORT-CIRCUIT — skip handler + `#persistTransition`, and return a `SagaEngineHandleResult` carrying `alreadyApplied: true` plus the loaded state (re-load via `#store?.load` or initialState). Add `alreadyApplied: boolean` to `SagaEngineHandleResult` (`:31-39`). No throw (doctrine: not a failure).

### C3 — HTTP contract field (additive, optional)
- `plugins/sagas/contracts/v1/sagas.contract.ts`: add `idempotencyKey?: string` to `PublishMessageInput` type (`:143-148`) AND to `PublishMessageInputZodSchema` (`:314-319`) as `z.string().optional().describe('Client idempotency key for dedup on retry')`. Keep both in lockstep.

### C4 — Service seam threading
- `plugins/sagas/services/src/routers/v1-types.ts`: add `idempotencyKey?: string` to `SagaRuntimeMessage` (`:10-23`), `SagaRuntimePublishOptions` (`:25-31`), `SagaPublishMessageInput` (`:78-87`).
- `v1-handlers.ts:213-226`: destructure `idempotencyKey`, set it on the `SagaRuntimeMessage` and pass `{ idempotencyKey, traceparent, tracestate }` into `runtime.publish`. (`SagaPublishOptions.idempotencyKey` already exists, `ports/saga-bus-port.ts:13`.)

### C5 — Durable KV idempotency port (plugin layer)
`plugins/sagas/src/runtime/kv-saga-runtime-stores.ts` (mirror triggers):
- `openSagaRuntimeKv(): Promise<Deno.Kv>` → `Deno.openKv(Deno.env.get('NETSCRIPT_SAGA_KV_PATH'))`.
- `class KvSagaIdempotencyStore implements SagaIdempotencyPort` — `reserve(target, idempotencyKey)`: `key = formatIdempotencyKey(target, idempotencyKey)` (reuse), `kv.atomic().check({key, versionstamp:null}).set(key, {reservedAt}, {expireIn: ttlMs}).commit()`; `accepted = result.ok`; `expiresAt = now + ttlMs`. TTL config field (default 24h to match `DEFAULT_IDEMPOTENCY_TTL_MS`).
- `class KvSagaAppliedKeyStore implements SagaAppliedKeyStore` — `recordApplied(instanceId, key)`: atomic `check(versionstamp:null).set(appliedKey, {appliedAt})` (no TTL, or long TTL); `applied = result.ok`.
- Export both + `openSagaRuntimeKv` from `plugins/sagas/src/runtime/mod.ts`.
- `formatIdempotencyKey` is currently private in core; promote it to an exported helper from `./runtime` (or add `sagaIdempotencyKey(target,key)`); LOCKED: export `sagaIdempotencyKey` from core runtime barrel for adapter reuse.

### C6 — Composition-root wiring
- `plugins/sagas/services/src/main.ts:41-65`: open KV once (`const kv = await openSagaRuntimeKv()`), construct `new KvSagaIdempotencyStore({ kv })` and `new KvSagaAppliedKeyStore({ kv })`, pass `createSagaRuntime({ adapter:'native', native: { idempotency, store: undefined, engineOptions: { appliedKeys } } })`. (Durable state `store` stays out-of-scope here.)
- `create-saga-runtime.ts:89-102`: thread `engineOptions.appliedKeys` into `createSagaEngine` (already spreads `engineOptions`); ensure `appliedKeys` survives the spread.
- `plugins/sagas/src/runtime/saga-runner.ts` + `saga-supervisor.ts`: default `runtimeOptions.native.idempotency`/`engineOptions.appliedKeys` to the KV stores when running as a process (open KV in the runner), so the standalone saga process is durable too. Keep injectable for tests.

### C7 — Delivery-guarantee doc
- Update `plugins/sagas` README (and `packages/plugin-sagas-core` README idempotency section) to state "at-least-once with idempotency keys; duplicate publishes return a structured already-applied outcome." Update `plugins/sagas/services/src/main.ts` header (`:1-13`) to stop over-promising Prisma durability and accurately describe KV idempotency.

## Commit slices (ordered, each gate-able)

1. **core: applied-key port + memory default** — add `saga-applied-key-port.ts`, `saga-applied-keys.ts` (`MemorySagaAppliedKeyStore`), export from `ports/mod.ts`, `stores/mod.ts`, `runtime/mod.ts`; promote/export `sagaIdempotencyKey`. Proves: contract compiles + public surface. Gate: `run-deno-check.ts --root packages/plugin-sagas-core --ext ts` (`deno check --unstable-kv`), `run-deno-lint`, `run-deno-fmt`. Files: 4 + 3 barrels.
2. **core: engine applied-key guard** — extend `SagaEngineOptions`, constructor default, `#handleEntry` short-circuit, `SagaEngineHandleResult.alreadyApplied`. Gate: targeted `deno test --unstable-kv packages/plugin-sagas-core/tests/runtime/saga-engine*`. Files: `saga-engine.ts` (+ test in slice 8).
3. **core: README delivery-guarantee section** — Gate: `deno doc` lint / F-7 doc-score (manual PASS). Files: `packages/plugin-sagas-core/README.md`.
4. **contract: publish idempotencyKey** — extend `PublishMessageInput` type + zod. Gate: `run-deno-check.ts --root plugins/sagas/contracts`. Files: `sagas.contract.ts`.
5. **service: thread idempotencyKey** — `v1-types.ts` (3 types), `v1-handlers.ts` publish helper. Gate: `run-deno-check.ts --root plugins/sagas/services`. Files: 2.
6. **plugin: KV durable stores** — `kv-saga-runtime-stores.ts` (`openSagaRuntimeKv`, `KvSagaIdempotencyStore`, `KvSagaAppliedKeyStore`), export from `plugins/sagas/src/runtime/mod.ts`. Gate: `run-deno-check.ts --root plugins/sagas/src/runtime --ext ts` (with `--unstable-kv`). Files: 2.
7. **wiring: composition roots** — `create-saga-runtime.ts` thread `appliedKeys`; `services/src/main.ts` open KV + inject idempotency+appliedKeys; `saga-runner.ts`/`saga-supervisor.ts` defaults; main.ts header honesty + READMEs. Gate: `run-deno-check.ts` on both roots. Files: 5.
8. **tests** — see Test plan. Gate: `deno test --unstable-kv --allow-all` on both units.
9. **final** — `deno task lint`, `deno task fmt:check` (scoped wrappers, `--ext ts`), `deno task check`, consumer-import validation. No `e2e:cli` (no scaffold change).

## Gates to run
- Per-slice: `.llm/tools/run-deno-check.ts` (with `--unstable-kv` for KV roots), `run-deno-lint.ts`, `run-deno-fmt.ts` (`--ext ts`).
- Unit tests: `deno test --unstable-kv --allow-all` in `packages/plugin-sagas-core` and `plugins/sagas`.
- F-13 saga/runtime invariants: manual PASS evidence (engine guard + terminal-phase unaffected).
- F-6 JSR: `deno publish --dry-run --allow-dirty` for `plugin-sagas-core` (no `Deno.openKv` in published core → slow-type/permission clean).
- Consumer-import validation (Arch 3): import the new barrels from a consumer context.
- NOT run: `e2e:cli` (additive optional contract field, no scaffold output change), Aspire runtime.

## Design
**Two-layer idempotency, matching doctrine 08 and the proven triggers pattern.**
- *Transport dedup* (bridge `reserve`, first-wins TTL) already exists and now becomes durable via `KvSagaIdempotencyStore` injected through the existing `native.idempotency` seam — fixes "lost on restart / not shared across replicas".
- *Effect dedup* (NEW applied-key guard) sits at the engine `#handleEntry` boundary so even raw-engine consumers (public `createSagaEngine`) get exactly-once-effective: a duplicate `idempotencyKey` for the same `instanceId` returns `alreadyApplied:true` WITHOUT re-running the handler or re-persisting a transition. This is the "store records applied keys and rejects duplicates with a structured already-applied outcome" the doctrine requires, and which bridge-only TTL dedup does NOT satisfy.
- *Contract continuity*: the client publisher already sends `idempotencyKey` (`saga-publisher.ts:179`); we open the receiving contract → handler → runtime → bridge/engine path so the key is honored end-to-end.
- *JSR cleanliness*: `Deno.openKv` adapters live in `plugins/sagas` (already depends on `@netscript/kv`), not in the JSR-published core, identical to `KvTriggerIdempotencyStore`.

**Production bar:** durable KV persistence (no memory-only default shipped in the deployed root); structured already-applied outcome (no throw); atomic `check(versionstamp:null).set(expireIn)` reservation (race-safe, replica-shared); env-configurable KV path + TTL; README declares delivery guarantee; full unit + integration + failure-path tests; standalone runner durable too (graceful — KV survives restart).