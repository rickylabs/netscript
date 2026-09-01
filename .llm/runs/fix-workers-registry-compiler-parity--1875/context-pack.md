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

The single source/test repair is implemented. Five live emitted-shape omissions are fixed, focused
wrappers and `quality:gate` pass, lock hygiene is clean, and opposite-family slice review passed.

## Completed

- Harness activation, doctrine/archetype review, re-baseline, JSR surface scan, plan, and design.
- Draft PR #1882 opened with the full requested labels and milestone 0.0.7.
- S1 implementation and focused/quality validation.

## In Progress

- S1 sign-off commit, push, and PR comment.

## Next Steps

1. Create the S1 sign-off commit, push, and post the per-slice PR comment.
2. Run separate-session IMPL-EVAL and update the PR body/status.

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
| `plugins/workers/src/cli/registry-compiler.ts` | changed | Emits five previously missing optional config keys. |
| `plugins/workers/tests/cli/registry-compiler-golden_test.ts` | changed | Golden output plus schema-derived directional parity assertion. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Check/lint/fmt: 102 files, zero findings; focused test: 1/1 pass. |
| Fitness | PASS + baseline JSR findings | `quality:gate` exit 0; JSR audit exit 1 only on pre-existing public-surface findings. |
| Runtime | N/A | Explicitly prohibited by owner. |
| Consumer | PASS | Focused generated-source parity test. |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; Fable review primary quota-blocked and Opus low fallback used.
- Debt: no new or deepened debt; existing workers Refactor and #1655 debts remain out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments.
