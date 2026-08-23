# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                 |
| Branch         | `fix/sdk-typed-error-channel`                              |
| Current phase  | `implementation` — S9 generated cascade complete; awaiting separate review |
| Archetype      | `1 — Small Contract` slice                                 |
| Scope overlays | `docs`                                                     |

## Current state

PLAN-EVAL is terminal PASS at evaluator commit `f76a3c45b`; S1-S3, S5, and S6 passed their separate
reviews. IMPL-EVAL returned `PASS-WITH-FINDINGS` at `bcc9f393d`; S7 addressed medium finding F1's
consumer-doc half. The focused amendment review at `7b0024967` returned `ACCEPT-WITH-FINDINGS`, S8
closed A1–A4, and the opposite-family delta review then passed at starting head `587ade9f3`. S9
refreshes the deterministic generated cascade made stale by the S7/S8 docs edits. Two full ordered
runs produced the same four outputs byte-for-byte; all freshness, export, and 78 Contracts/SDK tests
pass at immutable generated-content head `120172c466bf6a3d18da80012145347072377513`. PR #1692 was
externally observed as ready with `status:ready-merge` at S9 start; the generator left that
supervisor-owned state untouched because S9 forbids readiness/label mutation. #1466 still owns
metadata definition/export; no metadata vocabulary or acceptance claim was introduced.

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
- S8 A1–A4 prose corrections: literal failure arms and exact-six key-space disclosures on both
  pages, precise old `safe()` signature, and exported-only F4 vocabulary.
- S8 opposite-family A1–A4 delta review PASS at `587ade9f3`.
- S9 deterministic agent-docs prose → CLI barrel → publish-assets regeneration, with four measured
  generated paths and two byte-identical complete runs.

## Next steps

1. Stop after the S9 push and PR #1692 phase receipt.
2. Any S9 review or further CI/readiness action is coordinator-owned.
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
- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- `packages/mcp/src/publish-assets.generated.ts`
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
- S8 `docs:snippets`, `docs:accuracy`, `docs:links`, and `docs:exports-drift`: PASS at immutable
  content head `8e568e49f`.
- S8 `check:mcp-export-corpus`: PASS with unchanged SHA-256 `a8f0779228987ed7…`.
- S8 base-to-head `packages/` and `plugins/` path diff: empty; `deno.lock` and generated corpus
  byte-identical.
- S9 deterministic cascade: PASS; four measured generated outputs, identical SHA-256 values after
  each of two full ordered runs.
- S9 `check:agent-docs-prose`, `check:assets-barrel`, and `check:publish-assets`: PASS at immutable
  generated-content head `120172c46`.
- S9 `check:mcp-export-corpus` and `docs:exports-drift`: PASS; semantic corpus SHA-256 remains
  `a8f0779228987ed7…`.
- S9 Contracts + SDK suites: PASS, 78 passed / 0 failed.

## Open questions

- Live service integration tests requiring a runtime lease were not run because this slice forbids a
  lease. Deferred benchmark/reference prose is tracked by coordinator-filed follow-up #1693.

## Drift and debt

- Drift: earlier scope/ownership conflicts and the README research correction are recorded in the
  append-only `drift.md`.
- Debt: #1693 now backs the deferred benchmark/reference prose and tracks later re-evaluation of the
  accepted `ThrowableError` → `Error` substitution decision.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
