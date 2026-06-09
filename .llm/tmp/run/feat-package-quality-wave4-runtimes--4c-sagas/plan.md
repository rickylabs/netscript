# Plan — Wave 4 · 4c: sagas

Run ID: `feat-package-quality-wave4-runtimes--4c-sagas`
Branch: `feat/package-quality-wave4-runtimes-4c` (PR #20 → umbrella #16)
Base: umbrella `1896f854` (4a `2c24662` + 4b merged, pull-forward `128a0a8`)

## 1. Archetype decisions

### `@netscript/plugin-sagas-core` → **A3 (Runtime/Behavior)**

**Justification:** This package owns long-running stateful behavior with lifecycle and supervised execution:
- `SagaEngine` + `SagaScheduler` + `SagaCompensator` — runtime lifecycle
- `SagaIdempotency` + `SagaState` transitions — per-instance state
- `GarnetListTransport` + `NetScriptRedisTransport` — transport implementations behind `SagaTransportPort`
- `SagaBusBridge` + `SagaBusLegacy` — adapter implementations behind `SagaBusPort`
- `createSagaRuntime()` — composition root with crash boundaries
- `defineSaga()` / `defineQuery()` / `defineSignal()` — builders consumed by runtime

This matches the A3 decision tree question: "Does it own long-running behavior with state?" → Yes.

**Gate delta (recorded in drift.md):**
- F-13 (saga/runtime invariants): **required** (was n/a under pre-A3 registry)
- Runtime/Aspire validation: **required** (was optional)
- Consumer import validation: **required** (was optional)

### `@netscript/plugin-sagas` → **A5 (Plugin Package)**

**Justification:** First-party plugin under `plugins/*`. Re-exports core contracts, provides service entrypoints, Aspire contribution, CLI commands, scaffolding, E2E gates, and runtime processes. Already A5 in registry.

**Required gates:** F-10 test-shape (0 tests → real layer), Runtime/Aspire validation, consumer-import validation.

## 2. Split decision: **4c-core / 4c-plugin**

**Decision: SPLIT.** The 519 family doc-lint + 19/12 entrypoints + 3 over-cap files + 0-test plugin + F-6 hygiene + archetype declaration would produce ~27 slices in a single plan, leaving minimal buffer for drift. Splitting gives each sub-wave headroom and respects dependency order (plugin depends on core).

| Sub-wave | Unit | Slices | Merges first |
|----------|------|--------|-------------|
| **4c-core** | `plugin-sagas-core` | ~14 | **Yes** |
| **4c-plugin** | `plugin-sagas` | ~13 | After 4c-core merges |

**Nested run dirs:**
- 4c-core: `.llm/tmp/run/feat-package-quality-wave4-runtimes--4c-sagas/core/`
- 4c-plugin: `.llm/tmp/run/feat-package-quality-wave4-runtimes--4c-sagas/plugin/`

Each gets its own `commits.md`. 4c-core merges into the umbrella first; 4c-plugin forks off the 4c-core-merged umbrella.

## 3. Locked public surface

### `@netscript/plugin-sagas-core` (19 entrypoints — all retained)

| Entrypoint | Status | Consumers | Notes |
|-----------|--------|-----------|-------|
| `.` | Retain | `packages/cli`, `plugins/triggers`, `plugins/sagas` | Root API |
| `./builders` | Retain | None (builder API surface) | defineSaga/defineQuery/defineSignal |
| `./domain` | Retain | `plugins/triggers`, `plugins/sagas` | Saga types, errors, states |
| `./ports` | Retain | None (port contract surface) | SagaBusPort, SagaTransportPort, SagaStorePort |
| `./runtime` | Retain | `plugins/triggers`, `plugins/sagas` | createSagaRuntime, SagaEngine |
| `./adapters` | Retain | None (adapter surface) | SagaBusBridge, SagaBusLegacy |
| `./transports` | Retain | None (transport implementations) | GarnetListTransport, NetScriptRedisTransport |
| `./stores` | Retain | None (store port re-exports) | Stable subpath for store implementers |
| `./middleware` | Retain | None (Hono middleware) | SSE events, saga middleware |
| `./integration/workers` | Retain | `plugins/workers`, `plugins/sagas` | Worker trigger integration |
| `./integration/publisher` | Retain | `plugins/sagas` | Publisher port |
| `./telemetry` | Retain for alpha | None (OTEL instrumentation) | Flagged for post-alpha review |
| `./config` | Retain | `packages/cli`, `plugins/sagas` | defineSagaConfig |
| `./contracts/v1` | Retain | `packages/cli`, `plugins/sagas` | Versioned contracts |
| `./streams` | Retain | `plugins/sagas` | Re-exports upstream streams-core |
| `./presets` | Retain for alpha | None (startSagas preset) | Flagged for post-alpha review |
| `./abstracts` | Retain for alpha | None (abstract contracts) | Flagged for post-alpha review |
| `./testing` | Retain for alpha | None (testing helpers) | Flagged for post-alpha review |
| `./agent` | Retain for alpha | None (agent runtime) | Flagged for post-alpha review |

**Zero-external-consumer entrypoints:** `./abstracts`, `./testing`, `./telemetry`, `./presets`, `./agent`. Retained for alpha; flagged for post-alpha trimming if consumer evidence remains zero.

### `@netscript/plugin-sagas` (12 entrypoints — all retained)

All 12 retained. See research.md §5 for consumer evidence.

## 4. Work items

### 4c-core work items

| # | Item | Gate | Slice |
|---|------|------|-------|
| C1 | Declare A3 in `docs/architecture.md`; F-6: `check` enumerates all 19 entrypoints, add `test` task | F-5, F-6 | 1 |
| C2 | ptr-fix: mod.ts (17) + builders (14) + config (11) + agent (1) | F-7, F-15 | 2 |
| C3 | ptr-fix: contracts/v1 (19) + domain (4 jsdoc) + streams (4) | F-7, F-15 | 3 |
| C4 | ptr-fix: integration/workers (8) + integration/publisher (6) | F-7, F-15 | 4 |
| C5 | ptr-fix: ports (35) — structural types for port contracts | F-7, F-15 | 5 |
| C6 | ptr-fix: runtime (58) — structural types for runtime exports | F-7, F-15 | 6 |
| C7 | ptr-fix: adapters (23) + middleware (14) + presets (5) | F-7, F-15 | 7 |
| C8 | ptr-fix: transports (24) + stores (11) | F-7, F-15 | 8 |
| C9 | ptr-fix: abstracts (27) + testing (34) | F-7, F-15 | 9 |
| C10 | jsdoc: telemetry (53) + instrumentation.ts (43) + attributes.ts (15) | F-7 | 10 |
| C11 | jsdoc: runtime (48) + saga-engine.ts (9) + saga-scheduler.ts (11) + create-saga-runtime.ts (9) | F-7 | 11 |
| C12 | jsdoc: transports (84) + list-transport.ts (23) + redis-transport.ts (20) + subscriptions | F-7 | 12 |
| C13 | F-1: concept-split redis-transport.ts (480) + list-transport.ts (453) | F-1 | 13 |
| C14 | Validate: deno check all + dry-run + doc-lint sweep | F-6, F-7 | 14 |

### 4c-plugin work items

| # | Item | Gate | Slice |
|---|------|------|-------|
| P1 | F-6: add `publish:dry-run`, `check` enumerates all 12 entrypoints | F-6 | 1 |
| P2 | ptr-fix: contracts/v1 (17) + mod.ts (11) + public (11) | F-7, F-15 | 2 |
| P3 | ptr-fix: plugin (11) + aspire (7) + services (1) | F-7, F-15 | 3 |
| P4 | ptr-fix: cli (11) + runtime (16) | F-7, F-15 | 4 |
| P5 | ptr-fix: streams (5) + streams/server (6) + scaffolding (0 ptr, 6 jsdoc) | F-7, F-15 | 5 |
| P6 | jsdoc: contracts/v1 (26) + cli (7) + scaffolding (6) | F-7 | 6 |
| P7 | jsdoc: runtime (6) + saga-publisher.ts (3) + saga-supervisor.ts (3) + constants.ts (3) | F-7 | 7 |
| P8 | F-1: concept-split `v1.ts` (715) → v1-handlers.ts + v1-helpers.ts + v1-types.ts | F-1 | 8 |
| P9 | F-7: README lift 99→≥150 (doctested) | F-7 | 9 |
| P10 | Test layer: `verify-plugin.ts` + manifest test | F-10 | 10 |
| P11 | Test layer: CLI contribution test | F-10 | 11 |
| P12 | Test layer: Aspire contribution test + E2E gate test | F-10 | 12 |
| P13 | Validate: deno check all + dry-run + doc-lint sweep | F-6, F-7 | 13 |

**Total slices: 27** (14 core + 13 plugin). Under the <30 cap per sub-wave.

## 5. Private-type-ref fix strategy

Per Wave 3 LD-8 + 4a/4b PLAN-EVAL precedent, split by type origin:

| Origin | Strategy | Example |
|--------|----------|---------|
| First-party `@netscript/*` | Explicit type re-export through barrel | `SagaDefinition` from `@netscript/plugin-sagas-core/domain` |
| Third-party (Zod, oRPC, `@saga-bus/core`) | Package-owned structural type | `SagaPayloadSchema` precedent for Zod leaks |
| Internal layer leaking as public | F-5 surface trim (not export) | Internal adapter types |
| Genuinely internal incidental | `@ignore` JSDoc tag | Internal helper types |

**DO NOT blanket-export to silence the linter.**

## 6. F-1 concept-split approach

### `plugins/sagas/services/src/routers/v1.ts` (715 LOC → target <350 each)

Split by concern:
- `v1-handlers.ts` — contract handler implementations (listSagas, getSaga, listInstances, getInstance, publish, subscribe, getInstanceHistory) (≤300)
- `v1-helpers.ts` — mapStateToInstance, mapSagaToResponse, publishSagaMessage, contextSagaRuntime, trace helpers (≤250)
- `v1-types.ts` — SagaServiceDatabaseClient, PrismaRecord, SagaHistoryEntry, SagaInstanceState, SagaInstanceKv, type guards (≤250)

### `packages/plugin-sagas-core/src/transports/redis-transport.ts` (480 LOC → target <350)

Split by concern:
- `redis-transport.ts` — main transport class + public API (≤300)
- `redis-transport-commands.ts` — Redis command builders (XADD, XREADGROUP, XACK, etc.) (≤200)

### `packages/plugin-sagas-core/src/transports/list-transport.ts` (453 LOC → target <350)

Split by concern:
- `list-transport.ts` — main transport class + public API (≤300)
- `list-transport-commands.ts` — list command builders (LPUSH, BRPOP, etc.) (≤200)

## 7. 0→real A5 plugin test layer

Mirror the 4a `plugin-streams` / 4b `plugin-workers` precedent:

| Test file | Proves | Pattern |
|-----------|--------|---------|
| `tests/public/manifest_test.ts` | Manifest exposes expected axes | `assertEquals(plugin.name, ...)` + `verifyPlugin()` |
| `tests/cli/cli_test.ts` | CLI commands register correctly | Import CLI composition, assert command tree |
| `tests/aspire/aspire_test.ts` | Aspire contribution loads | Import aspire mod, assert contribution shape |
| `tests/e2e/e2e-gates_test.ts` | E2E gates are defined | Assert `sagas-health` gate exists |
| `verify-plugin.ts` | Package-owned validation gate | `inspectPlugin()` + contribution axis checks |

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Zod/oRPC ptr leaks (119 total) resist structural-type fix | Medium | High | `@ignore` fallback; document as accepted debt if structural types break runtime |
| F-1 splits break plugin consumers | Low | High | Run `deno check` on all consumers after split; keep old exports as re-exports during transition |
| v1 router split exposes #96 typing drift | Medium | High | Split types first; fix hand-typed Prisma interface as part of P8 |
| Plugin test layer requires Aspire runtime | Medium | Medium | Design tests to run without full Aspire; use mock contributions where possible |
| Slice count drifts >30 during implement | Low | Medium | Core/plugin split provides buffer; rescope if either sub-wave exceeds 18 |
| `plugins/triggers` consumer breaks on core changes | Low | High | Consumer-import check already done; triggers imports from core domain/runtime only |

## 9. Deferred scope

| Item | Why deferred | Target gate |
|------|-------------|-------------|
| Prisma generated-DB artifact fixes | Environment issue, not package debt | Wave 6 CLI / CI setup |
| `check:sagas` task full repair | Depends on generated artifacts | Environment setup |
| Zero-consumer entrypoint trim (`./abstracts`, `./testing`, `./telemetry`, `./presets`, `./agent`) | Alpha allows no-shim removal; trim post-alpha when consumer evidence remains zero | Post-alpha surface review |
| `unanalyzable-dynamic-import` resolution | Non-blocking; accept-and-document | Future lint config |
| Plugin manifest type cast fix (`as unknown as`) | Requires `definePlugin` type refinement in `@netscript/plugin` | Wave 3 follow-up |

## 10. Debt implications

| Debt entry | Action | Owner |
|-----------|--------|-------|
| `packages/sagas` AP-1 / doctrine verdict Refactor (list-transport.ts 847) (arch-debt.md) | **Close** — F-1 splits resolve the transport monolith concern | 4c-core slice C13 |
| New: Zod/oRPC schema ptr leaks in public barrels | Record if `@ignore` fallback used | 4c-core slices C2–C9 |
| New: v1 router hand-typed Prisma interface | Record if not fully resolved in P8 | 4c-plugin slice P8 |
| `cli-maintainer-sync-isolated-declarations` (arch-debt.md) | NOT a 4c concern; remains open for Wave 6 | — |

## 11. Gate set

### 4c-core gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — redis-transport.ts + list-transport.ts splits |
| F-2 Helper-reinvention scan | n/a (A3 runtime, not helpers) |
| F-3 Layering check | Required — ports/adapters/transports/stores/middleware audit |
| F-4 Inheritance audit | Required |
| F-5 Public surface audit | Required — 19 entrypoints locked |
| F-6 JSR publishability | Required — dry-run PASS, check task fix, add test task |
| F-7 Doc-score gate | Required — 397→0 doc-lint |
| F-8 Workspace lib check | Required |
| F-9 Permission decl check | Required |
| F-10 Test-shape audit | Required — 5 existing tests must still pass |
| F-11 Forbidden-folder lint | Required |
| F-12 Naming-convention lint | Required |
| F-13 Saga/runtime invariants | Required — NEW for A3 |
| F-14 Console-log lint | Required |
| F-15 Re-export-upstream lint | Required — ptr-fix strategy |
| F-16 Folder-cardinality lint | Required — 19 entrypoints justified |
| F-17 Abstract-derived co-location | Required |
| F-18 Sub-barrel lint | Required |
| Runtime/Aspire validation | Required — NEW for A3 |
| Consumer import validation | Required — consumer scan done |

### 4c-plugin gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — v1.ts split |
| F-2 Helper-reinvention scan | n/a |
| F-3 Layering check | Required |
| F-4 Inheritance audit | n/a |
| F-5 Public surface audit | Required — 12 entrypoints locked |
| F-6 JSR publishability | Required — add publish:dry-run, fix check task |
| F-7 Doc-score gate | Required — 122→0 doc-lint, README ≥150 |
| F-8 Workspace lib check | Required |
| F-9 Permission decl check | Required |
| F-10 Test-shape audit | Required — 0→4 tests + verify-plugin.ts |
| F-11 Forbidden-folder lint | Required |
| F-12 Naming-convention lint | Required |
| F-13 Saga/runtime invariants | Subtype (plugin delegates to core runtime) |
| F-14 Console-log lint | Required |
| F-15 Re-export-upstream lint | Required |
| F-16 Folder-cardinality lint | Required |
| F-17 Abstract-derived co-location | Required |
| F-18 Sub-barrel lint | Required |
| Runtime/Aspire validation | Required — A5 plugin |
| Consumer import validation | Required — triggers consumes manifest |

## 12. PLAN-EVAL routing

**Option A:** One PLAN-EVAL over the combined 4c plan (archetype decisions + split + slice lists), then separate IMPL-EVAL per sub-wave.

The evaluator reads:
1. `gates/plan-gate.md`
2. `evaluator/plan-protocol.md`
3. This `plan.md` + `research.md` + `worklog.md` Design section
4. `gates/archetype-gate-matrix.md`
5. `docs/architecture/doctrine/06-archetypes.md`

## 13. Open-decision sweep

| Decision | Status | Safe to defer? |
|----------|--------|---------------|
| A3 archetype for core | **Locked** | — |
| 4c-core / 4c-plugin split | **Locked** | — |
| 19-entrypoint surface (all retain) | **Locked** | — |
| F-3 layering verdict (transports swappable) | **Locked** | — |
| Zod/oRPC ptr leak fix strategy (structural vs `@ignore`) | **Locked** — try structural first, `@ignore` fallback | No — affects slices C2–C9 |
| F-1 split file names | **Locked** — see §6 | No — affects slices C13, P8 |
| Test layer mock vs real Aspire | **Locked** — mock contributions, real manifest | No — affects slices P10–P12 |
| v1 router split scope | **Locked** — handlers + helpers + types | No — affects slice P8 |
| Zero-consumer entrypoint trim | Deferred to post-alpha | Yes |
| Plugin manifest type cast fix | Deferred to Wave 3 follow-up | Yes |
| Prisma generated artifacts | Deferred to CI/env | Yes |

All "must resolve now" decisions are locked. No open decision would force rework if deferred.
