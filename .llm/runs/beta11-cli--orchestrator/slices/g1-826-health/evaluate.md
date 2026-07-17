# Evaluation: g1-826-health (aggregate health excludes unconfigured adapters)

## Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g1-826-health`               |
| Target         | `packages/service` aggregate health + scaffold runtime probe  |
| Archetype      | `4 - Public DSL / Builder`                                    |
| Scope overlays | `service`                                                     |
| Evaluator      | IMPL-EVAL — open model `qwen/qwen3.7-max` on `formal_evaluation` lane — 2026-07-18 |

## Process Verification

| Check                                  | Result | Evidence                                                                                      |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` from Tier-A Fable 5 supervisor, 2026-07-17, before slice 1.     |
| Design section exists in worklog       | PASS   | `worklog.md ## Design` (Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices). |
| Commit slices match design plan        | PASS   | 3 implementation commits: `c74a277c` (slice 1), `2a99cd75` (slice 2), `13f63490` (readiness fix from Tier-A review) — ordered and aligned with plan slices. |
| Each slice has a passing gate          | PASS   | worklog gate tables per slice: focused service 12/12 + consumer 2/2 (slice 1); runtime-gate builder 7/7 (slice 2); readiness regression + 84 service tests (slice 3). |
| No speculative seams (unused files)    | PASS   | Diff touches only `packages/service/src/primitives/health.ts`, `packages/service/src/presets/define-service.ts`, `packages/service/src/builder/service-builder*.ts`, `packages/cli/e2e/{src/application/gates/scaffold/runtime-gates.ts,tests/application/builders/runtime-gates_test.ts}` plus tests and run artifacts. All map to plan scope. |
| Constants used for finite vocabularies | PASS   | Provider alias vocabulary hoisted into named `DATABASE_PROVIDER_ALIASES` in `define-service.ts:49-52`; `HEALTH_STATUS` already named. No inline magic strings for dispatch. |

## Static Gates

| Gate             | Command or check                                                            | Result | Evidence                                                                  | Notes                                       |
| ---------------- | --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| Focused tests    | `deno test --allow-env --allow-net --allow-read --allow-run --allow-write --unstable-kv packages/service/tests/health_test.ts packages/service/tests/define-service_test.ts` | PASS   | IMPL-EVAL run: `13 passed | 0 failed (287ms)`                           | Includes all 4 adapter-class exclusions, configured-failure, aggregate SQLite selection, **readiness preservation regression** (134-171). |
| Runtime-gate test | `deno test --allow-env --allow-read packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | PASS   | IMPL-EVAL run: `7 passed | 0 failed (4ms)`                                  | `runtime service health gate asserts only the selected sqlite adapter` verifies `databaseChecks.length === 1` and `database:${expectedDatabase}`. |
| Consumer compile | `deno test packages/service/tests/type-assignability_test.ts`              | PASS   | IMPL-EVAL run: `2 passed | 0 failed (14ms)`                                 | Optional `configured?: boolean` preserves structural consumers.  |
| Scoped check     | `run-deno-check.ts --root packages/service --ext ts,tsx`                   | PASS   | IMPL-EVAL run: 40 files selected, 0 occurrences.                          |                                             |
| Scoped lint      | `run-deno-lint.ts --root packages/service --ext ts,tsx`                    | PASS   | IMPL-EVAL run: 40 files selected, 0 occurrences.                          |                                             |
| Scoped format    | `run-deno-fmt.ts --root packages/service --ext ts,tsx`                     | PASS   | IMPL-EVAL run: 40 files selected, 0 findings.                             | Format correction from slice 1 held.        |
| Doc lint         | `deno task doc:lint --root packages/service --pretty`                      | PASS   | IMPL-EVAL run: 2 entrypoints, 0 diagnostics (0 private-type-ref, 0 missing-jsdoc). | New `HealthCheckAdapterOptions` is exported and JSDoc'd. |
| Quality scan     | `deno task quality:scan`                                                   | PASS   | IMPL-EVAL run: `ok:true, findings:[]`, allowanceCount stays at 7 (all pre-existing, none in diff). | No new `any`/lint ignore/forbidden cast.    |
| Architecture     | `deno task arch:check`                                                     | PASS   | IMPL-EVAL run: exit 0; only pre-existing INFO/WARN on unrelated packages.  |                                             |
| Publish dry-run  | n/a                                                                        | n/a    | Slice scope; no publish action taken.                                      | Existing service slow-type carve-out unchanged. |
| Link/path check  | n/a                                                                        | n/a    | No README/Markdown/link changes in slice.                                  |                                             |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                                  | Violations |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | `deno task arch:check` exit 0 (no new >300-line file in scope).           |            |
| F-2  | Helper-reinvention scan           | PASS   | `createHealthHandler` is reused; no new wrapper for existing filter/map.  |            |
| F-3  | Layering check                    | PASS   | `primitives/` remains dependency-leaf; `presets/define-service.ts` imports `primitives/health.ts` only. |            |
| F-4  | Inheritance audit                 | PASS   | Builder impl class unchanged except optional third arg on `withDatabase`. |            |
| F-5  | Public surface audit              | PASS   | `mod.ts` exports `HealthCheckAdapterOptions` (single additive type).     |            |
| F-6  | JSR publishability                | PASS   | Doc lint 0 diagnostics. New type is optional → consumer literals compile unchanged. |            |
| F-7  | Doc-score gate                    | PASS   | `HealthCheckAdapterOptions` and each adapter option argument carry JSDoc.  |            |
| F-8  | Workspace `lib` override          | N/A    | No deno.json lib changes.                                                 |            |
| F-9  | Permission declaration            | PASS   | No new permissions required; excluded adapters perform zero I/O (D2).     |            |
| F-10 | Test-shape audit                  | PASS   | New tests assert predicate behavior via Hono request/response, not mocks. |            |
| F-11 | Forbidden-folder lint             | PASS   | No new folders under `packages/service`.                                  |            |
| F-12 | Naming                            | PASS   | `configured`, `HealthCheckAdapterOptions`, `DATABASE_PROVIDER_ALIASES` all conventional. |            |
| F-13 | Saga/runtime invariants           | N/A    | Change not in saga/worker/trigger layer.                                  |            |
| F-14 | Console-log lint                  | PASS   | `quality:scan` 0 findings.                                                |            |
| F-15 | Re-export-of-upstream lint        | PASS   | No new re-exports.                                                        |            |
| F-16 | Folder-cardinality lint           | PASS   | `packages/service/src/primitives/` unchanged in count.                    |            |
| F-17 | Abstract-derived co-location      | N/A    | No abstract derivation in scope.                                          |            |
| F-18 | Sub-barrel lint                   | PASS   | `mod.ts` only adds a single public type re-export.                        |            |
| F-19 | Scoped source gate runners        | PASS   | Scoped wrappers used (check/lint/fmt on `packages/service` and `packages/cli/e2e`). |            |

## Runtime Gates

| Gate                        | Validation                                                                                                                                                 | Result | Evidence                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Per-adapter-class exclusion | `health_test.ts:20-52` — database/kv/service/custom each built with a sentinel that **throws if invoked**; all four pass with `configured: false, checks: []`. | PASS   | IMPL-EVAL focused test re-run: 4/4 adapter exclusions ok.                            |
| Configured failure          | `health_test.ts:54-73` — `configured: true` failure still returns 503 / unhealthy / `configured-failure` name.                                              | PASS   | IMPL-EVAL focused test re-run: configured-failure assertion ok.                      |
| Multi-adapter composition   | `define-service_test.ts:94-132` — SQLite-only with `DB_PROVIDER=sqlite` selects `database:sqlite`, `mysql` adapter never queried (mysqlQueries===0).       | PASS   | IMPL-EVAL focused test re-run: aggregate selection ok; zero MySQL invocation.        |
| Readiness preservation      | `define-service_test.ts:134-171` — ready=true then rejectQuery toggles ready=false with 503 (configured DB readiness preserved across slice 3 fix).        | PASS   | IMPL-EVAL focused test re-run: both branches pass — slice-3 fix is correct.          |
| Provider-aware `withDatabase` signature additive | `service-builder.ts:67-73` — third arg `healthCheckOptions?: HealthCheckAdapterOptions` is optional; existing two-arg callers still compile.                                     | PASS   | Existing type-assignability tests + full service suite (84/84 per worklog) green.    |
| Scaffold runtime assertion  | `runtime-gates.ts:379-395` — `aggregateHealthMatches` requires `status:"healthy"`, exactly one `database*` check named either `database` or `database:<engine>`. SQLite run fails if MySQL leaks in. Unit test `runtime-gates_test.ts:74-90` asserts this. | PASS   | IMPL-EVAL runtime-gate test re-run: 7/7 including the SQLite assertion ok.           |
| Full `scaffold.runtime`     | Supervisor-owned merge-readiness gate (plan D5 / drift entry 2).                                                                                           | NOT_RUN| Plan-non-scope; reserved for supervisor.                                             |

## Consumer Gates

| Consumer                                      | Validation                                                                     | Result | Evidence                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| Existing `@netscript/service` consumer literal | `packages/service/tests/type-assignability_test.ts` — existing HealthCheck assignments still type-check because `configured` is optional. | PASS   | IMPL-EVAL run: 2/2 pass. Optional property preserves structural consumers.     |
| Generated database-backed service              | `.llm/tools/e2e/scaffold-e2e-test.ts` path strengthened to parse aggregate JSON; full execution supervisor-owned. | NOT_RUN| Supervisor-owned; unit test over builder covers the assertion semantics itself. |

## Anti-Pattern Check

Only marked where the run scope touched or risked the pattern.

| AP    | Status        | Evidence                                                                                         | Notes                                                                 |
| ----- | ------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| AP-1  | CLEAR         | `HealthCheck.configured` is a single optional boolean on an existing interface.                  | No new helper/registry/abstraction.                                   |
| AP-2  | N/A           |                                                                                                  |                                                                       |
| AP-3  | N/A           |                                                                                                  |                                                                       |
| AP-4  | N/A           |                                                                                                  |                                                                       |
| AP-5  | N/A           |                                                                                                  |                                                                       |
| AP-6  | N/A           |                                                                                                  |                                                                       |
| AP-7  | N/A           |                                                                                                  |                                                                       |
| AP-8  | N/A           |                                                                                                  |                                                                       |
| AP-9  | CLEAR         | Plan D1 — signal lives on the existing `HealthCheck` contract; no new registry/adapter abstraction. | Preserves AP-9 avoidance.                                             |
| AP-10 | N/A           |                                                                                                  |                                                                       |
| AP-11 | CLEAR         | Provider read is explicit and passed via `DB_PROVIDER`/`DATABASE_PROVIDER` env; configuration is composition-supplied, not inferred from adapter names. | Env reads are scoped to preset; no hidden global lookup.              |
| AP-12 | N/A           |                                                                                                  |                                                                       |
| AP-13 | N/A           |                                                                                                  |                                                                       |
| AP-14 | N/A           |                                                                                                  |                                                                       |
| AP-15 | N/A           |                                                                                                  |                                                                       |
| AP-16 | N/A           |                                                                                                  |                                                                       |
| AP-17 | N/A           |                                                                                                  |                                                                       |
| AP-18 | N/A           |                                                                                                  |                                                                       |
| AP-19 | CLEAR         | Excluded checks perform zero I/O (filter-before-invocation, D2). No new permissions requested.    | AP-19 preserved.                                                      |
| AP-20 | N/A           |                                                                                                  |                                                                       |
| AP-21 | N/A           |                                                                                                  |                                                                       |
| AP-22 | N/A           |                                                                                                  |                                                                       |
| AP-23 | N/A           |                                                                                                  |                                                                       |
| AP-24 | CLEAR         | `DATABASE_PROVIDER_ALIASES` named constant; no switch/name-dispatch over adapter classes.         | AP-24 avoided.                                                        |
| AP-25 | CLEAR         | No new side-effect paths; excluded adapters are filtered BEFORE `Promise.allSettled` (D2).        | Existing adapter-edge invocations (db/kv/fetch) preserved.            |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                                       |
| --------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| New entries           | 0     | No new `debt/arch-debt.md` entry created; none required.                                       |
| Resolved entries      | 0     | Existing service Refactor verdict and T4 slow-type carve-out remain open.                       |
| Deepened violations   | 0     | Additive optional field; no new folder, no new public entrypoint, no deeper shape debt.        |
| Unrecorded violations | 0     | All changes in line with plan; no hidden drift.                                                  |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | None at IMPL-EVAL altitude. | — | — |

### Observations (informational, not blocking)

- The slice-1 omission of readiness (caught by Tier-A) was fixed before sign-off as commit `13f63490` and is now regression-tested in `define-service_test.ts:134-171`. The fix is additive on the builder interface (optional third arg on `withDatabase`) so callers outside this slice keep compiling — verified by the type-assignability consumer test.
- Drift entries (3) are complete: significant provider-aware composition expansion, minor runtime-probe upgrade, significant readiness correction. All carry severity, action, and evidence fields.
- `DATABASE_PROVIDER_ALIASES` is a small, documented vocabulary that cleanly handles `postgres↔postgresql` and `mssql↔sqlserver` naming; this is a justified finite constant, not AP-24.

## Lessons for Promotion

| Lesson                               | Pattern                                                                 | Applies to            | Confidence |
| ------------------------------------ | ----------------------------------------------------------------------- | --------------------- | ---------- |
| Predicate must be driven by host wiring | An optional aggregate predicate alone is insufficient when the preset composition layer can select the wrong adapter. | Archetype 4 (preset-driven public DSL) | high       |
| Readiness regression surface        | When slice work touches builder-owned readiness, the third-argument extension of `withX` is an independent regression axis from the primary predicate. | Archetype 4 builder   | high       |
| Runtime probe needs aggregate proof | Status-only probe hides adapter leakage; parsing `/health` body for exact adapter set is cheap and catches the defect end-to-end. | scaffold/runtime gates | medium     |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Issue #826 acceptance gates are satisfied. Aggregate health excludes unconfigured adapters via a pre-invocation filter (`configured !== false`) with four per-adapter-class exclusion tests and a configured-failure authoritative test. Provider-aware multi-adapter composition in `defineService` selects the configured provider from `DB_PROVIDER`/`DATABASE_PROVIDER`; single-db path remains additive/back-compatible. The scaffold runtime probe now asserts aggregate semantics and exact adapter set (unit-tested). The readiness regression caught by Tier-A reviewers (omitted second `withDatabase` arg) is fixed in commit `13f63490` with a regression test covering both ready and not-ready states; the `withDatabase` signature extension is additive. All scoped static gates (check/lint/fmt/doc-lint/quality/arch) are green; consumer compile is green. Drift is fully logged (3 entries). No architecture debt created or deepened. `scaffold.runtime` full execution remains supervisor-owned `NOT_RUN` per plan D5. Stop-lines (no publish, no milestone close) are honored. |
