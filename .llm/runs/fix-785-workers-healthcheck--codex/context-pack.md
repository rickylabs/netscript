# Context Pack: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Current phase | `implement — source fix validated locally` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Issue #785 was reproduced as 40 passed / 1 failed. Worker processor logs proved that local resolution doubled `workers/jobs`, producing `<project>/workers/jobs/workers/jobs/health-check.ts` and terminal `Not Found`. The framework resolver now recognizes project-root-qualified paths already under jobsDir while preserving the normal jobs-dir-relative convention; focused tests and scoped wrappers pass.

## Completed

- Read issue, named skills, doctrine/archetype material, core public API via `deno doc`, resolver, registry generator, and E2E flow fixture.
- Locked a contract-preserving, framework-layer fix plan.
- Captured the exact worker processor failure and stopped the diagnostic AppHost.
- Added the resolver regression; focused tests and plugin-scoped check/lint/fmt pass.

## In Progress

- Framework quality gate and full runtime acceptance.

## Next Steps

1. Commit/push the framework fix slice and post its PR evidence.
2. Run `quality:gate` and the canonical full runtime smoke.
3. Update PR acceptance evidence and hand off to separate evaluation.

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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pass | 5 focused tests; scoped check/lint/fmt over 93 files |
| Fitness | pending | `quality:gate` |
| Runtime | failure reproduced and diagnosed | `.llm/tmp/785-repro*`; Aspire worker logs |
| Consumer | pending | full scaffold runtime |

## Open Questions

- None for implementation; final runtime acceptance remains.

## Drift and Debt

- Drift: parent run/PLAN-EVAL and Tier-D daemon/thread proof unavailable locally; owner directly authorized this implementation slice.
- Debt: no new or deepened architecture debt accepted.

## Commits

- See the draft PR's commit list and per-slice PR comments.
