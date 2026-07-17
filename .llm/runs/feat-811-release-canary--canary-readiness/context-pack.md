# Context Pack: canary publish channel and publish readiness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-811-release-canary--canary-readiness` |
| Branch | `feat/811-release-canary` |
| Current phase | `impl-eval-repair-complete` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The original six slices were implemented, but the supervisor-triggered IMPL-EVAL returned
`FAIL_FIX` because the branch predated #810's actual import-attribute detector and conflicted with
current main. The branch now merges `origin/main` at `aa14e452`; both findings are repaired, the
three requested live negative probes are red as required, and the seed-free tree is green. Draft PR
#812 remains at `status:impl-eval` pending a fresh supervisor verdict. No merge is authorized.

## Completed

- Read all user-named skills in full and the harness activation/run-loop/lane/gate/evaluator authorities.
- Read issue #811, PR #810 plus its owner correction, the full current PR #810 branch artifacts, the specified release scripts, workflows, tests, README/tagline standards, token resolver, workspace/version helpers, and relevant debt.
- Verified baseline release tests: 29 passed, 0 failed.
- Confirmed official JSR version metadata, prerelease/latest, yanking, GitHub workflow-dispatch, `GITHUB_TOKEN`, and commit-status semantics.
- Implemented shared stable/canary preparation, collision-safe canary derivation, structured
  readiness with a red proof for every row, the canary-pair workflow and fail-closed stable gates,
  durable token fallback, and mandatory canary-first doctrine.
- Integrated merged PR #810 by invoking its canonical `release:preflight` task and preserving its
  exact denoland/deno#35546 plus authenticated-canary sunset.
- Passed 59 release tests and 63 agentic tests; scoped check/lint/fmt, three-workflow YAML parse,
  workflow contracts, skill sync, and changed-file quality all passed with zero findings/allowances.
- Separate IMPL-EVAL session `a06700df-b15b-43e4-a35b-e9d0a97c2f06` returned `PASS` with no
  blocking findings, then independently corrected its evidence transcription while retaining PASS.

## In Progress

- Commit/push the merge repair and update the draft PR evidence for supervisor re-evaluation.

## Next Steps

1. Fresh supervisor-triggered IMPL-EVAL verifies F1/F2 on the merged head; no self-evaluation.
2. Keep PR #812 draft and unmerged until that authorizing verdict.
3. After merge, OWNER confirms permissions/JSR grants and runs the first live canary pair.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stable target only; `<target>-canary.N` | plan D1 | Keeps canary below target. |
| Full publish-set JSR max + tag guard | plan D2 | Safe after partial publish/failure. |
| SHA-bound status pair | plan D8/D9 | Stable release fails closed without evidence. |
| #810 task boundary | plan D6 | No scanner duplication. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/release/`, `deno.json` | changed | Shared preparation, canary cut, readiness, pair verifier, tests, tasks |
| `.github/workflows/` | changed | Canary publish/pair workflow and stable/production integrations |
| `.llm/tools/agentic/` | changed | Durable token fallback and unknown-boundary narrowing |
| `.agents/skills/`, `.claude/skills/` | changed | Mandatory canary-first release/JSR doctrine and mirror |
| `.llm/runs/feat-811-release-canary--canary-readiness/` | new | Complete harness plan/reviews/gates/evaluation |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | separate Qwen PLAN-EVAL |
| Static | PASS | release 59/59; agentic 63/63; check/lint/fmt/YAML/sync/quality green |
| Fitness | PASS / scoped N/A | release/tooling gates and negative proofs satisfied |
| Runtime | N/A in PR | no live publish authorized |
| Consumer | PASS | stable cut, canary cut, publisher, and GitHub Release consumers verified |
| IMPL-EVAL | FAIL_FIX → repair complete | supervisor F1/F2 repaired; fresh verdict pending |

## Open Questions

- None.

## Drift and Debt

- Drift: earlier routing/evidence corrections plus significant base drift that omitted #810's
  detector; repaired by merging current main and adding real/live detection proofs.
- Debt: stale OIDC wiring entry resolved without claiming a live canary; no new debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
