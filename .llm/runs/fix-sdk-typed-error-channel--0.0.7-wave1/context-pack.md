# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                 |
| Branch         | `fix/sdk-typed-error-channel`                              |
| Current phase  | `implementation` — S6 derived export corpus generated and checked; awaiting Tier-A |
| Archetype      | `1 — Small Contract` slice                                 |
| Scope overlays | `docs`                                                     |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`; S1-S3 and S5 each passed fresh Tier-A.
PR #1691 repaired unrelated main-branch export-corpus drift and merged as `61bfd858d`; this branch
was rebased onto it. S6 then regenerated the one newly authorized derived path for this leaf's five
SDK signature changes. The immutable S6 content head is
`b427e035488e5eabd9f3a92870787006aa9a6813`; the canonical corpus check passes there. PR #1692 is
the active draft replacement for accidentally closed PR #1671. #1466 still owns metadata
definition/export; no metadata vocabulary or acceptance claim was introduced.

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

1. Stop after the S6 push and PR #1692 phase receipt.
2. A fresh Tier-A review and separate opposite-family IMPL-EVAL are coordinator-owned next steps.
3. Do not self-review, self-certify, request evaluation, flip readiness, or merge.

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
- S5 exact-head quality gate (including quality scan + arch check): PASS.
- S5 NetScript JSR specifier guard: PASS, 2,361 files, zero failures.
- S5 doc lint: Contracts 9 and SDK 3, exact pinned baseline parity with zero new findings.
- S5 selected export-corpus guard: RED; generated corpus stale, requires an unauthorized fifth
  product path. Remaining JSR/publish/surface/export gates: NOT RUN after the mandated stop.
- S6 generator determinism: PASS; two byte-identical runs, generated-file SHA-256
  `f7bbc8925481e8682f84f9057263387030838e6bc7ee366c56e98a9b2829f904`.
- S6 semantic corpus attribution: PASS; 0 added, 0 removed, exactly five changed SDK signatures,
  with schema/framework/surfaces unchanged.
- S6 `check:mcp-export-corpus`: PASS at immutable content head `b427e0354`.
- S6 MCP scoped lint/format: pre-existing tooling RED, exit 1 with zero findings in each wrapper;
  no source fix attempted.

## Open questions

- Live service integration tests requiring a runtime lease were not run because this slice forbids a
  lease. Benchmark reference prose remains coordinator-owned follow-up debt.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
