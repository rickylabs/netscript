# Worklog: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Archetype | `5 — Plugin Package` (runtime subtype; Archetype 6 secondary if generation changes) |
| Scope overlays | `service` |

## Design

### Public Surface

- No new public API. Preserve `RegisterJobInput.entrypoint`, worker runtime startup, and the scaffold CLI surface.

### Domain Vocabulary

- Local job entrypoint — module path interpreted relative to the configured jobs directory unless already project-root-qualified.
- Project root — `NETSCRIPT_PROJECT_ROOT` or the worker process working-directory-derived root.
- Jobs directory — configured root for local job modules.

### Ports

- Existing `WorkerPool` execution port only; no new port is justified.

### Constants

- Existing `NETSCRIPT_PROJECT_ROOT` and configured `jobsDir`; no new finite vocabulary is needed.

### Plugin axes

- Runtime execution composes `@netscript/plugin-workers-core/runtime` definitions and the existing WorkerPool.
- Contracts remain core-owned and imported; the plugin does not redefine them.
- The health-check export and service registration are unchanged.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Harness bootstrap and diagnostic evidence | Aspire worker logs | `.llm/runs/fix-785-workers-healthcheck--codex/*` |
| 2 | Framework path correction and regression | focused Deno test + scoped wrappers | resolver source/test determined by logs |
| 3 | Full evidence and evaluator handoff | `quality:gate`; full `scaffold.runtime` | run artifacts + PR metadata |

### Deferred Scope

- Existing plugin/CLI restructure debt and unrelated task execution paths.

### Contributor Path

Add a local worker job under `workers/jobs`, generate the runtime registry, and verify its entrypoint through the colocated worker execution test before running the scaffold runtime suite.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-16 | 1 | Research | Read issue #785, skills, doctrine, public Deno docs, worker resolver, registry generator, and E2E fixture. |
| 2026-07-16 | 1 | Reproduce | Diagnostic `scaffold.runtime` run started without cleanup so Aspire processor logs remain available. |
| 2026-07-16 | 1 | Diagnose | Reproduced 40 passed / 1 failed and captured the doubled `workers/jobs/workers/jobs/health-check.ts` module path via `aspire logs workers`; stopped the AppHost. |
| 2026-07-16 | 2 | Implement | Normalized local entrypoints already rooted under configured jobsDir; preserved jobs-dir-relative registry behavior. |
| 2026-07-16 | 2 | Reconcile | Issue #785 remains open; draft PR #786 has `Closes #785`, requested taxonomy/milestone, and no new comments requiring readjustment. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep handler and behavior assertion unchanged | Delivery succeeds; evidence points to module resolution | issue #785 and source inspection |
| Fix the owning framework layer | Fixture-only changes would not protect consumers | owner task and A14 |
| Resolve project-root-qualified paths only when they are already within jobsDir | Prevent duplicated prefixes without changing normal `./health-check.ts` resolution | processor logs and registry generator contract |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent harness artifacts and concrete Tier-D thread proof unavailable in checkout/session | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused regression | `deno test --allow-all plugins/workers/worker/job-execution_test.ts plugins/workers/worker/job-dispatcher_test.ts` | PASS | 5 passed / 0 failed |
| Scoped check | `.llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero diagnostics |
| Scoped lint | `.llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero findings |
| Scoped fmt | `.llm/tools/run-deno-fmt.ts --root plugins/workers --ext ts,tsx` | PASS | 93 files, zero findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Quality/doctrine | NOT_RUN | `deno task quality:gate` | Required after implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Diagnostic scaffold runtime | FAIL_REPRODUCED | `.llm/tmp/785-repro*`; `aspire logs workers` | 40 passed / 1 failed; doubled path captured; AppHost stopped |
| Acceptance scaffold runtime | NOT_RUN | canonical cleanup command | Final gate |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scaffolded workers runtime | NOT_RUN | `behavior.workers-executions` | Acceptance target |

## Handoff Notes

- Evaluator should inspect `resolveLocalJobEntrypoint`, its two convention tests, the captured doubled-path evidence, and final `behavior.workers-executions` result first.
