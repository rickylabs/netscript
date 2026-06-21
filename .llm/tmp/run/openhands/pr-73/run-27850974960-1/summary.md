# PLAN-EVAL — sagas-durable-store

## Summary

Read-only PLAN-EVAL evaluation of the `sagas-durable-store` slice on
`feat/framework-prime-time`. Verified the plan against current tree (re-baselined
post S2/S3/S5/OTel), walked `plan-gate.md` box-by-box, ran the open-decision sweep,
and confirmed all commit slices are ordered and sized. **Verdict: PASS** — the plan
is complete, locked, and addresses every production-bar concern within slice scope.

No repository files modified or committed.

## Per-box check table

| # | Plan-Gate box | Plan location | Verdict |
|---|---|---|---|
| 1 | Research present and current | `research.md` lines 13-72, verified all `file:line` cites against current tree (see Verification section) | ✅ |
| 2 | Decisions locked | `plan-meta.json` `lockedDecisions` (9 items, with rationale); `plan.md` `## Design` and `## Locked scope` | ✅ |
| 3 | Open-decision sweep | `plan-meta.json` `openQuestions` (2 entries: DEFERRED-SAFE read-path + MINOR legacy Prisma tables) — nothing else left open | ✅ |
| 4 | Commit slices | `plan.md` lines 101-158 (8 slices, each ≤ 2 new files, all ordered) | ✅ |
| 5 | Risk register | `plan-meta.json` `risks` (R1-R4) + `plan.md` `## Risk register` with mitigations | ✅ |
| 6 | Gate set selected | `plan.md` lines 159-168 + `plan-meta.json` `archetype` (ARCHETYPE-3+5, SCOPE-service overlay) | ✅ |
| 7 | Deferred scope explicit | `plan.md` lines 11-14 ("Out of scope"), plus read-path divergence flagged in `research.md` lines 73-84 + `openQuestions` | ✅ |
| 8 | jsr-audit (planned public surface) | `plan.md` `## jsr-audit (planned public surface)` lines 181-187; slow-type and Deno re-export risks named and cleared | ✅ |

## Open-decision sweep (independent run)

Decisions the plan leaves open or partially open that could force rework if deferred:

1. **HTTP read-path reconciliation** (`v1-handlers` Prisma branch + `getSagaDb` kvdex branch to consume `KvSagaStore`). Plan flags in `openQuestions` as DEFERRED-SAFE: forces no rework of the store contract or engine wiring delivered here — the new store writes to a raw `Deno.Kv` namespace that is independent of the Prisma/`@olli/kvdex` collections the read path currently uses. **Justified deferral. ✅**
2. **Legacy `sagas.prisma` tables: keep as projection vs remove.** Plan locks "keep as projection, comment-only correction" in `openQuestions` MINOR item — avoids migration churn this slice. **Locked. ✅**
3. **Store default placement: core vs plugin.** Plan locks the plugin layer (`@netscript/plugin-sagas`) with the explicit triggers precedent (`KvTriggerEventStore` lives in `plugins/triggers/src/runtime/`, not in `plugin-triggers-core`). Justified to keep core platform-neutral / KV-free. **Locked. ✅**
4. **KV env-var name.** Plan locks `NETSCRIPT_SAGA_KV_PATH` parallel to `NETSCRIPT_TRIGGER_KV_PATH`. **Locked. ✅**
5. **Key layout (state/correlation/transition prefixes).** Plan locks `['sagas']` with sub-namespaces. **Locked. ✅**

No open decision found that would force rework of this slice's contract or wiring. ✅

## Production / enterprise bar check

| Concern | Plan commitment | Status |
|---|---|---|
| Real durable persistence (no in-memory-only shipped default) | `KvSagaStore` over raw `Deno.Kv`, atomic check/set/list; defaulted via `createDurableSagaRuntime` for service + runner | ✅ |
| Real error handling | `expectedVersion` mismatch → `SagasError.validationFailed` (parity with `MemorySagaStore.save:42-50`); graceful failure in `SagaRuntimeSupervisor.start:75-79` | ✅ |
| Idempotency (state persistence) | Engine passes `expectedVersion` per write (`saga-engine.ts:296-298`); store maps to atomic versionstamp check | ✅ |
| Observability / spans | Out of scope for this slice — separate `sagas-telemetry-spans` Wave-A slice covers spans | ✅ (deferred) |
| Graceful shutdown / drain | Store exposes `close()`; service path closes the KV handle. Full signal-driven drain = separate `service-graceful-shutdown` slice | ✅ (in-scope portion committed) |
| Unit tests | Slice 1 (`kv-saga-store_test.ts`): round-trip, correlation, transitions, delete, stale-version rejection | ✅ |
| Integration tests | Slice 6 (`durable-saga-restart_test.ts`): cross-restart durability over shared in-memory `Deno.openKv(':memory:')` | ✅ |
| Failure-path tests | Slice 1 + slice 6: concurrent stale-version write rejected | ✅ |

No stub / no-op / "reserved-for-future" advertised surface detected. ✅

## Verification (research load-bearing `file:line` spot-check against real tree)

Re-opened and confirmed the actual files on `feat/framework-prime-time` (post S2/S3/S5/OTel re-baseline, current SHA `f85da9c0`-based; per baseline note, ignored stale `cc3b8731` labels):

| Cite | Reality | Match |
|---|---|---|
| `packages/plugin-sagas-core/src/ports/saga-store-port.ts:23` — `SagaStorePort` interface | Line 23 contains the interface declaration; `load`, `save`, `appendTransition`, `findByCorrelation`, `saveCorrelation`, `delete` all present | ✅ |
| `packages/plugin-sagas-core/src/runtime/saga-engine.ts:67` — `readonly #store?: SagaStorePort` | Line 67 contains the field | ✅ |
| `saga-engine.ts:210` — `await this.#store?.load(instanceId)` | Line 210 confirmed | ✅ |
| `saga-engine.ts:259` — `this.#store?.findByCorrelation(...)` | Line 259 confirmed | ✅ |
| `saga-engine.ts:277` — `if (!this.#store) return;` (silent no-op) | Line 277 confirmed | ✅ |
| `saga-engine.ts:296-298` — `save(envelope, { expectedVersion })` optimistic protocol | Lines 296-298 confirmed | ✅ |
| `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:89-93` — store-less native bus | Lines 89-93 confirmed; no default | ✅ |
| `plugins/sagas/services/src/main.ts:63` — `createSagaRuntime({ adapter: 'native' })` | Line 63 confirmed; `dbClient` dropped at line 41/56 (never threaded into runtime) | ✅ |
| `plugins/sagas/services/src/main.ts:12` — "Prisma store for durable saga state" docstring | Line 12 contains the misleading docstring (a documented gap) | ✅ |
| `plugins/sagas/src/runtime/saga-supervisor.ts:65-68` — default runtime forwards runtimeOptions verbatim | Lines 65-68 confirmed | ✅ |
| `plugins/sagas/src/runtime/saga-runner.ts:62-69` — supervisor passes runtimeOptions | Lines 62-69 confirmed | ✅ |
| `implements SagaStorePort` repo-wide | Only `AbstractSagaStore`, `MemorySagaStore`, `RecordingSagaStore` — zero production durable impl | ✅ |
| `packages/plugin-sagas-core/src/stores/mod.ts` | Re-exports types only; subpath exists for external concrete stores | ✅ |
| `plugins/sagas/database/sagas.prisma` references `@saga-bus/store-prisma` | Comments at lines 3/10 claim Prisma backing; package not a dep; never constructed | ✅ |
| Triggers gold-standard `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:27` — `openTriggerRuntimeKv()` | Line 27 confirmed | ✅ |
| `:32` `KvTriggerEventStore implements TriggerEventStorePort` | Line 32 confirmed | ✅ |
| `:104` `KvTriggerIdempotencyStore` | Line 104 confirmed | ✅ |
| `plugins/triggers/services/src/main.ts:100-105` — `kv = options.kv ?? await openTriggerRuntimeKv(); eventStore = options.eventStore ?? new KvTriggerEventStore({ kv })` | Lines 100-105 confirmed (parallels plan's `createDurableSagaRuntime` shape) | ✅ |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts:38-43` — processor default `options.X ?? new KvX({ kv })` | Lines 38-43 confirmed | ✅ |
| `plugins/triggers/src/runtime/mod.ts:6-8` — barrel re-exports | Lines 6-8 confirmed | ✅ |
| `packages/plugin-sagas-core/src/runtime/logger.ts` — `LoggerPort` (line 2) + `NoopLogger` (line 14) | Both confirmed — plan's store-less warn seam uses this exact port | ✅ |

Every cited load-bearing line checks out. The plan is re-baselined. ✅

## Commit-slice ordering + sizing

8 slices, each independently gate-able:

| # | Title | Files | < 30? | Names proof | Names gate |
|---|---|---|---|---|---|
| 1 | `feat(sagas): KvSagaStore durable SagaStorePort` | 2 new | ✅ | yes (round-trip, optimistic-write, correlation, transition log, delete) | `deno test --unstable-kv` + `run-deno-check.ts` |
| 2 | `feat(sagas): openSagaRuntimeKv + createDurableSagaRuntime default wiring` | 2 new | ✅ | yes (default factory, injection, closeable) | targeted deno test + check |
| 3 | `feat(sagas-core): warn on store-less native engine composition` | 1 file + 1 test | ✅ | yes (one-time warn) | `deno task check` + deno test |
| 4 | `feat(sagas): wire durable runtime into service composition root` | 1 file | ✅ | yes (deployed entrypoint store-backed) | `run-deno-check.ts` + integration in slice 6 |
| 5 | `feat(sagas): durable-by-default standalone runner/supervisor` | 2 files | ✅ | yes (standalone gets a store) | targeted deno test + check |
| 6 | `test(sagas): cross-restart durability + failure-path integration` | 1 new | ✅ | yes (two runtimes, shared KV, state resumed; stale-version rejected) | `deno test --unstable-kv` |
| 7 | `docs(sagas): correct Prisma-store promise in schema + service docstring` | 2 files (comment-only) | ✅ | yes (manual diff review) | `run-deno-fmt.ts` |
| 8 | `chore(sagas): full validation sweep` | 0 (gate-only) | ✅ | yes (package check + lint + fmt) | `deno task check`, `run-deno-lint.ts`, `run-deno-fmt.ts`, `deno task test` |

All slices ordered, none exceed the 30-file budget. ✅

## Changes

No files modified or committed. Read-only evaluation.

## Validation

- Walked `plan-gate.md` checklist box by box.
- Read `plan-protocol.md`, `verdict-definitions.md`, `archetype-gate-matrix.md`, archetype profiles 3 + 5, SCOPE-service overlay.
- Read `research.md`, `plan.md`, `plan-meta.json` in full.
- Spot-checked ~20 load-bearing `file:line` claims against the actual repo tree (current SHA, post S2/S3/S5/OTel re-baseline).
- Confirmed `LoggerPort`/`NoopLogger` exist at the cited location (`packages/plugin-sagas-core/src/runtime/logger.ts`).
- Confirmed zero production `SagaStorePort` implementors exist in repo today.
- Confirmed triggers gold-standard pattern is real and unchanged from research citation.

## Responses to review comments or issue comments

None to respond to (read-only PLAN-EVAL run).

## Remaining risks

None for the plan gate. Slice 6 (cross-restart integration test) is the load-bearing
proof of durability — IMPL-EVAL will re-verify that the actual implementation matches
the plan's contract and that the test actually fails before slice 4 lands (negative
proof) and passes after. The read-path divergence is correctly flagged as deferred-
safe; if the follow-up slice slips, the API list/get endpoints will continue to
read from Prisma/kvdex rather than the new KV store — that is documented in
`openQuestions` and in risk R3, so it will not be mistaken for a regression.
