# Context Pack: issue #785 workers health-check execution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-785-workers-healthcheck--codex` |
| Branch | `fix/785-workers-healthcheck` |
| Current phase | `implement — diagnostic reproduction` |
| Archetype | `5 — Plugin Package` |
| Scope overlays | `service` |

## Current State

Issue #785 is reproduced upstream as a post-delivery worker failure. Source inspection shows a likely doubled local entrypoint when a project-root-qualified path is combined with configured jobsDir. A diagnostic full runtime suite is running and will leave Aspire available for log capture.

## Completed

- Read issue, named skills, doctrine/archetype material, core public API via `deno doc`, resolver, registry generator, and E2E flow fixture.
- Locked a contract-preserving, framework-layer fix plan.

## In Progress

- Capture the exact worker processor entrypoint and terminal error.

## Next Steps

1. Inspect worker logs and stop diagnostic runtime.
2. Implement the narrow path fix and focused regression.
3. Run scoped/static/fitness gates and the canonical full runtime smoke.
4. Commit, push, open/update draft PR, apply requested taxonomy/milestone, post IMPL evidence, and hand off to separate evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Archetype 5 + service overlay | doctrine and failing runtime | CLI is secondary only if generator ownership is proven |
| No test weakening | owner task | Regression belongs at framework failure layer |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-785-workers-healthcheck--codex/*` | new | Harness evidence |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | focused regression and scoped wrappers |
| Fitness | pending | `quality:gate` |
| Runtime | diagnostic in progress | `.llm/tmp/785-repro*` |
| Consumer | pending | full scaffold runtime |

## Open Questions

- Exact module specifier and error origin, pending logs.

## Drift and Debt

- Drift: parent run/PLAN-EVAL and Tier-D daemon/thread proof unavailable locally; owner directly authorized this implementation slice.
- Debt: no new or deepened architecture debt accepted.

## Commits

- See the draft PR's commit list and per-slice PR comments.
