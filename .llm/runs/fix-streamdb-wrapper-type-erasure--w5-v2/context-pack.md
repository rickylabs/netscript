# Context Pack: StreamDB wrapper type preservation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-streamdb-wrapper-type-erasure--w5-v2` |
| Branch | `fix/streamdb-wrapper-type-erasure` |
| Current phase | `impl-eval (composed handoff)` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Live issue #1235 is verified and re-baselined at exact `origin/main`. The wrapper locally projects
schema and collection values to `unknown`, while direct upstream `createStreamDB` preserves them.
The plan is locked under the milestone D6 composed-evaluation rule; implementation may proceed in
this same run.

## Completed

- Read live issue, named skills, required doctrine, archetype, frontend overlay, and milestone rule.
- Selected A4 and the full published-package gate set.
- Recorded the foreign `deno.lock` entry and explicit exclusion policy.
- Locked D1–D8 and the RED-first fixture shape.

## In Progress

- S0 harness activation commit and draft PR.

## Next Steps

1. Commit/push S0 and open the draft PR with issue linkage, labels, milestone, and plan comment.
2. Add the type fixture, capture expected RED, then implement generic passthrough and obtain GREEN.
3. Run full package/doctrine/publish gates and hand the ready PR to composed evaluation.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Reuse upstream generic types | plan D1–D3 | No parallel collection abstraction. |
| Exclude multi-`from` | live issue + owner scope guard | Refuted behavior is not touched. |
| Composed evaluation | owner D6 + `milestone-run.md` | No local formal evaluator or self-issued PASS. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-streamdb-wrapper-type-erasure--w5-v2/` | new | harness activation and locked plan |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | COMPOSED | `plan-eval.md` |
| Static | PASS | package check plus scoped TS/TSX check/lint/fmt |
| Fitness | PASS_WITH_BASELINE | quality passes; doc/JSR baseline and upstream npm refs recorded in drift |
| Runtime | PASS | focused test plus 207-test package suite |
| Consumer | PASS | RED wrapper-only failure; GREEN wrapper/control parity |

## Open Questions

- None.

## Drift and Debt

- Drift: milestone evaluation composition and foreign pre-existing lock entry recorded.
- Debt: no new/deepened debt planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
