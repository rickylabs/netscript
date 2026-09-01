# Context Pack: final plugin reference adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-adopt-plugin-pages-b--1857` |
| Branch | `docs/adopt-plugin-pages-b` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` (documentation only) |
| Scope overlays | `docs` |

## Current State

S1 now carries 35 mapped package pages: triggers, workers, and plugin-auth have exact entrypoint
tables and measured `entrypoints-only` policies. Derived documentation assets were regenerated in
the required order. The auth page remains the sole unclassified physical reference page until S2
adds its typed exclusion and exactly-one denominator enforcement. PR #1869 remains
`status:impl`.

## Completed

- Required skills, harness workflow, docs overlay, Archetype 5, doctrine public/runtime/fitness
  sections, debt, and current doctrine verdict read.
- Branch rebased onto `origin/main` `d2b33a09b`.
- PR #1869 opened with all requested labels and milestone, then marked ready before implementation.
- Real checker findings and all-entrypoint symbol coverage re-derived.
- Plan, Design checkpoint, and justified `PLAN-EVAL: N/A` recorded.
- S1 diff implemented and reviewed against the three live manifests and all-entrypoint symbol
  measurements; mapping count is 35 with all 32 prior names retained.
- S1 `docs:exports-drift`, generators, prose check, and publish check pass. The assets-barrel task
  must be rerun after the expected generated carrier is committed because it compares to `HEAD`.

## In Progress

- Slice 1 commit/push and PR comment.

## Next Steps

1. Commit/push S1 and post its PR comment; rerun the committed assets-barrel check.
2. Implement/test S2; review, commit, push, and PR comment.
3. Run full gates, freeze run evidence, rerun at final pushed head, and update PR body/comment.
4. Hand off to the separate supervisor-owned IMPL-EVAL without changing `status:impl`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Three `entrypoints-only` policies | measured `deno doc` unions | 150/17/133; 175/125/50; 84/5/79. |
| Auth hub exclusion | owner + Units table | Names all five indexed packages. |
| Separate enforcement commit | owner assignment | S2 independently revertible. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-adopt-plugin-pages-b--1857/*` | new | Harness bootstrap/research/plan/design state. |
| `docs/site/reference/{triggers,workers,plugin-auth}/index.md` | changed | Exact missing entrypoints and auth path column. |
| `.llm/tools/docs/check-exports-drift.ts` | changed | Three cumulative measured mappings. |
| `.llm/assets/agent-docs/*` | changed | Regenerated prose bundle/provenance. |
| `packages/{cli,mcp}/**/*.generated.ts` | changed | Regenerated embedded carriers. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | S1 PASS; S2/final pending | 35-row `docs:exports-drift` exit 0; generators 0/0/0 |
| Fitness | S1 F-5 PASS; final pending | every entrypoint measured; exact tables accepted |
| Runtime | N/A | no plugin/package source |
| Consumer | pending | site and generated corpus gates planned |

## Open Questions

- None.

## Drift and Debt

- Drift: current main advanced; RTK absent; Deno doc JSON helper corrected to version 2 schema.
- Debt: no new or changed debt; existing triggers/workers/auth records remain out of scope.

## Commits

- See PR #1869 commit list and per-slice comments.
