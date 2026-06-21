# research.md — sagas-idempotency-e2e

Baseline: worktree `.claude/worktrees/fw-prime-time` at branch `main`, tip `cc3b8731` (clean). All file:line refs below were re-confirmed against current main (post S2/S3/S5/OTel landings). Where a cited line shifted it is corrected here; where a gap is already resolved it is called out.

## Slice intent
End-to-end saga idempotency: (1) accept the inbound `idempotencyKey` over the HTTP publish contract; (2) thread it through the service publish helper → runtime → bridge; (3) replace the in-memory dedup default with a durable, KV-backed `SagaIdempotencyPort` wired in the deployed composition root; (4) add a durable applied-key guard at the engine boundary so a replayed message does not re-run handler effects / re-persist transitions. Units: `packages/plugin-sagas-core`, `plugins/sagas`.

## Ground-truth confirmation per gap

### GAP idempotency-e2e-saga-api-drops-idempotency-key (blocker, dropped-input) — CONFIRMED
- `plugins/sagas/contracts/v1/sagas.contract.ts:143-148` — `PublishMessageInput` type = `{ type; payload?; correlationId?; topic? }`. No `idempotencyKey`. CONFIRMED.
- `plugins/sagas/contracts/v1/sagas.contract.ts:314-319` — `PublishMessageInputZodSchema` = `z.object({ type, payload, correlationId, topic })`; bound to `POST /publish` at `:437-444`. oRPC strips any inbound `idempotencyKey`. CONFIRMED (lines exact).
- `plugins/sagas/services/src/routers/v1-handlers.ts:209-241` — `publishSagaMessage` destructures only `{ type, payload, correlationId }` (`:213`), builds `SagaRuntimeMessage` with no `idempotencyKey` (`:214-221`), and calls `runtime.publish(message, { traceparent, tracestate })` (`:223-226`) with no idempotency option. CONFIRMED.
- `plugins/sagas/services/src/routers/v1-types.ts:10-23` (`SagaRuntimeMessage`), `:25-31` (`SagaRuntimePublishOptions`), `:78-87` (`SagaPublishMessageInput`) — none carry `idempotencyKey`. CONFIRMED (these three types are the local seams that must gain the field).
- `plugins/sagas/src/runtime/saga-publisher.ts:170-185` — `createPublishHttpInput` already SENDS `idempotencyKey` in the HTTP body (`:179`). So the client→server key exists on the wire and is discarded server-side. CONFIRMED.
- `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts:74-84` — `publish()` only reserves/dedups when `idempotencyKey` is present (`const idempotencyKey = options.idempotencyKey ?? message.idempotencyKey; if (idempotencyKey && !await this.#reserve(...)) return;`). With the key dropped upstream, dedup is bypassed. CONFIRMED.

### GAP idempotency-e2e-saga-dedup-in-memory-default (blocker, unwired-root) — CONFIRMED
- `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts:177-187` — `toIdempotencyPort()` returns `new MemorySagaIdempotencyStore()` when the `idempotency` arg is undefined. CONFIRMED.
- `packages/plugin-sagas-core/src/runtime/saga-idempotency.ts:33-126` — `SagaIdempotencyDedupTable` is a private `Map<string,DedupEntry>` (`#entries`, `:37`); `MemorySagaIdempotencyStore implements SagaIdempotencyPort` wraps it (`:96-126`); JSDoc `:33` says "use a durable port in production". CONFIRMED.
- `plugins/sagas/services/src/main.ts:63` — `sagaRuntime = createSagaRuntime({ adapter: 'native' })` supplies no `native.idempotency` / no `native.store`. This is the deployed entrypoint (`import.meta.main` → `createSagasService` at `:88-91`). CONFIRMED.
- `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:24-33` (`SagaRuntimeNativeOptions.idempotency` exists), `:89-102` (`createNativeBus` forwards `options.idempotency` into the bridge). The seam is wired but `main.ts` never sets it. CONFIRMED.
- Repo-wide `implements SagaIdempotencyPort`: only `MemorySagaIdempotencyStore` (`saga-idempotency.ts:96`) + test `RecordingIdempotencyStore` (`src/testing/`). Triggers ships durable `KvTriggerIdempotencyStore` (`plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:104`) — the proven pattern; no saga equivalent. CONFIRMED.

### GAP idempotency-e2e-saga-engine-replay-no-applied-key (high, partial) — CONFIRMED
- `packages/plugin-sagas-core/src/runtime/saga-engine.ts:102-105` — `SagaEngine.publish()` calls `this.handle(message)` with no dedup; engine holds only `#store?: SagaStorePort` (`:67`), no idempotency port. CONFIRMED.
- `saga-engine.ts:142-157` (`handle`) and `:197-251` (`#handleEntry`) always invoke the handler (`:225`) and call `#persistTransition` (`:230-241`). `attempt` flows only into `SagaContext` (`:220`), never into an applied-key/version guard. CONFIRMED.
- `saga-engine.ts:107-121` — `dispatchCascaded` forwards `idempotencyKey` into `publish({...})` (`:118`) but `publish()`/`handle()` never read it (`publish` ignores `_options`). CONFIRMED.
- `packages/plugin-sagas-core/src/runtime/mod.ts:63` — `createSagaEngine` and `SagaEngine` are public exports; a consumer driving the raw engine bypasses the bridge reservation entirely. CONFIRMED.
- `saga-bus-bridge.ts:44,53,74-84,137-139` — the only `reserve()` lives in `SagaBusBridge` ABOVE the engine; the engine layer is unguarded. `saga-idempotency.ts:50-70` — bridge dedup is an in-memory TTL reservation keyed `(target.kind:target.id:idempotencyKey)` via `formatIdempotencyKey` (`:165-167`), first-wins, NOT a durable applied-key check against persisted state. CONFIRMED.
- `docs/architecture/doctrine/08-runtime-state-failure.md:202-221` — "Exactly-once-effective = at-least-once plus deduplication via idempotency keys… The store records 'applied keys' and rejects duplicates with a structured 'already applied' outcome that the supervisor records but does not treat as a failure." Quote matches verbatim; filename confirmed `08-runtime-state-failure.md`. CONFIRMED.

### GAP sagas-core-idempotency-memory-only (medium, interface-only) — CONFIRMED (folds into dedup-in-memory-default)
- `saga-idempotency.ts:33` JSDoc + `:96` `MemorySagaIdempotencyStore` only first-party impl; `saga-bus-bridge.ts:180-182` defaults to it. Triggers `KvTriggerIdempotencyStore` (`plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:104`) is the contrast. CONFIRMED. This gap is the package-level statement of the same defect resolved by the durable-port + wiring slices below.

### GAP sagas-idempotency-memory-only-in-service (medium, partial) — CONFIRMED (folds into wiring)
- `plugins/sagas/services/src/main.ts:63` no `native.idempotency`; `create-saga-runtime.ts:89-101` forwards undefined; `saga-bus-bridge.ts:177-187` → memory. Same defect; resolved by wiring slice. CONFIRMED.

## Existing contracts / seams to REUSE (do not reinvent)

1. **`SagaIdempotencyPort`** — `packages/plugin-sagas-core/src/ports/saga-idempotency-port.ts:7-13`:
   `reserve(target: SagaIdempotencyTarget, idempotencyKey: string): Promise<SagaIdempotencyReservation>`.
   `SagaIdempotencyReservation = { accepted; key; expiresAt }` (`saga-idempotency.ts:21-25`). Re-exported from `./ports`, `./runtime`, `./stores`. The durable adapter MUST implement THIS interface unchanged — first-wins reserve semantics already match doctrine ("rejects duplicates").
2. **`SagaIdempotencyTarget`** (`saga-idempotency.ts:6-9`) + `sagaMessageIdempotencyTarget`/`cascadedMessageIdempotencyTarget` (`:128-152`) + `formatIdempotencyKey` (`:165-167`). Reuse the existing key format `${kind}:${id}:${idempotencyKey}` so durable and memory ports are interchangeable.
3. **`SagaRuntimeNativeOptions.idempotency`** (`create-saga-runtime.ts:32`) + `createNativeBus` thread-through (`:89-102`) + `SagaBusBridgeOptions.idempotency` (`saga-bus-bridge.ts:33`). The injection seam already exists end-to-end inside core; only `main.ts` fails to populate it.
4. **`SagaMessage.idempotencyKey`** (`packages/plugin-sagas-core/src/domain/saga-message.ts:9`) — domain already carries the field; `SagaPublishOptions.idempotencyKey` (`ports/saga-bus-port.ts:13`) too. No domain change needed.
5. **KV durable-store pattern** — `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts`:
   - `openTriggerRuntimeKv()` (`:27-29`) wraps `Deno.openKv(Deno.env.get('NETSCRIPT_TRIGGER_KV_PATH'))`.
   - `KvTriggerIdempotencyStore.resolveKey` (`:121-131`) uses `kv.atomic().check({key, versionstamp:null}).set(key, val, {expireIn})` — the exact atomic first-wins-with-TTL primitive the saga store needs.
   - Wired in service main `plugins/triggers/services/src/main.ts:102-104` (open KV, construct store, pass into runtime). This is the wiring template.
   - Exported from `plugins/triggers/src/runtime/mod.ts:6-8`. Mirror for sagas.
6. **HTTP publisher already sends the key** — `plugins/sagas/src/runtime/saga-publisher.ts:179` puts `idempotencyKey` in the body. No client change required; only the receiving contract/handler must accept it.
7. **oRPC contract+schema pattern** — `sagas.contract.ts` pairs a `Readonly<{}>` type (`PublishMessageInput`, `:143`) with `z.ZodType<PublishMessageInput>` (`PublishMessageInputZodSchema`, `:314`). Both must be extended in lockstep (TS + zod) or `deno check` fails the `z.ZodType<...>` assignment.

## Doctrine constraints
- **08-runtime-state-failure.md:202-221** — the applied-key/duplicate-rejection contract; the engine guard and durable port must satisfy it (structured "already applied" outcome, not a thrown failure).
- **08:204-221** — README must declare the delivery guarantee ("at-least-once with idempotency keys"). The sagas README/package doc must state it; otherwise "incomplete".
- **ARCHETYPE-3 fitness F-13 (saga/runtime invariants)** + universal F-1…F-18. JSR (F-6) applies to `plugin-sagas-core`: the durable KV store uses `Deno.openKv`, which is a runtime global, but to keep the published core JSR-clean and avoid an `unstable-kv` slow-type/permission surface, the **KV adapter lives in the `plugins/sagas` layer** (which already imports `@netscript/kv` — `plugins/sagas/deno.json:29` — and is not a JSR-published unit), exactly as triggers does. `plugin-sagas-core` gains only an interface-level applied-key store port + engine guard (no `Deno.openKv`).

## Debt / boundary implications
- The durable store decision is **KV via `Deno.openKv`**, mirroring triggers, NOT Prisma/Postgres. The `sagas-durable-store` sibling slice (state envelopes) is a separate concern; this slice is idempotency/applied-keys only and must not regress or block on the SagaStorePort work. The applied-key store added here is a NEW small port; it does not reuse `SagaStorePort`.
- `packages/plugin-sagas-core/src/stores/mod.ts` is the role-named subpath for external/durable store TYPES (`:24-33`). New applied-key port type re-exports there.
- Do NOT touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or version pins. `@netscript/cli` publishes last (untouched).
- No scaffold-output change → `e2e:cli` not required (the contract field is additive/optional; generated registries unaffected).

## Already-resolved check
None of the five cited gaps are resolved on main. The injection seams (`native.idempotency`, `SagaMessage.idempotencyKey`, bridge `reserve`) EXIST but are unpopulated/unguarded — that is the defect, not a resolution.