# Plan — Wave 4 · 4d: triggers

Run ID: `feat-package-quality-wave4-runtimes--4d-triggers`
Branch: `feat/package-quality-wave4-runtimes-4d` (PR #21 → umbrella #16)
Base: umbrella `feat/package-quality-wave4-runtimes` @ `8264a1c` (4a+4b+4c merged; pull-forward `32637a9`)

## 1. Archetype decisions

### `@netscript/plugin-triggers-core` → **A3 (Runtime/Behavior)**

**Justification:** This package owns trigger firing, scheduling, deduplication, and DLQ behavior with stateful runtime invariants:
- `TriggerProcessor` + `createTriggerIngress` + `createTriggerProcessor` — runtime lifecycle
- `TriggerSchedulerPort` + `TriggerEventStorePort` + `FileWatcherPort` + `TriggerIdempotencyPort` — port contracts with runtime guarantees
- `defineWebhook` / `defineFileWatch` / `defineScheduledTrigger` — builders consumed by runtime
- Ack-then-process webhook ingress, cron-backed scheduling, file-watch adapters — long-running behavior
- `DurableTrigger` concept (idempotency, retry, dead-letter) — stateful runtime invariant

This matches the A3 decision tree: "Does it own long-running behavior with state?" → Yes.

**Gate delta (recorded in drift.md):**
- F-13 (trigger/runtime invariants): **required** (was n/a under pre-A3 registry)
- Runtime/Aspire validation: **required** (was optional)
- Consumer import validation: **required** (was optional)

### `@netscript/plugin-triggers` → **A5 (Plugin Package)**

Already A5 in registry. First-party plugin under `plugins/*`. Provides service entrypoints, Aspire contribution, CLI commands, scaffolding, E2E gates, and runtime processes.

**Required gates:** F-10 test-shape (0 tests → real layer), Runtime/Aspire validation, consumer-import validation.

## 2. Combined-vs-split decision: **COMBINED**

**Decision: NO SPLIT.** The 349 family doc-lint + 21 entrypoints + 1 F-1 violation + 0-test plugin + 2 missing docs/ dirs fits comfortably under the <30 slice cap in a single plan.

| Factor | Value | Assessment |
|--------|-------|------------|
| Family doc-lint | 349 | Lightest Wave-4 family (4c was 519 split) |
| Entrypoints | 21 (11 + 10) | Modest count |
| F-1 violations | 1 | Single file split |
| Test layer | 0 → 4 tests + verify-plugin.ts | Standard A5 pattern |
| docs/ dirs | 2 missing | Unique 4d workload |
| Slices estimated | 23 | Well under <30 cap |

**Rationale:** 4d is the **last sub-wave**. A split would add sub-wave orchestration overhead (nested run dirs, separate PRs, sequential merges) for marginal benefit. The combined plan keeps the umbrella closeout simple: one PLAN-EVAL, one IMPL-EVAL, one merge.

## 3. Locked public surface

### `@netscript/plugin-triggers-core` (11 entrypoints — all retained)

| Entrypoint | Status | Consumers | Notes |
|-----------|--------|-----------|-------|
| `.` | Retain | `plugins/triggers`, `plugins/workers`, `packages/cli` | Root API |
| `./adapters` | Retain | None (adapter surface) | Webhook verifiers |
| `./builders` | Retain | `plugins/triggers` | defineWebhook/defineFileWatch/defineScheduledTrigger |
| `./config` | Retain | `packages/cli`, `plugins/workers` | defineTriggers |
| `./contracts/v1` | Retain | `packages/cli` | Versioned oRPC contracts |
| `./domain` | Retain | `plugins/triggers` | Trigger types, errors, events |
| `./ports` | Retain | `plugins/triggers` | Port contracts |
| `./public` | Retain | None (re-export barrel) | Same as root |
| `./runtime` | Retain | `plugins/triggers` | createTriggerProcessor, createTriggerIngress |
| `./telemetry` | Retain for alpha | None (OTEL instrumentation) | Flagged for post-alpha review |
| `./testing` | Retain for alpha | None (testing helpers) | Flagged for post-alpha review |

### `@netscript/plugin-triggers` (10 entrypoints — all retained)

| Entrypoint | Status | Consumers | Notes |
|-----------|--------|-----------|-------|
| `.` | Retain | `packages/cli` (fixture) | Root manifest |
| `./aspire` | Retain | None (Aspire contribution) | triggers-contribution.ts |
| `./cli` | Retain | None (CLI composition) | Command tree |
| `./public` | Retain | None (manifest types) | TriggersPluginManifest |
| `./plugin` | Retain | None (re-export) | triggersPlugin |
| `./runtime` | Retain | None (runtime adapters) | Cron, KV, watchers adapters |
| `./scaffolding` | Retain | None (scaffolders) | Trigger scaffolders |
| `./services` | Retain | None (service entry) | triggers-api main.ts |
| `./streams` | Retain | None (stream topics) | Producer, schema |
| `./streams/server` | Retain | None (stream server) | Server entry |

**Zero external consumers** — safe to restructure without back-compat shims (alpha).

## 4. Work items (locked slices)

| # | Item | Gate | Files | Slice |
|---|------|------|-------|-------|
| D1 | F-6 hygiene: core `check` enumerates all 11 EPs; add `test` + `publish:dry-run` tasks | F-6 | `packages/plugin-triggers-core/deno.json` | 1 |
| D2 | F-6 hygiene: plugin `check` enumerates all 10 EPs | F-6 | `plugins/triggers/deno.json` | 2 |
| D3 | Core ptr-fix: builders (31) + domain re-exports (2) — export builder-local types + domain types through public barrel | F-7, F-15 | `src/builders/*.ts`, `src/builders/mod.ts`, `src/public/mod.ts` | 3 |
| D4 | Core ptr-fix: contracts/v1 (21) + config (19) — third-party (oRPC/Zod) structural types or `@ignore` | F-7, F-15 | `src/contracts/v1/triggers.contract.ts`, `src/config/trigger-config-schema.ts` | 4 |
| D5 | Core ptr-fix: ports (25) + runtime (19) + adapters (6) — export referenced types through barrels | F-7, F-15 | `src/ports/*.ts`, `src/ports/mod.ts`, `src/runtime/*.ts`, `src/runtime/mod.ts`, `src/adapters/mod.ts` | 5 |
| D6 | Core ptr-fix: telemetry (7) + testing (39) — export referenced types or structural types | F-7, F-15 | `src/telemetry/*.ts`, `src/telemetry/mod.ts`, `src/testing/*.ts`, `src/testing/mod.ts` | 6 |
| D7 | Core jsdoc: telemetry batch (instrumentation 34 + attributes 8 + other 8 = 50) | F-7 | `src/telemetry/instrumentation.ts`, `src/telemetry/attributes.ts` | 7 |
| D8 | Core jsdoc: ports (31) + domain (5) + runtime (5) + adapters (3) = 44 | F-7 | `src/ports/*.ts`, `src/domain/*.ts`, `src/runtime/*.ts`, `src/adapters/*.ts` | 8 |
| D9 | Core jsdoc: testing (53) + contracts/v1 (18) = 71 | F-7 | `src/testing/*.ts`, `src/contracts/v1/triggers.contract.ts` | 9 |
| D10 | Plugin ptr-fix: public/mod.ts (6) + mod.ts (6) + plugin/mod.ts (6) + aspire (7) = 25 — first-party `@netscript/*` re-exports | F-7, F-15 | `src/public/mod.ts`, `mod.ts`, `src/plugin/mod.ts`, `src/aspire/mod.ts` | 10 |
| D11 | Plugin ptr-fix: runtime (38) — export runtime adapter types | F-7, F-15 | `src/runtime/*.ts`, `src/runtime/mod.ts` | 11 |
| D12 | Plugin ptr-fix: cli (11) + streams (9) + streams/server (11) = 31 — export CLI/streams types | F-7, F-15 | `src/cli/*.ts`, `src/cli/composition/main.ts`, `streams/*.ts`, `streams/server.ts` | 12 |
| D13 | Plugin ptr-fix: services (3) + scaffolding (0 ptr, 6 jsdoc) + constants (3 jsdoc) | F-7, F-15 | `services/src/main.ts`, `src/scaffolding/*.ts`, `src/constants.ts` | 13 |
| D14 | Plugin jsdoc: runtime batch (kv-stores 14 + cron-adapter 11 + watchers 9 + processor 1 + runtime-processor 1 = 36) | F-7 | `src/runtime/*.ts` | 14 |
| D15 | Plugin jsdoc: cli batch (commands 9 + composition 9 + triggers-cli 0 + cli-backend 0 = 18) | F-7 | `src/cli/commands.ts`, `src/cli/composition/main.ts` | 15 |
| D16 | Plugin jsdoc: streams (producer 6 + schema 1 + server 7) + scaffolding (6) + constants (3) = 23 | F-7 | `streams/producer.ts`, `streams/schema.ts`, `streams/server.ts`, `src/scaffolding/*.ts`, `src/constants.ts` | 16 |
| D17 | F-1: concept-split `test-webhooks-e2e.ts` (423) → `tests/e2e/webhooks-health_test.ts` + `tests/e2e/webhooks-ingress_test.ts` + `tests/e2e/webhooks-security_test.ts` | F-1 | `test-webhooks-e2e.ts` (delete), `tests/e2e/*.ts` (create) | 17 |
| D18 | A5 test layer: `verify-plugin.ts` + manifest test | F-10 | `verify-plugin.ts`, `tests/public/manifest_test.ts` | 18 |
| D19 | A5 test layer: CLI contribution test | F-10 | `tests/cli/cli_test.ts` | 19 |
| D20 | A5 test layer: Aspire contribution test + E2E gate test | F-10 | `tests/aspire/aspire_test.ts`, `tests/e2e/e2e-gates_test.ts` | 20 |
| D21 | F-7: core docs/ tree (`docs/README.md`, `docs/architecture.md`, `docs/getting-started.md`, `docs/reference/ports.md`, `docs/reference/testing.md`) | F-7 | `packages/plugin-triggers-core/docs/**/*.md` | 21 |
| D22 | F-7: plugin docs/ tree (`docs/README.md`, `docs/architecture.md`, `docs/getting-started.md`, `docs/recipes/webhooks.md`, `docs/recipes/schedules.md`, `docs/recipes/file-watching.md`) | F-7 | `plugins/triggers/docs/**/*.md` | 22 |
| D23 | Validate: deno check all EPs + dry-run + doc-lint sweep + consumer-import check | F-6, F-7 | — | 23 |

**Total slices: 23** (well under <30 cap).

## 5. Private-type-ref fix strategy (LD-8 split-by-origin)

Per Wave 3 LD-8 + 4a/4b/4c PLAN-EVAL precedent:

| Origin | Strategy | Example |
|--------|----------|---------|
| First-party `@netscript/*` | Explicit type re-export through barrel | `JobDefinition` from `@netscript/plugin-workers-core` → re-export in `src/public/mod.ts` |
| Third-party (Zod, oRPC) | Package-owned structural type or `@ignore` | `TriggerConfigSchema` Zod leaks → structural interface; oRPC contract types → `@ignore` if internal |
| Internal layer leaking as public | Export the referenced type from its owning barrel | `TriggerEvent` referenced by builders → export from `src/domain/mod.ts` and re-export in builders |
| Genuinely internal incidental | `@ignore` JSDoc tag | Internal helper types not meant for consumers |

**DO NOT blanket-export to silence the linter.**

## 6. F-1 concept-split approach

### `plugins/triggers/test-webhooks-e2e.ts` (423 LOC → target <200 each)

The file is a standalone E2E script with a custom `TestResult` interface. Convert to proper Deno tests and split by concern:

- `tests/e2e/webhooks-health_test.ts` — health check (`GET /health`) + trigger registration verification (≤150)
- `tests/e2e/webhooks-ingress_test.ts` — open webhook POST, secured webhook valid HMAC, unknown path (≤150)
- `tests/e2e/webhooks-security_test.ts` — invalid HMAC, tampered body, rate limit test (≤150)
- `tests/e2e/webhooks-events_test.ts` — listEvents API verification (≤100)

Delete `test-webhooks-e2e.ts` after conversion. Wire new tests into `deno.json` `test` task.

## 7. 0→real A5 plugin test layer

Mirror the 4a `plugin-streams` / 4b `plugin-workers` / 4c `plugin-sagas` precedent:

| Test file | Proves | Pattern |
|-----------|--------|---------|
| `verify-plugin.ts` | Package-owned validation gate | `inspectPlugin()` + contribution axis checks (services, contractVersions, aspire, e2e gates) |
| `tests/public/manifest_test.ts` | Manifest exposes expected axes | `assertEquals(plugin.name, ...)` + `verifyTriggersPlugin()` |
| `tests/cli/cli_test.ts` | CLI commands register correctly | Import CLI composition, assert command tree shape |
| `tests/aspire/aspire_test.ts` | Aspire contribution loads | Import aspire mod, assert contribution shape |
| `tests/e2e/e2e-gates_test.ts` | E2E gates are defined | Assert `triggers-health` gate exists in manifest |

`verify-plugin.ts` must return `{ ok: boolean, inspection: InspectionReport, findings: string[] }` and exit 0/1 when run as main.

## 8. docs/ tree design

### `@netscript/plugin-triggers-core` docs/

| File | Purpose | Doctested |
|------|---------|-----------|
| `docs/README.md` | Package overview, quick start | Yes |
| `docs/architecture.md` | A3 archetype declaration, ports/adapters/runtime diagram, trigger lifecycle | No |
| `docs/getting-started.md` | defineWebhook, defineFileWatch, defineScheduledTrigger examples | Yes |
| `docs/reference/ports.md` | Port contract catalog | No |
| `docs/reference/testing.md` | Testing primitives (memory adapters, test clock) | Yes |

### `@netscript/plugin-triggers` docs/

| File | Purpose | Doctested |
|------|---------|-----------|
| `docs/README.md` | Plugin overview, installation | Yes |
| `docs/architecture.md` | Aspire contribution, service topology, health probe | No |
| `docs/getting-started.md` | Scaffold, CLI usage | Yes |
| `docs/recipes/webhooks.md` | Webhook setup, HMAC verification | Yes |
| `docs/recipes/schedules.md` | Cron schedule configuration | Yes |
| `docs/recipes/file-watching.md` | File watch trigger setup | Yes |

Both READMEs must be lifted to ≥150 LOC doctested (core already 430, plugin 284 — both pass the length bar but need doctest verification).

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Zod/oRPC ptr leaks (40 total) resist structural-type fix | Medium | High | `@ignore` fallback; document as accepted debt if structural types break runtime |
| F-1 split breaks existing `test-webhooks-e2e.ts` consumers | Low | Low | No external consumers; file was unwired — safe to delete after conversion |
| Plugin test layer requires Aspire runtime | Medium | Medium | Design tests to run without full Aspire; use mock contributions where possible |
| docs/ authoring exceeds slice buffer | Low | Medium | Core and plugin docs are separate slices (D21, D22); each is self-contained |
| `plugins/triggers` consumer breaks on core changes | Low | High | Consumer-import check already done; triggers imports from core domain/runtime only |
| Slice count drifts >30 during implement | Low | Medium | 23 slices with 7-buffer; rescope only if drift exceeds 30 |

## 10. Deferred scope

| Item | Why deferred | Target gate |
|------|-------------|-------------|
| `unanalyzable-dynamic-import` resolution | Non-blocking warnings; accept-and-document | Future lint config |
| Zero-consumer entrypoint trim (`./telemetry`, `./testing` in core) | Alpha allows no-shim removal; trim post-alpha when consumer evidence remains zero | Post-alpha surface review |
| Prisma generated-DB artifact fixes | Environment issue, not package debt | Wave 6 CLI / CI setup |
| `check:triggers` task full repair | Depends on generated artifacts | Environment setup |
| Plugin manifest type cast fix (`as unknown as`) | Requires `definePlugin` type refinement in `@netscript/plugin` | Wave 3 follow-up |

## 11. Gate set

### `@netscript/plugin-triggers-core` (A3) gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — no core violations |
| F-2 Helper-reinvention scan | n/a (A3 runtime, not helpers) |
| F-3 Layering check | Required — ports/adapters/runtime audit |
| F-4 Inheritance audit | Required |
| F-5 Public surface audit | Required — 11 entrypoints locked |
| F-6 JSR publishability | Required — dry-run PASS, fix check task, add test + publish:dry-run |
| F-7 Doc-score gate | Required — 211→0 doc-lint |
| F-8 Workspace lib check | Required |
| F-9 Permission decl check | Required |
| F-10 Test-shape audit | Required — 3 existing tests must still pass |
| F-11 Forbidden-folder lint | Required |
| F-12 Naming-convention lint | Required |
| F-13 Trigger/runtime invariants | Required — NEW for A3 |
| F-14 Console-log lint | Required |
| F-15 Re-export-upstream lint | Required — ptr-fix strategy |
| F-16 Folder-cardinality lint | Required — 11 entrypoints justified |
| F-17 Abstract-derived co-location | Required |
| F-18 Sub-barrel lint | Required |
| Runtime/Aspire validation | Required — NEW for A3 |
| Consumer import validation | Required — consumer scan done |

### `@netscript/plugin-triggers` (A5) gates

| Gate | Status |
|------|--------|
| F-1 File-size lint | Required — `test-webhooks-e2e.ts` split |
| F-2 Helper-reinvention scan | n/a |
| F-3 Layering check | Required |
| F-4 Inheritance audit | n/a |
| F-5 Public surface audit | Required — 10 entrypoints locked |
| F-6 JSR publishability | Required — fix check task |
| F-7 Doc-score gate | Required — 138→0 doc-lint, docs/ tree |
| F-8 Workspace lib check | Required |
| F-9 Permission decl check | Required |
| F-10 Test-shape audit | Required — 0→5 tests + verify-plugin.ts |
| F-11 Forbidden-folder lint | Required |
| F-12 Naming-convention lint | Required |
| F-13 Trigger/runtime invariants | Subtype (plugin delegates to core runtime) |
| F-14 Console-log lint | Required |
| F-15 Re-export-upstream lint | Required |
| F-16 Folder-cardinality lint | Required — 10 entrypoints justified |
| F-17 Abstract-derived co-location | Required |
| F-18 Sub-barrel lint | Required |
| Runtime/Aspire validation | Required — A5 plugin (health probe @ 8093) |
| Consumer import validation | Required — CLI fixture consumes manifest |

## 12. PLAN-EVAL routing

**Option A:** One PLAN-EVAL over the combined 4d plan, then one IMPL-EVAL.

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
| Combined plan (no split) | **Locked** | — |
| 21-entrypoint surface (all retain) | **Locked** | — |
| F-3 layering verdict (ports/adapters/runtime) | **Locked** | — |
| Zod/oRPC ptr leak fix strategy (structural vs `@ignore`) | **Locked** — try structural first, `@ignore` fallback | No — affects slices D4 |
| F-1 split file names | **Locked** — see §6 | No — affects slice D17 |
| Test layer mock vs real Aspire | **Locked** — mock contributions, real manifest | No — affects slices D18–D20 |
| docs/ tree scope | **Locked** — see §8 | No — affects slices D21–D22 |
| Zero-consumer entrypoint trim | Deferred to post-alpha | Yes |
| Plugin manifest type cast fix | Deferred to Wave 3 follow-up | Yes |
| Prisma generated artifacts | Deferred to CI/env | Yes |

All "must resolve now" decisions are locked. No open decision would force rework if deferred.
