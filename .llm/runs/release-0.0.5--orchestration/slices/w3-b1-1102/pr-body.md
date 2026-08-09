## Summary

Implements #1102's public MCP feature: an offline, bounded `find_guidance` workflow that ranks real
documentation sections by task intent, returns cited code and prerequisite/next routing, and is
activated before unfamiliar NetScript implementation work. Separate-session PLAN-EVAL cycle 2
passed; S1 establishes the public contract and enumerable bounded flow shell.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` · CLI agent guidance · docs
- Closes #1102
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

## Definition of Done

- [ ] `find_guidance` returns bounded ordered section guidance with cited code, stages, confidence,
      related links, and honest fallback.
- [ ] The checked-in real release-corpus evaluation passes both adapters: four deterministic exact
      top-3 rows plus Prisma's unordered required top-three set.
- [ ] Internal links affect prerequisite/next routing; filesystem and embedded adapters are equal on
      identical release sources.
- [ ] The existing generated embedded fallback contains the required destinations within 262,144
      bytes and passes provenance/freshness checks.
- [ ] MCP initialize instructions, generated `AGENTS.md`, consumer skills, and real `agent mcp`
      stdio activate/use the workflow before unfamiliar implementation.
- [ ] Package-scoped tests/check/lint/fmt/quality/doctrine, JSR audit, full-export doc-lint, publish
      dry-runs, docs gates, review-thread gate, and granted serialized smoke are green with raw
      exits.
- [ ] Separate-session Claude · Fable 5 PLAN-EVAL and IMPL-EVAL pass; Tier-A slice review is
      recorded.
- [x] This PR makes no #1090 adoption claim and leaves that controlled experiment untouched.
