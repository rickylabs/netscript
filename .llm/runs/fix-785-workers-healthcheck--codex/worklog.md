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

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Keep handler and behavior assertion unchanged | Delivery succeeds; evidence points to module resolution | issue #785 and source inspection |
| Fix the owning framework layer | Fixture-only changes would not protect consumers | owner task and A14 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Parent harness artifacts and concrete Tier-D thread proof unavailable in checkout/session | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused regression | pending | NOT_RUN | Awaiting confirmed root cause |
| Scoped check/lint/fmt | pending | NOT_RUN | After implementation |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Quality/doctrine | NOT_RUN | `deno task quality:gate` | Required after implementation |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Diagnostic scaffold runtime | IN_PROGRESS | `.llm/tmp/785-repro*` | Run intentionally leaves Aspire available for logs |
| Acceptance scaffold runtime | NOT_RUN | canonical cleanup command | Final gate |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Scaffolded workers runtime | NOT_RUN | `behavior.workers-executions` | Acceptance target |

## Handoff Notes

- Evaluator should inspect the resolved entrypoint evidence, focused path regression, and final `behavior.workers-executions` result first.
