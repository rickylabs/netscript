# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                 |
| Branch         | `fix/sdk-typed-error-channel`                              |
| Current phase  | `implementation` — S7 breaking/migration docs amendment complete; awaiting focused review |
| Archetype      | `1 — Small Contract` slice                                 |
| Scope overlays | `docs`                                                     |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`; S1-S3, S5, and S6 passed their separate
reviews. IMPL-EVAL returned `PASS-WITH-FINDINGS` at `bcc9f393d`; S7 addresses medium finding F1's
remaining consumer-doc half after the topic supervisor repaired the PR body. Both published SDK
pages now state the complete 0.0.7 breaking/migration contract, and the SDK hub documents the bare
`Promise` defined-arm characteristic. Immutable S7 content head is
`29c9e40aad391381e79afa92a6052cbcd07d9a4a`; all selected docs/export/scope gates pass there. PR
#1692 remains the active draft. #1466 still owns metadata definition/export; no metadata vocabulary
or acceptance claim was introduced.

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
- S3 coherent two-page typed-error narrative and compile-accurate discriminated examples.
- S5 public-signature doc-lint corrections and exact-six-code type proof.
- S6 deterministic derived MCP export-corpus refresh.
- S7 explicit 0.0.7 breaking/migration disclosure on both pages, F4 bare-promise behavior note, and
  #1693 backing for deferred prose plus the `ThrowableError` substitution decision.

## Next steps

1. Stop after the S7 push and PR #1692 phase receipt.
2. The separate opposite-family focused amendment review is coordinator-owned.
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
- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
- `docs/site/services-sdk/sdk.md`
- `docs/site/services-sdk/how-to/discover-services.md`
- existing files under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`

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
- S7 `docs:snippets`: PASS; 581 fences scanned, 22 Tier-1 snippets compiled, zero malformed.
- S7 docs source format and docs accuracy: PASS at immutable content head `29c9e40aa`.
- S7 `docs:exports-drift` and `check:mcp-export-corpus`: PASS; generated corpus unchanged.
- S7 base-to-head `packages/` path diff: empty; `deno.lock` byte-identical.

## Open questions

- Live service integration tests requiring a runtime lease were not run because this slice forbids a
  lease. Deferred benchmark/reference prose is tracked by coordinator-filed follow-up #1693.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: #1693 now backs the deferred benchmark/reference prose and tracks later re-evaluation of the
  accepted `ThrowableError` → `Error` substitution decision.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
