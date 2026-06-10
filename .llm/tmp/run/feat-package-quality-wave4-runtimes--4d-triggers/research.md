# Research — Wave 4 · 4d: triggers

Run ID: `feat-package-quality-wave4-runtimes--4d-triggers`
Branch: `feat/package-quality-wave4-runtimes-4d` (PR #21 → umbrella #16)
Base: umbrella `feat/package-quality-wave4-runtimes` @ `8264a1c` (4a+4b+4c merged; pull-forward `32637a9`)
Date: 2026-06-09

## 1. Full-export doc-lint sweep (MEASURE-FIRST)

### `@netscript/plugin-triggers-core` (11 entrypoints)

| Entrypoint | ptr | jsdoc | total | Notes |
|-----------|-----|-------|-------|-------|
| `./mod.ts` (barrel) | 55 | 23 | 78 | Merged-graph overcount vs per-EP combined (see §1.3) |
| `./src/adapters/mod.ts` | 6 | 3 | 9 | |
| `./src/builders/mod.ts` | 31 | 0 | 31 | All ptr — builder types leak internal domain types |
| `./src/config/mod.ts` | 19 | 8 | 27 | Zod schema ptr leaks |
| `./src/contracts/v1/mod.ts` | 21 | 18 | 39 | oRPC contract ptr leaks |
| `./src/domain/mod.ts` | 2 | 5 | 7 | |
| `./src/ports/mod.ts` | 25 | 31 | 56 | Port contracts missing jsdoc |
| `./src/public/mod.ts` | 55 | 23 | 78 | Same as root barrel (re-export) |
| `./src/runtime/mod.ts` | 19 | 5 | 24 | |
| `./src/telemetry/mod.ts` | 7 | 42 | 49 | instrumentation.ts 34 jsdoc |
| `./src/testing/mod.ts` | 39 | 53 | 92 | Heavy jsdoc gap |
| **Per-EP sum** | **279** | **211** | **490** | Overcounted — same types appear in multiple barrels |
| **Combined run (ground truth)** | **46** | **165** | **211** | Single `deno doc --lint` over all EPs |

**Top files by error count:**
| File | ptr | jsdoc | total |
|------|-----|-------|-------|
| `src/contracts/v1/triggers.contract.ts` | 17 | 18 | 35 |
| `src/telemetry/instrumentation.ts` | 0 | 34 | 34 |
| `src/config/trigger-config-schema.ts` | 18 | 8 | 26 |
| `src/telemetry/attributes.ts` | 4 | 8 | 12 |
| `src/testing/memory-file-watcher-adapter.ts` | 1 | 9 | 10 |
| `src/testing/memory-trigger-scheduler-adapter.ts` | 1 | 9 | 10 |
| `src/ports/trigger-scheduler-port.ts` | 0 | 8 | 8 |
| `src/testing/recording-trigger-event-store.ts` | 0 | 8 | 8 |
| `src/ports/file-watcher-port.ts` | 0 | 7 | 7 |
| `src/testing/trigger-test-clock.ts` | 0 | 7 | 7 |

### `@netscript/plugin-triggers` (10 entrypoints)

| Entrypoint | ptr | jsdoc | total | Notes |
|-----------|-----|-------|-------|-------|
| `./mod.ts` (barrel) | 6 | 3 | 9 | |
| `./services/src/main.ts` | 3 | 1 | 4 | |
| `./src/aspire/mod.ts` | 7 | 0 | 7 | |
| `./src/cli/composition/main.ts` | 11 | 9 | 20 | |
| `./src/plugin/mod.ts` | 6 | 3 | 9 | |
| `./src/public/mod.ts` | 6 | 3 | 9 | |
| `./src/runtime/mod.ts` | 38 | 36 | 74 | Heaviest EP — runtime stores + adapters |
| `./src/scaffolding/mod.ts` | 0 | 6 | 6 | |
| `./streams/mod.ts` | 9 | 0 | 9 | |
| `./streams/server.ts` | 11 | 7 | 18 | |
| **Per-EP sum** | **97** | **68** | **165** | Overcounted |
| **Combined run (ground truth)** | **76** | **62** | **138** | Single `deno doc --lint` over all EPs |

**Top files by error count:**
| File | ptr | jsdoc | total |
|------|-----|-------|-------|
| `src/runtime/kv-trigger-runtime-stores.ts` | 11 | 14 | 25 |
| `src/runtime/cron-trigger-scheduler-adapter.ts` | 10 | 11 | 21 |
| `src/cli/commands.ts` | 9 | 9 | 18 |
| `src/runtime/watchers-file-watcher-adapter.ts` | 8 | 9 | 17 |
| `src/aspire/triggers-contribution.ts` | 7 | 0 | 7 |
| `streams/producer.ts` | 1 | 6 | 7 |
| `src/public/mod.ts` | 6 | 0 | 6 |
| `streams/schema.ts` | 5 | 1 | 6 |
| `src/scaffolding/trigger-scaffolders.ts` | 0 | 6 | 6 |
| `src/runtime/trigger-processor.ts` | 4 | 1 | 5 |

### 1.3 Barrel vs per-entrypoint reconciliation

The per-entrypoint sum **overcounts** private-type-ref because the same private type (e.g., `TriggerEvent`) is referenced from multiple barrels (`mod.ts`, `public/mod.ts`, `builders/mod.ts`). The **combined run** (all entrypoints in one invocation) is the ground truth:

- Core: 46 ptr (not 279), 165 jsdoc (not 211), 211 total (not 490)
- Plugin: 76 ptr (not 97), 62 jsdoc (not 68), 138 total (not 165)

**The full-barrel `mod.ts` lint undercounts total errors** (core barrel = 78 vs combined 211; plugin barrel = 9 vs combined 138) because `mod.ts` only re-exports `src/public/mod.ts`. The per-entrypoint combined run is the definitive gate.

## 2. `deno publish --dry-run`

| Unit | Result | Slow types | Notes |
|------|--------|-----------|-------|
| `plugin-triggers-core` | **PASS** | 0 | |
| `plugin-triggers` | **PASS** | 0 | 2 `unanalyzable-dynamic-import` warnings (non-blocking) |

## 3. `deno check --unstable-kv` all entrypoints

| Unit | Result | Errors |
|------|--------|--------|
| `plugin-triggers-core` (11 EPs) | **PASS** | 0 |
| `plugin-triggers` (10 EPs) | **PASS** | 0 |

## 4. Consumer scan

### `@netscript/plugin-triggers-core` consumers

| Consumer | Import path | Surface used |
|----------|-------------|--------------|
| `packages/cli` (fixture) | `./config` | `defineTriggers` |
| `packages/plugin` (test) | `.` | `defineWebhook` |
| `plugins/triggers` | `.`, `./builders`, `./domain`, `./ports`, `./runtime`, `./telemetry` | Builders, domain types, ports, runtime, telemetry |
| `plugins/workers` | `./config` | `defineTriggers` |

**Zero external consumers** — safe to rename/restructure without back-compat shims (alpha).

### `@netscript/plugin-triggers` consumers

| Consumer | Import path | Surface used |
|----------|-------------|--------------|
| `packages/cli` (test fixture) | `.` | manifest name |

No runtime consumers outside the repo. The plugin is consumed by the CLI scaffold generator and the E2E test suite.

## 5. File-size audit (F-1)

### `plugin-triggers-core`

| File | LOC | Status |
|------|-----|--------|
| `src/runtime/trigger-processor.ts` | 321 | Under cap |
| `src/runtime/create-trigger-ingress.ts` | 234 | Under cap |
| `src/contracts/v1/triggers.contract.ts` | 267 | Under cap |
| `src/telemetry/instrumentation.ts` | 234 | Under cap |
| `src/domain/errors.ts` | 144 | Under cap |

**No F-1 violations in core.**

### `plugin-triggers`

| File | LOC | Status |
|------|-----|--------|
| `test-webhooks-e2e.ts` | **423** | **OVER CAP** — F-1 violation |
| `src/cli/triggers-cli-backend-support.ts` | 245 | Under cap |
| `src/runtime/kv-trigger-runtime-stores.ts` | 237 | Under cap |
| `src/runtime/watchers-file-watcher-adapter.ts` | 236 | Under cap |
| `src/cli/generate-runtime-registries.ts` | 232 | Under cap |
| `src/cli/commands.ts` | 218 | Under cap |
| `src/cli/triggers-cli-backend.ts` | 211 | Under cap |
| `src/runtime/cron-trigger-scheduler-adapter.ts` | 209 | Under cap |

**One F-1 violation:** `test-webhooks-e2e.ts` at 423 LOC.

## 6. Test inventory

| Unit | Test files | Status |
|------|-----------|--------|
| `plugin-triggers-core` | 3 (`create-trigger-ingress_test.ts`, `trigger-processor_test.ts`, `testing_test.ts`) | Present |
| `plugin-triggers` | **0** | **MISSING** — A5 F-10 violation |

Core `deno.json` tasks: `check` only (no `test`, no `publish:dry-run`).
Plugin `deno.json` tasks: `check`, `test`, `publish:dry-run` (test task exists but no test files to run).

## 7. docs/ gap

| Unit | docs/ dir | README LOC | Code blocks |
|------|----------|-----------|-------------|
| `plugin-triggers-core` | **MISSING** | 430 | 24 |
| `plugin-triggers` | **MISSING** | 284 | 18 |

Both READMEs exist and are substantial, but neither has a `docs/` tree (F-7 doc-score gap). This is **unique to 4d** — all other Wave-4 families (streams, watchers, workers, sagas) already ship `docs/`.

## 8. Health probe (OQ-D)

| Item | Value |
|------|-------|
| Port | **8093** (confirmed in `src/constants.ts`, `scaffold.plugin.json`, `README.md`) |
| Health endpoint | `GET /health` (Hono router in `services/src/routers/health.ts`) |
| E2E gate | `behavior.triggers-health` → `http://127.0.0.1:8093/health` |
| E2E result on base `8264a1c` | **PASS** (16ms) |

The `triggers-health` gate passes on the current umbrella base. The health router is live and correctly wired into the Aspire contribution. 4d owns validating this as the A5 runtime evidence.

## 9. `verify-plugin.ts` gap

| Unit | File | Status |
|------|------|--------|
| `plugin-triggers` | `verify-plugin.ts` | **MISSING** |
| `plugin-workers` | `verify-plugin.ts` | Present (4b precedent) |
| `plugin-streams` | `verify-plugin.ts` | Present (4a precedent) |
| `plugin-sagas` | `verify-plugin.ts` | Present (4c precedent) |

All sibling A5 plugins have `verify-plugin.ts`. Triggers is the only one missing it.

## 10. F-6 task hygiene

| Unit | `check` | `test` | `publish:dry-run` | `check` enumerates all EPs? |
|------|---------|--------|-------------------|---------------------------|
| `plugin-triggers-core` | `deno check --unstable-kv mod.ts` | **MISSING** | **MISSING** | **NO** — only `mod.ts` |
| `plugin-triggers` | `deno check --unstable-kv mod.ts` | `deno test --allow-all --unstable-kv` | Present | **NO** — only `mod.ts` |

Both `check` tasks must enumerate all exports entrypoints.

## 11. Archetype determination

### `@netscript/plugin-triggers-core` → **A3 (Runtime/Behavior)**

Justification:
- `TriggerProcessor` + `createTriggerIngress` + `createTriggerProcessor` — runtime lifecycle
- `TriggerSchedulerPort` + `TriggerEventStorePort` + `FileWatcherPort` — port contracts with runtime invariants
- `defineWebhook` / `defineFileWatch` / `defineScheduledTrigger` — builders consumed by runtime
- Trigger firing, scheduling, deduplication, and DLQ behavior — stateful runtime invariants
- `DurableTrigger` concept (ack-then-process, idempotency, retry) — runtime guarantee

This matches the A3 decision tree: "Does it own long-running behavior with state?" → Yes.

### `@netscript/plugin-triggers` → **A5 (Plugin Package)**

Already A5 in registry. First-party plugin under `plugins/*`. Provides service entrypoints, Aspire contribution, CLI commands, scaffolding, E2E gates, and runtime processes.

## 12. Summary

| Metric | Core | Plugin | Family |
|--------|------|--------|--------|
| Doc-lint (ground truth) | 211 (46 ptr + 165 jsdoc) | 138 (76 ptr + 62 jsdoc) | **349** |
| Dry-run | PASS | PASS | — |
| Slow types | 0 | 0 | — |
| `deno check` all EPs | PASS | PASS | — |
| Tests | 3 | **0** | — |
| docs/ | **MISSING** | **MISSING** | — |
| verify-plugin.ts | n/a | **MISSING** | — |
| F-1 over-cap | 0 | 1 (`test-webhooks-e2e.ts` 423) | — |
| F-6 check-all-EPs | **NO** | **NO** | — |
