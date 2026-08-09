## Summary

Implements the release-blocking fix that connects `agent init --with-docs` host configuration to the
installed corpus, adds deterministic probe/fallback precedence, generates a bounded versioned
fallback, and makes corpus health visible through `list_docs`.

## Scope

- Archetype / area: Archetype 6 CLI/tooling + docs
- Closes #1375. All eleven live acceptance rows have implementation and gate evidence.
- #1260 remains the 0.0.6 SDK corpus-breadth owner.
- #1376 remains the concurrent command-execution composition-root owner. Both branches edit
  `packages/mcp/cli.ts` and `packages/mcp/README.md`; this branch stays within docs-corpus hunks,
  and whichever merges second must rebase and regenerate publish assets.

## Slices

- [x] Planning — research, design checkpoint, acceptance map, risks, and ordered slices
- [x] S1 RED acceptance contract and real initialized-project `search_docs`
- [x] S2 generated fallback, provenance/budget, probe precedence, and observability
- [x] S3 all-host docs wiring, real stdio GREEN, and public docs
- [x] S4 full gates, serialized runtime token, and evaluation handoff

## Validation

- Mandatory separate Claude/Fable PLAN-EVAL passed; findings F1-F4 are recorded in `plan-eval.md`.
- Focused S3 verdict: 48 passed, 0 failed, no skips; publish-asset freshness exited 0.
- Direct MCP quality scan is clean. Direct MCP doctrine has no remaining owned finding but exits 1
  on untouched pre-existing findings tracked for root-coverage triage in #1403.
- Granted one-pass `scaffold.runtime`: raw exit 0, `passed=78 failed=0 skipped=2`; the only skips are
  the two expected #1398 deferrals. Pre/post leak artifacts show no slice-owned survivor.
- The decisive real generated-project stdio `search_docs` returns installed slug
  `pages/services-sdk/services`, rather than the prior two-document fallback.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b2-1375/`
- Phase: `impl-eval`
- Do not merge until PLAN-EVAL, implementation gates, Tier-A review, and separate-session IMPL-EVAL
  are complete. The milestone orchestrator retains merge and canary authority.

## Drift / Debt

- #1403: aggregate `quality:gate` omits MCP and aggregate `arch:check` covers neither owned package;
  scoped results are recorded instead.
- Existing `cli/maintainer-mode-mixing`, `cli/no-permissions-doc`, and `MCP-A6-V2-SHAPE` debt is
  preserved and not deepened.

## Definition of Done

- [x] All eleven live #1375 acceptance rows have linked evidence and the PR body carries
  `Closes #1375`.
- [x] RED-first real CLI stdio proof is recorded, then passes against an initialized project.
- [x] Focused, scoped, quality, doctrine, doc, JSR, publish, and granted serialized runtime gates
  report raw exit codes with no hidden skips.
- [ ] Separate-session IMPL-EVAL returns PASS and review threads are answered.
