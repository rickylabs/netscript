## Summary

Plans #1102's public MCP feature: an offline, bounded `find_guidance` workflow that ranks real
documentation sections by task intent, returns cited code and prerequisite/next routing, and is
activated before unfamiliar NetScript implementation work. This opening commit contains only the
harness research/design artifacts; product implementation is blocked on separate-session PLAN-EVAL.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` · CLI agent guidance · docs
- Closes #1102
- Adoption measurement remains exclusively in #1090; deterministic top-k evaluation is retrieval
  evidence, not observed agent usage.

## Slices

- [x] Plan — live issue re-baseline, contract/design, failure matrix, gates
- [ ] S1 Public `find_guidance` contract and enumerable flow
- [ ] S2 Shared section index, concept aliases, code/link routing, root `llms.txt` source policy
- [ ] S3 Dual-adapter release-corpus top-k evaluation and parity/budget
- [ ] S4 MCP/generated-agent activation and installed-corpus real CLI stdio
- [ ] S5 Public docs, package gates, serialized merge-readiness handoff

## Validation

- Current `@netscript/mcp` JSR audit — exit 0; existing cardinality (14/16) and slow-types banner
  warnings recorded in run research.
- `deno task doc:lint --root packages/mcp --pretty` — exit 0, combined diagnostics 0.
- `deno task --cwd packages/mcp publish:dry-run` — exit 0.
- Implementation/acceptance gates — not run; no product implementation exists.
- `quality:gate` and root `arch:check` are explicitly non-decisive for `packages/mcp`; the plan
  names explicit package-root scanner/doctrine commands.
- No AppHost/container run was started and no serialized token was requested.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/`
- Phase: `plan-eval`
- Do not merge until the selected PLAN-EVAL and mandatory separate-session IMPL-EVAL pass. The
  implementation supervisor does not self-certify.

## Drift / Debt

- Finding: the #1375 embedded selection omits four #1102 destination families plus `llms.txt`, and
  its checked-in prose mirror predates the unsupported-driver section. S3 refreshes the canonical
  mirror through the existing approved builder chain, then extends that single generator path within
  its existing budget.
- PLAN-EVAL cycle-1 repair: D12 makes root `llms.txt` an explicit filesystem source, canonicalizes
  it to `llms` for both adapter inputs, and gates `llms#task-router` through embedded,
  materialized-filesystem, and real `agent init --with-docs` paths.
- No new architecture debt planned. Existing MCP audit warnings are not claimed fixed.

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
