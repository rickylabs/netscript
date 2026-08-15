# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                   |
| Branch         | `fix/sdk-typed-error-channel`                                |
| Current phase  | `implementation` — S1 complete; awaiting fresh Tier-A review |
| Archetype      | `1 — Small Contract` slice                                   |
| Scope overlays | `docs`                                                       |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`. S1 records both real-export REDs
(TS18046 `unknown`, TS2339 `never`), then makes the contracts builder carry the exact six-key error
map and explicit empty fourth slot. S2 error-channel files remain untouched. #1466 owns metadata
definition/export; S1 introduces no metadata vocabulary or acceptance claim.

## Completed

- Required skill/harness/doctrine/RFC/issue reading.
- `deno doc` public-surface inspection before source inspection.
- Focused source map and executed whole-repo consumer search.
- Exact RED and JSR/publish baseline inspection.
- Research, plan, design, risk/gate set, docs dispositions, and rescope report.
- Separate-session PLAN-EVAL PASS with advisories A1-A5 incorporated.
- S1 builder annotation and real-export regression fixture using contracts-exported schemas.
- S1 structured check/test/lint/format gates.

## Next steps

1. Fresh Tier-A reviews the landed S1 head and structured evidence.
2. Stop. Slice 2 requires fresh coordinator authorization after that review.

## Key decisions

- Exact six-key `typeof commonErrorMap`; never open `ErrorMap`.
- `SafeResult` gains literal defined/non-defined failure arms and failure `data: undefined`.
- No broad fallback error union; error identity must originate in the real client promise.
- Breaking published change, not patch-level.
- No new export. The empty fourth metadata generic remains explicit; all metadata vocabulary belongs
  to #1466.
- The exact six-path ceiling is locked; any seventh product/test/docs path requires a fresh ruling.

## Files changed

- `packages/contracts/src/application/contract-primitives.ts`
- `packages/sdk/tests/readme-doctest_test.ts`
- existing files under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`

No S2-S4 file was modified.

## Gates

- PLAN-EVAL: PASS (`plan-eval.md`, `f76a3c45b`).
- S1 RED: expected FAIL with exactly TS18046 and TS2339, captured once.
- S1 focused check/test/lint/format: PASS; full JSON is in `worklog.md`.
- Root quality/publish/docs/JSR gates: not run; reserved for the final slice.
- Baseline JSR/publish inspection is recorded in `research.md` and `worklog.md`.

## Open questions

- None for S1. Benchmark reference prose is coordinator-owned follow-up debt; the contracts README
  correction is recorded in `research.md` without editing that seventh path.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
