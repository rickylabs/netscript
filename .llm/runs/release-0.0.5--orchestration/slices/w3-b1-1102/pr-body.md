## Summary

Implements the S1–S3 foundation of #1102's public MCP feature: an offline, bounded
`find_guidance` workflow that ranks real documentation sections by task intent and returns cited
code plus prerequisite/next routing. Separate-session PLAN-EVAL cycle 2 passed. Activation before
unfamiliar implementation work remains deferred S4 scope.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` · CLI agent guidance · docs
- Refs #1102
- Closes #1411
- Adoption measurement remains exclusively in #1090; deterministic top-k evaluation is retrieval
  evidence, not observed agent usage.

## Slices

- [x] Plan — live issue re-baseline, contract/design, failure matrix, gates
- [x] S1 Public `find_guidance` contract and enumerable flow
- [x] S2 Shared section index, concept aliases, code/link routing, root `llms.txt` source policy
- [x] S3 Dual-adapter release-corpus top-k evaluation and parity/budget
- [ ] S4 MCP/generated-agent activation and installed-corpus real CLI stdio
- [ ] S5 Public docs, package gates, serialized merge-readiness handoff

## Validation

- Current `@netscript/mcp` JSR audit — exit 0; existing cardinality (14/16) and slow-types banner
  warnings recorded in run research.
- `deno task doc:lint --root packages/mcp --pretty` — exit 0, combined diagnostics 0.
- `deno task --cwd packages/mcp publish:dry-run` — exit 0.
- S1 focused MCP tests — exit 0; 28 passed, 0 failed.
- S1 CLI/init count tests — exit 0; 20 passed, 0 failed; no AppHost/container started.
- Scoped MCP check — exit 0; 108 files selected, 0 failed batches, `--no-lock`.
- Scoped MCP lint/format — exit 0; 108 files, 0 findings using the package config.
- `deno task check:publish-assets` — exit 0.
- S2 full MCP tests — exit 0; 131 passed, 0 failed.
- S2 focused retrieval/source-policy tests — exit 0; 29 passed, 0 failed.
- Explicit `scan-code-quality --root packages/mcp/src` — exit 0; no findings or allowances.
- Explicit doctrine — exit 1 only for the pre-existing #1403 baseline (one foreign Jest/Vitest
  global failure, three existing cardinality/file-size warnings, one architecture-doc info); the
  S2 parser/ranker files add no warning.
- S3 canonical builder — exit 0 from a fresh exact `399f60185` checkout/output; 170 pages and 36
  deno-doc packages; generated mirror contains all three required Prisma sections.
- S3 locked evaluation — exit 0; five rows / 15 citations repeat byte-equally across embedded and
  materialized-filesystem adapters; focused group 11 passed / 0 failed. These rows prove the
  curated routing table, corpus membership, citations, and adapter parity; because every fixture is
  covered by `routeHints`, they do not constrain BM25 scoring.
- S3 full MCP tests — exit 0; 132 passed / 0 failed.
- S3 scoped MCP/generator check, lint, format — exit 0; 115 + 2 files, zero failures/findings.
- S3 explicit package quality — exit 0; zero findings/allowances. Doctrine remains only #1403's
  pre-existing baseline. MCP publish dry-run and `check:publish-assets` exit 0.
- `quality:gate` and root `arch:check` are explicitly non-decisive for `packages/mcp`; the plan
  names explicit package-root scanner/doctrine commands.
- No AppHost/container run was started and no serialized token was requested.
- IMPL-EVAL cycle-1 focused pre-fix reproduction — exit 1; 0 passed / 1 failed / 18 filtered because
  the installed-corpus consumer still expected two documents after D12 intentionally added `llms`.
- IMPL-EVAL repair CLI pair — exit 0; 20 passed / 0 failed across the full init-agent tests and real
  CLI MCP stdio smoke. The assertion remains exact at three documents in registry order.
- IMPL-EVAL repair scoped check, lint, and format — exit 0 each; one selected CLI test file, zero
  failed batches/findings, with `--no-lock` on the decisive check.
- Rebased corpus refresh — canonical builder exit 0 from a fresh detached exact-revision checkout
  at `eda49bb2e` (rebased on `main@4f96aec40`) into a fresh output directory: source-format OK,
  617 generated site files, rendered-output OK (220 HTML / 4 documented allowances), and bundle
  OK (170 pages / 36 deno-doc files / 9.1M).
- Refreshed provenance — source commit `eda49bb2e`; full corpus 4,685,958 uncompressed bytes /
  1,332,143 compressed bytes. The selected MCP fallback is 253,535 bytes / 12 documents against
  the 262,144-byte cap (8,609 bytes headroom; no selection change).
- Rebased locked evaluation/retrieval/source-policy group — exit 0; 11 passed / 0 failed with the
  unchanged five-row / 15-citation fixture, byte-equal embedded/materialized-filesystem results,
  and `llms#task-router` rank 1 on both. Full MCP tests exit 0; 132 passed / 0 failed. These remain
  curated-routing/corpus/parity evidence, not BM25-scoring evidence.
- Rebased CLI pair — exit 0; 20 passed / 0 failed. Version-drift tests exit 0; 2 passed / 0 failed.
- `deno task check:netscript-jsr-specifiers` — exit 0;
  `scanned=2326 allowances=1 ranges=0 failures=0`, against regenerated repaired-source content.
- Rebased scoped MCP check/lint/fmt — exit 0 each; 115 selected files and zero failures/findings.
  Explicit `scan-code-quality --root packages/mcp/src` exit 0 with zero findings/allowances.
  `check:publish-assets`, staged `check:assets-barrel`, and MCP `publish:dry-run` each exit 0.
- The version-less prose descriptor `client stack — jsr:@netscript/ai` is not in either plaintext
  package embed: its chat tutorial is outside the 12-document selection. No docs prose or generated
  asset was hand-edited.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/`
- Phase: `impl`
- Do not merge until the selected PLAN-EVAL and mandatory separate-session IMPL-EVAL pass. The
  implementation supervisor does not self-certify.

## Drift / Debt

- Finding: the #1375 embedded selection omits four #1102 destination families plus `llms.txt`, and
  its checked-in prose mirror predates the unsupported-driver section. S3 refreshes the canonical
  mirror through the existing approved builder chain, then extends that single generator path within
  its existing budget.
- S3 drift: repaired/current selected pages total 274,497 bytes, not the planned 243,222. All eight
  issue-required additions and the 262,144-byte cap are retained; only the prior generic quickstart
  fallback page was removed, yielding 253,511 bytes / 12 documents and preserving every locked
  citation.
- PLAN-EVAL cycle-1 repair: D12 makes root `llms.txt` an explicit filesystem source, canonicalizes
  it to `llms` for both adapter inputs, and gates `llms#task-router` through embedded,
  materialized-filesystem, and real `agent init --with-docs` paths.
- IMPL-EVAL cycle-1 repair: D12 correctly shifts the installed `list_docs.documentCount` from 2 to
  3; S2/S3 missed the stale count lock because neither reran the CLI-side pair. The exact consumer
  assertion now includes `llms`, `MANIFEST`, and `pages/services-sdk/services` in registry order.
- Architecture debt: `packages/mcp/src/domain/tool-contracts.ts` deepened the existing A8 over-cap
  warning from the evaluator's 301-line baseline to 367 lines. This PR records `DEBT_ACCEPTED`; the
  canonical debt registry requires a role-named contract split before another MCP tool expansion.
- Retrieval evidence limitation: the five locked rows do not test BM25 scoring; getting-started is
  not covered, and acceptance row 3 remains partial because `avoid hitting my service every render`
  still ranks services contracts instead of web-layer query guidance.
- Scope wording: S3 changed no `docs/site/**` source. The full branch does contain the two planned S1
  docs-site changes; it does not claim otherwise.

## S1–S3 Definition of Done

- [x] `find_guidance` returns bounded ordered section guidance with cited code, stages, confidence,
      related links, and honest fallback.
- [x] The checked-in real release-corpus evaluation passes both adapters: four deterministic exact
      top-3 rows plus Prisma's unordered required top-three set.
- [x] Internal links affect prerequisite/next routing; filesystem and embedded adapters are equal on
      identical release sources, including root `llms.txt`.
- [x] The generated embedded fallback contains the required S1–S3 destinations within 262,144
      bytes and passes provenance/freshness checks.
- [x] Repaired docs sources regenerate into a plaintext package corpus with
      `check:netscript-jsr-specifiers` reporting `failures=0`, closing #1411.
- [x] This foundation PR makes no #1090 adoption claim and leaves that controlled experiment
      untouched.

## Remaining #1102 scope

- S4 must activate the workflow in MCP initialize instructions, generated `AGENTS.md`, consumer
  skills, and the real `agent mcp` stdio path before unfamiliar implementation work.
- Acceptance row 3 remains partial for `avoid hitting my service every render`; the locked
  evaluation must not be loosened or retuned without recorded drift and evaluator approval.
- S5 owns remaining full validation and the serialized runtime handoff. This PR does not claim
  #1102 completion or adoption.

```acceptance-evidence
issue: 1411
entries:
  - box-index: 1
    evidence: "Main commit 4f96aec40 pins all four docs sites through releaseSpecifier or an exact release; the canonical fresh build at rebased head eda49bb2e passed both source-format and rendered-output guards."
  - box-index: 2
    evidence: "After regenerating the plaintext MCP corpus from repaired sources, deno task check:netscript-jsr-specifiers exited 0 with scanned=2326 allowances=1 ranges=0 failures=0."
  - box-index: 3
    evidence: "deno test --no-lock --allow-all packages/cli/src/kernel/constants/version-drift_test.ts exited 0 with 2 passed and 0 failed against the regenerated corpus."
  - box-index: 4
    evidence: "The repo-root emitted-specifier sweep scanned 2326 candidates and recorded failures=0; the only allowance is the existing exact import-map alias mapping in scaffold-packages.ts."
```
