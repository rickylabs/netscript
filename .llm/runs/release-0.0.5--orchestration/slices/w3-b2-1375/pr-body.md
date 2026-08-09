## Summary

Implements the release-blocking fix that connects `agent init --with-docs` host configuration to the
installed corpus, adds deterministic probe/fallback precedence, generates a bounded versioned
fallback, and makes corpus health visible through `list_docs`.

## Scope

- Archetype / area: Archetype 6 CLI/tooling + docs
- Tracks #1375. Closing keyword is intentionally withheld until all eleven live acceptance rows
  have implementation and gate evidence.
- #1260 remains the 0.0.6 SDK corpus-breadth owner.
- #1376 remains the concurrent command-execution composition-root owner. Both branches edit
  `packages/mcp/cli.ts` and `packages/mcp/README.md`; this branch stays within docs-corpus hunks,
  and whichever merges second must rebase and regenerate publish assets.

## Slices

- [x] Planning — research, design checkpoint, acceptance map, risks, and ordered slices
- [ ] S1 RED acceptance contract and real initialized-project `search_docs`
- [ ] S2 generated fallback, provenance/budget, probe precedence, and observability
- [ ] S3 all-host docs wiring, real stdio GREEN, and public docs
- [ ] S4 full gates, serialized runtime token, and evaluation handoff

## Validation

- Planning only: no product tests or implementation gates run.
- Mandatory separate Claude/Fable PLAN-EVAL passed; findings F1-F4 are recorded in `plan-eval.md`.
- The serialized `scaffold.runtime` gate will be requested only after all non-serialized gates pass.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b2-1375/`
- Phase: `impl`
- Do not merge until PLAN-EVAL, implementation gates, Tier-A review, and separate-session IMPL-EVAL
  are complete. The milestone orchestrator retains merge and canary authority.

## Drift / Debt

- No drift.
- Existing `cli/maintainer-mode-mixing`, `cli/no-permissions-doc`, and `MCP-A6-V2-SHAPE` debt is
  preserved and not deepened.

## Definition of Done

- [ ] All eleven live #1375 acceptance rows have linked evidence and the PR body carries
  `Closes #1375`.
- [ ] RED-first real CLI stdio proof is recorded, then passes against an initialized project.
- [ ] Focused, scoped, quality, doctrine, doc, JSR, publish, and granted serialized runtime gates
  report raw exit codes with no hidden skips.
- [ ] Separate-session IMPL-EVAL returns PASS and review threads are answered.
