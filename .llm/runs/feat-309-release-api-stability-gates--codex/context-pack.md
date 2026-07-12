# Context Pack: #309 release engineering and API-stability gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-309-release-api-stability-gates--codex` |
| Branch | `feat/309-release-api-stability-gates` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Preflight and research are complete. Slice 1 is implemented and gated: exact and native version
bumping now share the full-workspace coordinator used by release cut.

## Completed

- Required skills/harness/doctrine references read.
- Base/branch/clean-tree preflight passed.
- Actual bump, workspace, lock, Deno-doc, workflow, doctrine, and mirror surfaces audited.
- Slice 1 focused tests passed 7/7 and `deno.lock` is unchanged.

## In Progress

- Slice 2: surface snapshot/diff classifier, baseline, CI rollout, and doctrine convention.

## Next Steps

1. Implement and gate three planned slices.
2. Dispatch separate opposite-family IMPL-EVAL.
3. Commit and push the final evaluator/worklog state without opening a PR.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| CI-only tool/baselines under `.llm/tools/release` | tools skill | Not public product tooling. |
| Separate major declarations from baseline | plan D4 | Prevent silent approval during refresh. |
| Dedicated non-blocking package-path PR workflow | plan D6 | Stable flip deferred on #309. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-309-release-api-stability-gates--codex/*` | new | Harness activation artifacts. |
| `.llm/tools/deps/bump-version.ts` | changed | Exact/full-workspace coordinator plus native increment compatibility. |
| `.llm/tools/deps/bump-version_test.ts` | changed | Direct wrapper exact-version regression. |
| `.llm/tools/release/cut.ts` | changed | Reuses canonical coordinator. |
| `.llm/tools/release/cut_test.ts` | changed | Full workspace/scaffold/lock fixture. |
| `deno.json` | changed | Wrapper write permission and combined version test task. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | planned wrappers |
| Fitness | PARTIAL PASS | version tests 7/7; surface tests pending |
| Runtime | N/A | no cut/publish |
| Consumer | NOT_RUN | planned task/workflow proof |

## Open Questions

- None that force rework; stable blocking rollout is explicitly deferred.

## Drift and Debt

- Drift: PLAN-EVAL waived; no versioning file 10; runtime thread identity unobservable.
- Debt: no new doctrine debt planned.

## Commits

- No implementation commits yet. Owner forbids PR creation; use branch commits and push evidence.
