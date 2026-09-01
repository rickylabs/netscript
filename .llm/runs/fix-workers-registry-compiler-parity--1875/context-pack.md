# Context Pack: workers registry compiler parity

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-workers-registry-compiler-parity--1875` |
| Branch | `fix/workers-registry-compiler-parity` |
| Current phase | `implement` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Current State

Research and design are locked against `main` at `82a2527e2`. PLAN-EVAL is N/A for this complete,
mechanical one-slice contract. Five live emitted-shape omissions were found.

## Completed

- Harness activation, doctrine/archetype review, re-baseline, JSR surface scan, plan, and design.

## In Progress

- Bootstrap commit and draft PR opening, then the single implementation slice.

## Next Steps

1. Open the draft PR with the required metadata.
2. Repair the emitted object and add schema-derived parity coverage.
3. Run focused wrappers, quality/doctrine, JSR audit, and lock-hygiene checks.
4. Obtain opposite-family slice review and separate-session IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Expected keys come from the runtime Zod object. | plan D1 | No private core export change. |
| Assert schema keys are a subset of emitted keys. | plan D2 | Required one-way parity. |
| Emit absent optionals as `undefined`. | plan D3 | No duplicated validation/defaults. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-workers-registry-compiler-parity--1875/*` | new | Harness state and staged launcher identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | Planned structured wrappers. |
| Fitness | NOT_RUN | Planned quality/doctrine and JSR audit. |
| Runtime | N/A | Explicitly prohibited by owner. |
| Consumer | NOT_RUN | Focused generated-source parity test. |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; raw non-interactive commands used.
- Debt: no new or deepened debt; existing workers Refactor and #1655 debts remain out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments.
