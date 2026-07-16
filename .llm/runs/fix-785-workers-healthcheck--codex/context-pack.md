# Context Pack: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Current phase | `implementation complete — awaiting opposite-family IMPL-EVAL` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Issue #785 was reproduced as 40 passed / 1 failed. Worker processor logs proved that local resolution doubled `workers/jobs`, producing `<project>/workers/jobs/workers/jobs/health-check.ts`. The framework resolver now recognizes project-root-qualified paths already under jobsDir while preserving the normal jobs-dir-relative convention. Flow-B now uses a separate job scaffolded through the ordinary workers CLI, leaving `health-check` pristine, and the generic compiler preserves both handlers and runtime definitions. Final canonical acceptance passed 60 / 60.

## Completed

- Read issue, named skills, doctrine/archetype material, core public API via `deno doc`, resolver, registry generator, and E2E flow fixture.
- Locked a contract-preserving, framework-layer fix plan.
- Captured the exact worker processor failure and stopped the diagnostic AppHost.
- Added the resolver regression; focused tests and plugin-scoped check/lint/fmt pass.
- Added a generic compiler golden regression and arbitrary custom-jobs-directory resolver case.
- Passed the canonical one-pass runtime suite, including `behavior.workers-executions`, Flow-B telemetry, and cleanup.

## In Progress

- Separate opposite-family IMPL-EVAL.

## Next Steps

1. Push final implementation/evidence commits and update PR acceptance evidence.
2. Run separate opposite-family IMPL-EVAL.
3. Mirror issue acceptance only after evaluator approval.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Archetype 5 + service overlay | doctrine and failing runtime | CLI is secondary only if generator ownership is proven |
| No test weakening | owner task | Regression belongs at framework failure layer |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-785-workers-healthcheck--codex/*` | new | Harness evidence |
| `plugins/workers/worker/job-execution.ts` | changed | Local entrypoint normalization |
| `plugins/workers/worker/job-execution_test.ts` | new | Exact doubled-prefix regression plus preserved convention |
| `plugins/workers/src/cli/registry-compiler.ts` | changed | Generic CLI output includes runtime definitions |
| `plugins/workers/tests/cli/registry-compiler-golden_test.ts` | changed | Locks handler + definition registry contract |
| `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts` | changed | Scaffolds a separate Flow-B callback through the ordinary CLI |
| `packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts` | changed | Correlates the separate Flow-B callback |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | focused compiler/resolver/gate tests; scoped check/lint/fmt; changed-file quality clean |
| Fitness | aggregate baseline failure; architecture pass | two unchanged scan findings; `arch:check` exit 0 |
| Runtime | pass | canonical `scaffold.runtime`: 60 passed / 0 failed |
| Consumer | pass | `behavior.workers-executions`, Flow-B stream/telemetry, and cleanup green |

## Open Questions

- None for implementation. Separate evaluator verdict remains intentionally outstanding.

## Drift and Debt

- Drift: parent run/PLAN-EVAL and Tier-D daemon/thread proof unavailable locally; transient port collision and edit-ownership ambiguity were resolved without permanent fixture changes.
- Debt: no new or deepened architecture debt accepted.

## Commits

- See the draft PR's commit list and per-slice PR comments.
