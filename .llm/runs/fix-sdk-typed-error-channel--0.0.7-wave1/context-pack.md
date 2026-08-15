# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                 |
| Branch         | `fix/sdk-typed-error-channel`                              |
| Current phase  | `implementation` — S4 stopped; S4-R amended with finding→correction mapping, 1 finding unresolved |
| Archetype      | `1 — Small Contract` slice                                 |
| Scope overlays | `docs`                                                     |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`; S1-S3 each passed fresh Tier-A. The
delivered product preserves the exact six-key contract error union through the real `ServiceClient`
promise marker, `safe()`, and `isDefinedError()`, and the two published docs pages carry one
compile-accurate narrative. S4 root check/test, scoped lint/format, quality, architecture, docs,
surface attribution, and publish dry-runs completed. Raw doc lint then proved new leaf-owned
private-type-reference findings (Contracts 9 -> 11; SDK 3 -> 13), so S4 stopped without product
changes. #1466 still owns metadata definition/export; no metadata vocabulary or acceptance claim was
introduced.

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

1. S4-R (separate plan-only Claude session, `worklog.md` § S4-R) mapped all 13 new findings to
   corrections; 12 of 13 resolve cleanly (all 10 SDK; `BaseContractErrors` and `Schema` in contracts).
   `baseContract → ContractBuilder` is unresolved and needs a coordinator ruling: authorize a narrow
   `src/public/mod.ts` re-export of `ContractBuilder`/`Schema`, or accept it as permanent leaf-owned
   known-red debt.
2. Once the coordinator rules on `ContractBuilder`, the correction is a fresh authorized product slice
   over the same three files (`contract-primitives.ts`, `errors.ts`, `service-client.ts`); S4-R itself
   remains run-artifact-only, same as S4.
3. Two items are flagged as "reasoned, not `deno check`-proven" in S4-R and need verification at
   implementation time: (a) `oc.errors(commonErrorMap)` still type-checks once `commonErrorMap` is
   built from the public `ContractSchema`-typed schema aliases instead of the private Zod-typed ones;
   (b) `ContractBuilder`'s generic constraint accepts `ContractSchema<unknown,unknown>` in the
   pre-`.input()`/`.output()` position.
4. After the repair lands, rerun the incomplete final matrix (JSR audits, specifier/export guards)
   at a newly locked immutable content head.

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
- S4 root check/test, scoped lint/format, quality, architecture, docs, and publish dry-runs: PASS.
- S4 raw `surface:diff`: known base RED plus exactly 15 authorized signature changes; after
  subtracting those changes the 972-finding base/head sets have identical SHA-256 digests.
- S4 raw doc lint: blocking new RED; Contracts 9 -> 11 and SDK 3 -> 13.
- JSR audits and selected specifier/export guards: NOT RUN after the mandated S4 stop.
- S4-R (plan-only): 12/13 findings mapped to type-safe corrections (SDK 10/10, contracts 2/3);
  `baseContract -> ContractBuilder` unresolved pending coordinator ruling. No gate was (re-)executed;
  this is a mapping, not a rerun.

## Open questions

- Live service integration tests requiring a runtime lease were not run because this slice forbids a
  lease. Benchmark reference prose remains coordinator-owned follow-up debt.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
