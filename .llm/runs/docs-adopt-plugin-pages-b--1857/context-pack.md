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

Current main has 32 mapped package pages and 36 physical reference pages. Fresh research confirms
three remaining one-package pages need adoption and the auth page is a five-package hub exclusion.
The PR is #1869, ready for review before the first implementation push and labelled
`status:impl`; implementation edits have not begun.

## Completed

- Required skills, harness workflow, docs overlay, Archetype 5, doctrine public/runtime/fitness
  sections, debt, and current doctrine verdict read.
- Branch rebased onto `origin/main` `d2b33a09b`.
- PR #1869 opened with all requested labels and milestone, then marked ready before implementation.
- Real checker findings and all-entrypoint symbol coverage re-derived.
- Plan, Design checkpoint, and justified `PLAN-EVAL: N/A` recorded.

## In Progress

- Slice 1 page corrections, mappings, and generated docs corpus.

## Next Steps

1. Implement and verify S1; supervisor substantive review, commit, push, and PR comment.
2. Implement/test S2; supervisor substantive review, commit, push, and PR comment.
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

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | baseline PASS; implementation pending | 32-row `docs:exports-drift` exit 0 |
| Fitness | research PASS; final pending | every entrypoint measured via `deno doc --json` |
| Runtime | N/A | no plugin/package source |
| Consumer | pending | site and generated corpus gates planned |

## Open Questions

- None.

## Drift and Debt

- Drift: current main advanced; RTK absent; Deno doc JSON helper corrected to version 2 schema.
- Debt: no new or changed debt; existing triggers/workers/auth records remain out of scope.

## Commits

- See PR #1869 commit list and per-slice comments.

