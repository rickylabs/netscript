# Context Pack: SDK reference contribution example

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-sdk-reference-contribution-example--1349` |
| Branch | `docs/sdk-reference-contribution-example` |
| Current phase | `gate` |
| Archetype | N/A — consumer documentation only |
| Scope overlays | `docs` |

## Current State

The reference section and compiling tenant-header example are implemented. Documentation gates and
all four carrier generators pass; the slice is ready to commit before the required clean-tree checks.

## Completed

- Verified branch/base and three contribution counts.
- Verified the live public API with `deno doc`.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Added the compact six-field surface inventory and typed client-composition example.
- Passed `docs:snippets` and `docs:jsdoc-examples` with `unboundName=116`.
- Ran the four carrier generators in order with exit 0.

## In Progress

- Committing the slice and then running clean-tree carrier checks.

## Next Steps

1. Commit the reviewed slice.
2. Run the four matching `check:*` tasks on the committed tree.
3. Run separate-session IMPL-EVAL, recheck #1927, push, and create the owner-specified non-draft PR.

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
| Static | passing; post-commit checks pending | Docs gates and generators all exit 0. |
| Fitness | source aligned; evaluator pending | Six `deno doc` samples plus supervisor slice review. |
| Runtime | N/A | Docs-only slice. |
| Consumer | PASS | `docs:snippets`, exit 0. |

## Open Questions

- PR #1927 must be merged before this PR can honestly close #1349.

## Drift and Debt

- Drift: README count increased from 14 to 18; no scope impact.
- Debt: none.

## Commits

- See the PR commit list plus per-slice comments after the slice lands.
