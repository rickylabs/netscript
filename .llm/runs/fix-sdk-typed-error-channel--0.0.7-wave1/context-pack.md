# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                   |
| Branch         | `fix/sdk-typed-error-channel`                                |
| Current phase  | `implementation` — S2 complete; awaiting fresh Tier-A review |
| Archetype      | `1 — Small Contract` slice                                   |
| Scope overlays | `docs`                                                       |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`; S1 Tier-A passed at `dc034d680`. S2
preserves the exact six-key contract error union through the real `ServiceClient` promise marker,
`safe()`, and `isDefinedError()`. The two S1 suppressions are now positive exact-type assertions,
including code-specific data. #1466 still owns metadata definition/export; no metadata vocabulary or
acceptance claim was introduced.

## Completed

- Required skill/harness/doctrine/RFC/issue reading.
- `deno doc` public-surface inspection before source inspection.
- Focused source map and executed whole-repo consumer search.
- Exact RED and JSR/publish baseline inspection.
- Research, plan, design, risk/gate set, docs dispositions, and rescope report.
- Separate-session PLAN-EVAL PASS with advisories A1-A5 incorporated.
- S1 builder annotation and real-export regression fixture using contracts-exported schemas.
- S1 structured check/test/lint/format gates.
- S1 fresh Tier-A PASS at `dc034d680`.
- S2 uses upstream public `ClientPromiseResult`, `ErrorFromErrorMap`, and `ThrowableError` types to
  carry the procedure error map without a local schema shim or ambient declaration.
- S2 literal failure arms, real positive assertions, runtime identity test, and focused consumer
  compatibility checks/tests.

## Next steps

1. Commit and push S2, then post its receipt on draft PR #1671.
2. Stop for fresh Tier-A. Slice 3 remains unauthorized in this session.

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
- `packages/sdk/src/client/errors.ts`
- `packages/sdk/src/ports/service-client.ts`
- `packages/sdk/tests/readme-doctest_test.ts`
- existing files under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`

No docs/S3-S4 product file was modified.

## Gates

- PLAN-EVAL: PASS (`plan-eval.md`, `f76a3c45b`).
- S1 RED: expected FAIL with exactly TS18046 and TS2339, captured once.
- S1 focused check/test/lint/format: PASS; full JSON is in `worklog.md`.
- S2 focused check: PASS, 15 affected source/test/type-fixture files, 0 diagnostics.
- S2 consumer tests: PASS, 12/12 results across SDK doctest/query/desktop and Fresh extraction.
- S2 lint and format: PASS after correcting two type-only imports; the initial lint red is retained
  in `worklog.md`.
- Root quality/publish/docs/JSR gates: not run; reserved for the final slice.
- Baseline JSR/publish inspection is recorded in `research.md` and `worklog.md`.

## Open questions

- Live service integration tests requiring a runtime lease were not run because this slice forbids a
  lease. Benchmark reference prose remains coordinator-owned follow-up debt.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
