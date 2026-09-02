# Context Pack: SDK reference contribution example

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-sdk-reference-contribution-example--1349` |
| Branch | `docs/sdk-reference-contribution-example` |
| Current phase | `close` |
| Archetype | N/A — consumer documentation only |
| Scope overlays | `docs` |

## Current State

The reference section and compiling tenant-header example are committed. Documentation gates, all
four carrier generators, and all four post-commit carrier checks pass. Fresh separate-session
IMPL-EVAL returned `PASS` at source head `ca405be8b`.

## Completed

- Verified branch/base and three contribution counts.
- Verified the live public API with `deno doc`.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Added the compact six-field surface inventory and typed client-composition example.
- Passed `docs:snippets` and `docs:jsdoc-examples` with `unboundName=116`.
- Ran the four carrier generators in order with exit 0.
- Committed the slice and passed every matching `check:*` task on the clean committed tree.
- Passed independent native Claude/Fable 5.1 medium IMPL-EVAL, including a scoped compile of this page.

## In Progress

- Revalidating closing evidence and opening the owner-specified PR.

## Next Steps

1. Recheck the ten evidence entries against merged `origin/main` (now including #1927).
2. Push and create the owner-specified non-draft PR.
3. Run the mirror dry-run and record the expected `status:impl` skip.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Tenant-header example with partitioned cache | `plan.md` D1–D3 | Exercises all descriptor fields without duplicating guide prose. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-sdk-reference-contribution-example--1349/` | new | Harness control/evidence artifacts. |
| `docs/site/reference/sdk/index.md` | changed | Reference surface inventory plus one compiling contribution example. |
| `.llm/assets/agent-docs/*`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/src/publish-assets.generated.ts` | changed | Required generated carriers from the prescribed cascade. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Docs gates, generators, and post-commit checks all exit 0. |
| Fitness | PASS | Six `deno doc` samples, supervisor slice review, and `evaluate.md` PASS. |
| Runtime | N/A | Docs-only slice. |
| Consumer | PASS | `docs:snippets`, exit 0. |

## Open Questions

- None. PR #1927 merged as `cfbb7e706`; its row-7 work is now present on `origin/main`.

## Drift and Debt

- Drift: README count increased from 14 to 18; no scope impact.
- Debt: none.

## Commits

- See the PR commit list plus per-slice comments after the slice lands.
