# Worklog: issue #826 aggregate health

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g1-826-health` |
| Branch         | `fix/826-aggregate-health`                      |
| Archetype      | `4 - Public DSL / Builder`                      |
| Scope overlays | `service`                                       |

## Design

### Public Surface

- `HealthCheck` — gains one optional aggregate-participation property; existing literals remain
  valid.
- `createHealthHandler` — unchanged signature; aggregate behavior ignores explicitly unconfigured
  checks.
- `healthChecks.database|kv|service|custom` — unchanged factory signatures and default inclusion.

### Domain Vocabulary

- configured check — a declared `HealthCheck` that belongs to the running app's active composition.
- excluded check — a declared check explicitly marked unconfigured; it is not invoked or reduced.
- aggregate health — status and detail list computed only from configured checks.

### Ports

- None added. Existing health-check closures are the dependency seams; unit tests provide inert
  fakes/sentinels.

### Constants

- No new finite vocabulary is required. Existing `HEALTH_STATUS` remains authoritative.

### Commit Slices

| # | Slice                                                                                              | Gate                                                                   | Files                                                                     |
| - | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 0 | Research, plan, and Design checkpoint                                                              | supervisor PLAN-EVAL                                                   | nested run-dir artifacts                                                  |
| 1 | Aggregate predicate contract plus per-adapter-class regression coverage and consumer compile proof | focused service tests + scoped service wrappers                        | `packages/service/src/primitives/health.ts`, service tests, run artifacts |
| 2 | `scaffold.runtime` health-path assertion                                                           | narrow E2E harness test/source gate; full suite deferred to supervisor | `.llm/tools/e2e/scaffold-e2e-test.ts`, owning test(s), run artifacts      |

### Deferred Scope

- Health response schema versioning — no response shape is added.
- Adapter auto-discovery/config inference — configuration remains composition-owned.
- Full `scaffold.runtime` execution — supervisor merge-readiness call.

### Contributor Path

Add a dependency health adapter by returning the existing `HealthCheck` shape. Hosts that declare
optional adapters mark inactive instances unconfigured; `createHealthHandler` automatically omits
them from execution, status, and details.

## Progress Log

| Time       | Slice | Step           | Notes                                                                                                                                                                                                                                                          |
| ---------- | ----- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-17 | 0     | research       | Re-baselined branch and issue; located aggregate and four built-in adapter classes.                                                                                                                                                                            |
| 2026-07-17 | 0     | plan           | Contract-first plan recorded before package edits. Awaiting supervisor PLAN-EVAL.                                                                                                                                                                              |
| 2026-07-17 | 0     | plan-eval      | Tier-A supervisor reported PASS with required host-wiring expansion; plan and drift updated before implementation.                                                                                                                                             |
| 2026-07-17 | 1     | implementation | Added pre-invocation filtering, adapter options, provider-aware `defineService` composition, and regression tests.                                                                                                                                             |
| 2026-07-17 | 1     | gates          | Focused/full package tests, consumer compile, scoped wrappers, doc lint, quality scan, and architecture check pass. Initial format finding was corrected; an initial full-test invocation lacked `--allow-write`, then passed with the TLS fixture permission. |
| 2026-07-17 | 2     | implementation | Extended the canonical `scaffold.runtime` users-service health gate to inspect aggregate JSON and require exactly the selected database adapter; SQLite now rejects any MySQL check in the runtime response. |
| 2026-07-17 | 2     | focused gate   | Runtime-gate builder tests pass: 7 passed, 0 failed. Full `scaffold.runtime` remains supervisor-owned. |

## Decisions

| Decision                                                     | Reason                                                                               | Source                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------ |
| Archetype 4 + service overlay                                | Matches doctrine verdict and live HTTP consumer impact.                              | doctrine 10; archetype profile |
| No evaluator dispatch from this lane                         | Explicit implementation-agent brief.                                                 | owner/supervisor instruction   |
| Provider-aware multi-adapter registration in `defineService` | Fix the first-match composition path that can select inactive MySQL in a SQLite app. | Tier-A review + code research  |

## Drift

| Drift                                                         | Severity    | Logged in drift.md |
| ------------------------------------------------------------- | ----------- | ------------------ |
| Host/composition wiring added to original predicate-only plan | significant | yes                |

## Gate Results

### Static Gates

| Gate                 | Command or check                                         | Result | Notes                                                   |
| -------------------- | -------------------------------------------------------- | ------ | ------------------------------------------------------- |
| Plan artifact review | supervisor PLAN-EVAL                                     | PASS   | `plan-eval.md`; verdict received before implementation. |
| Focused behavior     | `deno test ... health_test.ts define-service_test.ts`    | PASS   | 12 passed, 0 failed.                                    |
| Full service tests   | `deno test ... packages/service/tests`                   | PASS   | 83 passed, 0 failed with required permissions.          |
| Scoped check         | `run-deno-check.ts --root packages/service --ext ts,tsx` | PASS   | 40 files, zero diagnostics.                             |
| Scoped lint          | `run-deno-lint.ts --root packages/service --ext ts,tsx`  | PASS   | 40 files, zero diagnostics.                             |
| Scoped format        | `run-deno-fmt.ts --root packages/service --ext ts,tsx`   | PASS   | 40 files, zero findings after correction.               |
| Doc lint             | `deno task doc:lint --root packages/service --pretty`    | PASS   | Two entrypoints, zero diagnostics.                      |
| CLI E2E scoped check | `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | PASS   | 88 files, zero diagnostics.                             |
| CLI E2E scoped lint  | `run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx`  | PASS   | 88 files, zero findings.                                |
| CLI E2E scoped fmt   | `run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`   | PASS   | 88 files, zero findings.                                |

### Fitness Gates

| Gate                 | Result | Evidence                        | Notes                                       |
| -------------------- | ------ | ------------------------------- | ------------------------------------------- |
| quality scan         | PASS   | `deno task quality:scan` exit 0 | No findings; existing allowances unchanged. |
| architecture fitness | PASS   | `deno task arch:check` exit 0   | No failures; pre-existing warnings only.    |

### Runtime Gates

| Gate                    | Result  | Evidence         | Notes                                                           |
| ----------------------- | ------- | ---------------- | --------------------------------------------------------------- |
| focused service health  | PASS    | 12 focused tests | SQLite composition excludes unused MySQL with zero invocations. |
| full `scaffold.runtime` | NOT_RUN | supervisor-owned | Expensive merge-readiness call.                                 |
| runtime assertion unit | PASS    | 7 builder tests  | SQLite gate carries its database axis and asserts one matching database check. |

### Consumer Gates

| Consumer                                       | Result | Evidence                               | Notes                                             |
| ---------------------------------------------- | ------ | -------------------------------------- | ------------------------------------------------- |
| existing `@netscript/service` consumer literal | PASS   | `type-assignability_test.ts`: 2 passed | Optional property preserves structural consumers. |

### Reconcile note — slice 1

Issue #826 remains open and PR #847 remains draft. No new feedback beyond the Tier-A PLAN-EVAL notes
was found. The required scope expansion is reflected in `plan.md` and `drift.md`; no architecture
debt was created.

### Reconcile note — slice 2

The canonical CLI E2E runner already probes the generated `users` resource through Aspire. The
assertion now validates the aggregate body instead of accepting any 2xx response. It requires one
database check named either `database` (single-client composition) or `database:<selected engine>`
(multi-adapter composition), so a SQLite run fails if an unused MySQL adapter appears. The expensive
runtime execution remains reserved for the supervisor merge-readiness pass.

## Handoff Notes

- PLAN-EVAL should verify the locked `configured` name and explicit-false semantics.
- First implementation review should verify filtering occurs before check invocation.
