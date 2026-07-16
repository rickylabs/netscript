# Context Pack: fix #773 — render_ui recursion hole

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-773-beta10-stabilization--render-ui-recursion` |
| Branch | `fix/773-beta10-stabilization` |
| Current phase | `evaluate` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Implementation is complete and gated. The registry embed is regenerated from the correct source,
a failing-layer equality regression protects `render-ui`, and core CI now invokes the general
generated-asset freshness task. The slice awaits supervisor-triggered IMPL-EVAL.

## Completed

- Required skills, harness workflow, doctrine, Archetype 4 profile, and frontend overlay read.
- Issue #773 read in full through the specified GitHub token resolver.
- Branch/baseline and clean worktree verified.
- Public API inspected with `deno doc` before focused implementation reads.
- Research, plan, and design checkpoint recorded.
- Pre-fix reproduction captured: source behavior green, shipped embed stale.
- Draft PR #788 opened against `feat/beta10-integration` with required labels and milestone.
- Regenerated the shipped embed, added its regression test, and wired CI freshness.
- Targeted/package/scoped/architecture/publish/generated/scaffold gates run.
- Full scaffold runtime passed 60/60; Fresh UI package passed 135/135.

## In Progress

- Supervisor-triggered IMPL-EVAL; this implementation lane does not self-certify.

## Next Steps

1. Review the substantive diff and commit the implementation slice with updated run evidence.
2. Push the explicit refspec and post the implementation phase comment on PR #788.
3. Leave the draft PR at `status:impl-eval` for the external supervisor.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Regenerate instead of hand-edit. | plan D1 | Generator remains the owner. |
| Equality regression plus existing behavior test. | plan D2 | Proves behavior reaches the shipped copy. |
| Reuse `check:assets-barrel` in quality CI. | plan D3 | General prevention, no duplicate tool. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `packages/fresh-ui/registry.generated.ts` | changed | Regenerated copy-source embed; nested arrays now increment depth. |
| `packages/fresh-ui/tests/registry/render-ui-generated.test.ts` | new | Source/embed equality and array-recursion regression. |
| `.github/workflows/ci.yml` | changed | Runs `check:assets-barrel` in core quality CI. |
| `.llm/runs/fix-773-beta10-stabilization--render-ui-recursion/*` | changed | Implementation and gate evidence. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | 5 targeted tests; 135 package tests; scoped check/lint/fmt; publish dry-run |
| Fitness | PASS with unrelated baseline red | focused scan and arch pass; repo scan has two untouched plugin findings |
| Runtime | PASS | scaffold runtime 60/60 |
| Consumer | PASS | copied UI type-check and live render behavior |

## Open Questions

- None.

## Drift and Debt

- Drift: evaluator dispatch reserved for supervisor; referenced frontend guide absent; unrelated
  repository quality findings recorded.
- Debt: none introduced or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
