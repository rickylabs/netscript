# Plan — Wave 4 · 4b: workers

Run ID: `feat-package-quality-wave4-runtimes--4b-workers`
Branch: `feat/package-quality-wave4-runtimes-4b` (PR #19 → umbrella #16)
Base: umbrella `2c24662` (4a merged) + 4b merge `173357c`

## 1. Archetype decisions

### `@netscript/plugin-workers-core` → **A3 (Runtime/Behavior)**

**Justification:** This package owns long-running stateful behavior with lifecycle and supervised execution:
- `JobDispatcher` + `InProcessJobRunner` — runtime lifecycle
- `KvExecutionState` + `KvJobRegistry` — per-instance state
- `MultiRuntimeTaskExecutor` — supervised execution with crash boundaries
- `WorkflowExecutor` + `WorkflowStepRunner` — state-machine-like execution
- `ShutdownManager` — explicit lifecycle teardown
- `defineJob()` / `defineTask()` / `defineWorkflow()` — builders consumed by runtime

This matches the A3 decision tree question: "Does it own long-running behavior with state?" → Yes.

**Gate delta (recorded in drift.md):**
- F-13 (saga/runtime invariants): **required** (was n/a under A1/A4 registry)
- Runtime/Aspire validation: **required** (was optional)
- Consumer import validation: **required** (was optional)

### `@netscript/plugin-workers` → **A5 (Plugin Package)**

**Justification:** First-party plugin under `plugins/*`. Re-exports core contracts, provides service entrypoints, Aspire contribution, CLI commands, and scaffolding. Already A5 in registry.

**Required gates:** F-10 test-shape (0 tests → real layer), Runtime/Aspire validation, consumer-import validation.

## 2. Split decision: **4b-core / 4b-plugin**

**Decision: SPLIT.** The 603 family doc-lint + 16/9 entrypoints + 0-test plugin + 2 over-cap files + F-6 hygiene + archetype declaration would produce ~27–28 slices in a single plan, leaving no buffer for drift. Splitting gives each sub-wave headroom and respects dependency order (plugin depends on core).

| Sub-wave | Unit | Slices | Merges first |
|----------|------|--------|-------------|
| **4b-core** | `plugin-workers-core` | ~14 | **Yes** |
| **4b-plugin** | `plugin-workers` | ~13 | After 4b-core merges |

**Nested run dirs:**
- 4b-core: `.llm/tmp/run/feat-package-quality-wave4-runtimes--4b-workers/core/`
- 4b-plugin: `.llm/tmp/run/feat-package-quality-wave4-runtimes--4b-workers/plugin/`

Each gets its own `commits.md`. 4b-core merges into the umbrella first; 4b-plugin forks off the 4b-core-merged umbrella.

## 3. Locked public surface

### `@netscript/plugin-workers-core` (16 entrypoints after fold)

| Entrypoint | Status | Consumers | Notes |
|-----------|--------|-----------|-------|
| `.` | Retain | `packages/cli`, `plugins/triggers`, `plugins/workers` | Root API |
| `./builders` | Retain | None (builder API surface) | defineJob/defineTask/defineWorkflow |
| `./contracts/v1` | Retain | `plugins/triggers`, `packages/cli`, `plugins/workers` | Versioned contracts |
| `./registry` | Retain | `plugins/workers/services` | KV + memory registries |
| `./state` | Retain | `plugins/workers/services`, `plugins/workers/worker` | Execution state |
| `./executor` | Retain | `plugins/workers/bin/runtime`, `plugins/workers/worker` | Task executors |
| `./workflow` | Retain | None (alpha surface) | Workflow executor |
| `./streams` | Retain | `plugins/workers/streams`, `plugins/triggers/streams` | Stream re-exports |
| `./presets` | Retain | None (alpha surface) | startWorkers/startCombined |
| `./shutdown` | Retain | None (alpha surface) | Shutdown manager |
| `./schemas` | Retain | `plugins/workers/src/public/mod.ts` | Public schema types |
| `./telemetry` | Retain | None (alpha surface) | OTEL instrumentation |
| `./abstracts` | Retain | `plugins/workers/src/cli`, `plugins/workers/src/scaffolding` | Abstract contracts |
| `./testing` | Retain | None (alpha surface) | Testing helpers |
| `./config` | Retain | `packages/cli`, `plugins/workers/src/cli` | defineWorkers config |
| `./runtime` | Retain | `plugins/triggers`, `packages/cli`, `plugins/workers/*` | Job dispatcher, runner |

**Folded:** `./contracts` → removed (duplicate alias of `./contracts/v1`). Consumer `plugins/workers/contracts.ts` updated to import from `./contracts/v1`.

### `@netscript/plugin-workers` (9 entrypoints)

All 9 retained. See research.md §5 for consumer evidence.

## 4. Work items

### 4b-core work items

| # | Item | Gate | Slice |
|---|------|------|-------|
| C1 | Declare A3 in `docs/architecture.md` | F-5, F-16 | 1 |
| C2 | F-6: `check` task enumerates all 16 entrypoints | F-6 | 2 |
| C3 | Fold `./contracts` → `./contracts/v1`, update consumer | F-5, F-16 | 3 |
| C4 | Fix version mismatch (if core affected) | F-6 | 3 |
| C5 | ptr-fix: builders (14) + config (22) + contracts/v1 (23) | F-7, F-15 | 4 |
| C6 | ptr-fix: executor (29) + registry (11) + runtime (33) | F-7, F-15 | 5 |
| C7 | ptr-fix: abstracts (12) + testing (24) + workflow (10) | F-7, F-15 | 6 |
| C8 | ptr-fix: domain/public-schema Zod leaks (75) | F-7, F-15 | 7 |
| C9 | ptr-fix: remaining (streams 7, state 5, telemetry 1, presets 2, shutdown 0) | F-7, F-15 | 8 |
| C10 | jsdoc: registry (45) + abstracts (45) | F-7 | 9 |
| C11 | jsdoc: testing (32) + executor (29) + workflow (21) | F-7 | 10 |
| C12 | jsdoc: state (18) + contracts/v1 (19) + telemetry (15) + shutdown (8) | F-7 | 11 |
| C13 | F-1: concept-split `workers.contract.ts` (500→<350) | F-1 | 12 |
| C14 | README + module docs for all entrypoints | F-7 | 13 |
| C15 | Validate: deno check all + dry-run + doc-lint sweep | F-6, F-7 | 14 |

### 4b-plugin work items

| # | Item | Gate | Slice |
|---|------|------|-------|
| P1 | F-6: add `publish:dry-run`, `check` enumerates all 9 entrypoints | F-6 | 1 |
| P2 | ptr-fix: contracts/v1 (38) + cli (13) | F-7, F-15 | 2 |
| P3 | ptr-fix: worker (10) + aspire (6) + scaffolding (8) | F-7, F-15 | 3 |
| P4 | ptr-fix: streams (5) + streams/server (7) + services (1) | F-7, F-15 | 4 |
| P5 | jsdoc: scaffolding (21) + contracts/v1 (19) | F-7 | 5 |
| P6 | jsdoc: cli (11) + worker (9) | F-7 | 6 |
| P7 | F-1: concept-split `scheduler.ts` (468→<350) | F-1 | 7 |
| P8 | Test layer: `verify-plugin.ts` + manifest test | F-10 | 8 |
| P9 | Test layer: CLI contribution test | F-10 | 9 |
| P10 | Test layer: Aspire contribution test | F-10 | 10 |
| P11 | Test layer: E2E gate test | F-10 | 11 |
| P12 | README + module docs for all entrypoints | F-7 | 12 |
| P13 | Validate: deno check all + dry-run + doc-lint sweep | F-6, F-7 | 13 |

**Total slices: 27** (14 core + 13 plugin). Under the <30 cap per sub-wave.

## 5. Private-type-ref fix strategy

Per Wave 3 LD-8 + 4a PLAN-EVAL precedent, split by type origin:

| Origin | Strategy | Example |
|--------|----------|---------|
| First-party `@netscript/*` | Explicit type re-export through barrel | `JobHandler` from `@netscript/plugin-workers-core` |
| Third-party (Zod, StandardSchemaV1, oRPC) | Package-owned structural type | `PluginPayloadSchema` precedent for Zod leaks |
| Internal layer leaking as public | F-5 surface trim (not export) | Folded `./contracts` |
| Genuinely internal incidental | `@ignore` JSDoc tag | Internal adapter types |

**DO NOT blanket-export to silence the linter.**

## 6. F-1 concept-split approach

### `workers.contract.ts` (500 LOC → target <350)

Split by contract concern:
- `workers.contract.ts` — main contract assembly (≤300)
- `workers-contract-schemas.ts` — Zod/input schemas (≤200)
- `workers-contract-types.ts` — response types + TypeScript interfaces (≤200)

### `scheduler.ts` (468 LOC → target <350)

Split by runtime concern:
- `scheduler.ts` — main scheduler orchestration (≤300)
- `scheduler-execution.ts` — execution loop + dispatch (≤200)
- `scheduler-state.ts` — state transitions + bookkeeping (≤200)

## 7. 0→real A5 plugin test layer

Mirror the 4a `plugin-streams` precedent:

| Test file | Proves | Pattern |
|-----------|--------|---------|
| `tests/public/manifest_test.ts` | Manifest exposes expected axes | `assertEquals(plugin.name, ...)` + `verifyPlugin()` |
| `tests/cli/cli_test.ts` | CLI commands register correctly | Import CLI composition, assert command tree |
| `tests/aspire/aspire_test.ts` | Aspire contribution loads | Import aspire mod, assert contribution shape |
| `tests/e2e/e2e-gates_test.ts` | E2E gates are defined | Assert `workers-health` gate exists |
| `verify-plugin.ts` | Package-owned validation gate | `inspectPlugin()` + contribution axis checks |

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Zod ptr leaks (75) resist structural-type fix | Medium | High | `@ignore` fallback; document as accepted debt if structural types break runtime |
| F-1 splits break plugin consumers | Low | High | Run `deno check` on all consumers after split; keep old exports as re-exports during transition |
| Plugin test layer requires Aspire runtime | Medium | Medium | Design tests to run without full Aspire; use mock contributions where possible |
| Slice count drifts >30 during implement | Low | Medium | Core/plugin split provides buffer; rescope if either sub-wave exceeds 18 |
| `plugins/sagas` consumer breaks on core changes | Low | High | Consumer-import check already done; sagas imports `workersPlugin` from `@netscript/plugin-workers` only |

## 9. Deferred scope

| Item | Why deferred | Target gate |
|------|-------------|-------------|
| Prisma generated-DB artifact fixes | Environment issue, not package debt | Wave 6 CLI / CI setup |
| `check:workers` task full repair | Depends on generated artifacts | Environment setup |
| Zero-consumer entrypoint trim (`./abstracts`, `./testing`, `./telemetry`, `./shutdown`, `./presets`, `./workflow`) | Alpha allows no-shim removal; trim post-alpha when consumer evidence remains zero | Post-alpha surface review |
| `unanalyzable-dynamic-import` resolution | Non-blocking; accept-and-document | Future lint config |
| Plugin manifest type cast fix (`as unknown as`) | Requires `definePlugin` type refinement in `@netscript/plugin` | Wave 3 follow-up |

## 10. Debt implications

| Debt entry | Action | Owner |
|-----------|--------|-------|
| `workers-contract-structural-server-export` (arch-debt.md) | Close if F-1 split resolves the structural export concern | 4b-core slice C13 |
| `cli-maintainer-sync-isolated-declarations` (arch-debt.md) | NOT a 4b concern; remains open for Wave 6 | — |
| New: Zod schema ptr leaks in `public-schema.ts` | Record if `@ignore` fallback used | 4b-core slice C8 |

## 11. Gate set

### 4b-core gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — workers.contract.ts split |
| F-2 Helper-reinvention scan | n/a (A3 runtime, not helpers) |
| F-3 Layering check | Required |
| F-4 Inheritance audit | Required |
| F-5 Public surface audit | Required — 16 entrypoints locked |
| F-6 JSR publishability | Required — dry-run PASS, check task fix |
| F-7 Doc-score gate | Required — 460→0 doc-lint |
| F-8 Workspace lib check | Required |
| F-9 Permission decl check | Required |
| F-10 Test-shape audit | Required — 5 existing tests must still pass |
| F-11 Forbidden-folder lint | Required |
| F-12 Naming-convention lint | Required |
| F-13 Saga/runtime invariants | Required — NEW for A3 |
| F-14 Console-log lint | Required |
| F-15 Re-export-upstream lint | Required — ptr-fix strategy |
| F-16 Folder-cardinality lint | Required — 16 entrypoints justified |
| F-17 Abstract-derived co-location | Required |
| F-18 Sub-barrel lint | Required |
| Runtime/Aspire validation | Required — NEW for A3 |
| Consumer import validation | Required — consumer scan done |

### 4b-plugin gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — scheduler.ts split |
| F-2 Helper-reinvention scan | n/a |
| F-3 Layering check | Required |
| F-4 Inheritance audit | n/a |
| F-5 Public surface audit | Required — 9 entrypoints locked |
| F-6 JSR publishability | Required — add publish:dry-run |
| F-7 Doc-score gate | Required — 143→0 doc-lint |
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
| Consumer import validation | Required — sagas consumes manifest |

## 12. PLAN-EVAL routing

**Option A:** One PLAN-EVAL over the combined 4b plan (archetype decisions + split + slice lists), then separate IMPL-EVAL per sub-wave.

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
| 4b-core / 4b-plugin split | **Locked** | — |
| `./contracts` fold | **Locked** | — |
| Zod ptr leak fix strategy (structural vs `@ignore`) | **Locked** — try structural first, `@ignore` fallback | No — affects slice C8 |
| F-1 split file names | **Locked** — see §6 | No — affects slices C13, P7 |
| Test layer mock vs real Aspire | **Locked** — mock contributions, real manifest | No — affects slices P8–P11 |
| Zero-consumer entrypoint trim | Deferred to post-alpha | Yes |
| Plugin manifest type cast fix | Deferred to Wave 3 follow-up | Yes |
| Prisma generated artifacts | Deferred to CI/env | Yes |

All "must resolve now" decisions are locked. No open decision would force rework if deferred.
