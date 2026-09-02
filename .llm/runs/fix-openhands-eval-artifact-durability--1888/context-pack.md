# Context Pack: durable formal OpenHands evaluator artifacts

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-openhands-eval-artifact-durability--1888` |
| Branch | `fix/openhands-eval-artifact-durability` |
| Current phase | gate / draft-PR handoff |
| Archetype | N/A — GitHub Actions infrastructure |
| Scope overlays | none |

## Current State

Implementation and focused gates are complete. Formal evaluator verdicts are preserved on unique
non-PR Git refs rooted at the immutable evaluated head. The workflow returns `NONE`, suppresses the
raw formal summary, and blocks status advancement unless exactly one summary token is parsed and the
evidence ref is published.

## Completed

- Harness bootstrap, skill/reference reads, exact base/branch/lock verification.
- Research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A`.
- Exact-one verdict parser state, isolated two-commit artifact record, truthful status URI, and
  local/remote provenance parity.
- Focused tests (86 passed), check, format, and both embedded-shell syntax checks.

## In Progress

- Final lock/scope verification, commit, explicit-refspec push, and draft PR creation.

## Next Steps

1. Capture final lock/scope exits and commit the single slice.
2. Push `HEAD:refs/heads/fix/openhands-eval-artifact-durability`.
3. Open the draft PR with `Closes #1888`, milestone `0.0.7`, and all labels once at open handoff.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Unique evidence ref | `plan.md` D1–D3 | Exact immutable URI without evaluated-head mutation |
| Formal exact-one summary | `plan.md` D4–D6 | Invalid cardinality/preservation yields `NONE` |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-openhands-eval-artifact-durability--1888/` | new | Harness record; preserves pre-existing thread identity artifact |
| `.github/workflows/openhands-agent.yml` | changed | Formal exact-one verdict + isolated durable artifact ref |
| `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts` | changed | Reproducer and provenance regression |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | 86 tests, check, format, shell syntax, and diff check exit 0 |
| Fitness | N/A | no package/plugin surface |
| Runtime | N/A | workflow provider run intentionally not dispatched |
| Consumer | PASS | local/remote provenance parity assertions |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comment.
