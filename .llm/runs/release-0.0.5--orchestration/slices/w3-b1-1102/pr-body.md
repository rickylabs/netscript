## Summary

Completes the remaining S4–S5 work for #1102 on top of merged foundation PR #1404. The plan first
closes two retrieval gaps found by IMPL-EVAL, then activates `find_guidance` before unfamiliar
implementation work across MCP initialization, generated agent guidance, consumer skills, and the
real installed-corpus CLI stdio path, and finally aligns public docs and release evidence.

This draft is plan-only. Product implementation is blocked on a fresh separate-session PLAN-EVAL.

## Scope

- Archetype / area: A6 CLI/tooling · `packages/mcp` · CLI agent guidance · docs overlay
- Refs #1102
- `Closes #1102` is intentionally deferred until every acceptance row has implementation evidence.
- Observed usage/adoption remains exclusively #1090; deterministic retrieval tests are not adoption.

## Planned slices

- [x] Plan — live issue re-baseline, measured corpus options, score discriminator, activation path,
      pre-fix reds, package/public-surface baselines, ordered gates
- [x] S4A — render/fetch concept mismatch, getting-started routing through `llms`, and a
      route-hint-free score evaluation with inverted-comparator mutation proof
- [x] S4B — MCP/generated-agent/consumer-skill activation and real no-AppHost
      `agent init --with-docs` → `agent mcp` → `find_guidance` stdio proof
- [ ] S5 — public MCP/docs alignment, generated assets, all non-Aspire gates, runtime-token request

## Locked plan decisions

- Preserve the original five evaluation rows and all 15 citations byte-for-byte.
- Add three rows: the issue's exact render symptom, getting-started rank 1 at
  `llms#getting-started`, and one zero-concept score-only exact top-three.
- Keep the current 12-document fallback and 262,144-byte cap. Current selection is 253,535 bytes;
  adding 20,986-byte quickstart would total 274,521, 12,377 over. No document is dropped.
- Do not change BM25 constants. A scratch-only inversion of the score comparator must fail the new
  score row while the committed checkout passes.
- Use the same pre-implementation activation rule in MCP initialize instructions, generated
  `AGENTS.md`, and source consumer skills; regenerate mirrors instead of hand-editing them.

## Planning evidence

- Current render symptom: no concept; rank 1 is `services-sdk/services#services-contracts`; query
  guidance is outside top five.
- Current project-creation intent: no concept; rank 1 is a second-database driver detail.
- Current score-only candidate activates no concept and ranks the direct-vs-wrapper decision,
  unsupported-Prisma section, then external-database-by-hand section.
- JSR audit: exit 0; known cardinality 14/16 and slow-types warnings.
- MCP doc-lint: exit 0; combined diagnostics 0 over all three exports.
- MCP publish dry-run: exit 0.
- Root NetScript JSR specifier guard: exit 0; `scanned=2326 allowances=1 ranges=0 failures=0`.
- Explicit MCP source quality: exit 0; findings 0, allowances 0.
- Explicit MCP doctrine: raw exit 1 on the exact pre-existing inventory (A14 fail, three warnings,
  one info). The plan requires zero delta and does not call this green or repair #1403 debt.
- Root quality/architecture aggregates are non-decisive for MCP under #1403.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/w3-b1-1102/`
- Phase: `plan-eval`
- Required evaluator: separate Claude · Fable 5 session, owner-launched
- No product source changes before `PASS`; no AppHost/container/`e2e:cli` before a durable runtime
  token grant.

## Definition of Done

- [ ] Ordered section guidance and cited code remain green after the continuation.
- [ ] Checked-in deterministic top-k adds three discriminators without loosening the original five.
- [ ] The issue's render/fetch concept mismatch reaches cache-first query guidance.
- [ ] Internal-link prerequisite/next routing remains green.
- [ ] Embedded/materialized-filesystem parity and bounds remain green; installed filesystem is
      additionally exercised by public CLI stdio.
- [ ] MCP instructions and generated guidance activate `find_guidance` before unfamiliar work.
- [ ] #1090 remains the only adoption-tracking surface.

No checkbox is claimed complete at plan stage.
