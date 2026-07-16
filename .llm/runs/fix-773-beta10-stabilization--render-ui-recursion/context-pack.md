# Context Pack: fix #773 — render_ui recursion hole

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-773-beta10-stabilization--render-ui-recursion` |
| Branch | `fix/773-beta10-stabilization` |
| Current phase | `plan` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Issue #773 is current and reproducible by inspection: source increments depth through arrays, while
the generated registry embed does not. Source already has the behavioral regression; the generated
layer lacks freshness enforcement in tests and CI.

## Completed

- Required skills, harness workflow, doctrine, Archetype 4 profile, and frontend overlay read.
- Issue #773 read in full through the specified GitHub token resolver.
- Branch/baseline and clean worktree verified.
- Public API inspected with `deno doc` before focused implementation reads.
- Research, plan, and design checkpoint recorded.

## In Progress

- Bootstrap artifact commit and draft-PR creation.

## Next Steps

1. Commit/push the run bootstrap and open the draft PR.
2. Reproduce the embed mismatch without modifying source.
3. Add the registry regression, regenerate, and wire CI.
4. Run targeted, scoped, doctrine, JSR, and scaffold-runtime gates.
5. Commit/push the implementation slice and leave the PR at `status:impl-eval` for supervisor evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Regenerate instead of hand-edit. | plan D1 | Generator remains the owner. |
| Equality regression plus existing behavior test. | plan D2 | Proves behavior reaches the shipped copy. |
| Reuse `check:assets-barrel` in quality CI. | plan D3 | General prevention, no duplicate tool. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-773-beta10-stabilization--render-ui-recursion/*` | new | Harness bootstrap artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | planned | plan validation table |
| Fitness | planned | plan validation table |
| Runtime | planned | targeted and scaffold runtime tests |
| Consumer | planned | generated equality and scaffold runtime |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator dispatch reserved for supervisor; referenced frontend guide absent.
- Debt: none introduced or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.

