# Context Pack: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Current phase | `implement — source fix validated locally; canonical acceptance blocked` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Issue #785 was reproduced as 40 passed / 1 failed. Worker processor logs proved that local resolution doubled `workers/jobs`, producing `<project>/workers/jobs/workers/jobs/health-check.ts`. The framework resolver now recognizes project-root-qualified paths already under jobsDir while preserving the normal jobs-dir-relative convention; focused tests and scoped wrappers pass. A canonical post-fix run loaded the correct module but exposed a separate host collision: the fixture-fixed users URL on port 3001 is served by unrelated Windows process `sco-web`, while Aspire's generated users target is healthy and serves the same RPC with 200.

## Completed

- Read issue, named skills, doctrine/archetype material, core public API via `deno doc`, resolver, registry generator, and E2E flow fixture.
- Locked a contract-preserving, framework-layer fix plan.
- Captured the exact worker processor failure and stopped the diagnostic AppHost.
- Added the resolver regression; focused tests and plugin-scoped check/lint/fmt pass.

## In Progress

- Settle concurrent overlapping fixture/test edits, free fixture port 3001 with owner authority, and re-run canonical runtime acceptance.

## Next Steps

1. Have the owner of the concurrent Flow-B fixture/test edits commit or remove them.
2. Free Windows port 3001 without disrupting unrelated work, then re-run the canonical full runtime smoke.
3. Update PR acceptance evidence only if green, then hand off to separate evaluation.

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
| Fitness | aggregate baseline failure; architecture pass | two unchanged scan findings; `arch:check` exit 0 |
| Runtime | source failure fixed; environment blocker attributed | correct entrypoint, discovery URL 404, direct users target 200 |
| Consumer | blocked | canonical fixture port 3001 occupied by unrelated Windows process |

## Open Questions

- Who owns the concurrent Flow-B fixture/test edits, and when is the source tree stable for another gate?
- May the Windows-side `sco-web` process on port 3001 be stopped for the canonical acceptance run?

## Drift and Debt

- Drift: parent run/PLAN-EVAL and Tier-D daemon/thread proof unavailable locally; canonical port collision; concurrent overlapping edits invalidated a diagnostic run.
- Debt: no new or deepened architecture debt accepted.

## Commits

- See the draft PR's commit list and per-slice PR comments.
