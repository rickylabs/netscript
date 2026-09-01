# Qwen 3.8 Max — Prisma 8 Integration and Abstraction Falsification

Use the NetScript harness as an independent open-model research/review lane. This is not PLAN-EVAL,
not RFC authorship, and not permission to edit the repository.

## Identity and scope

- Requested provider/model: OpenRouter / `qwen/qwen3.8-max`
- Requested effort: `max`
- Worktree: `/home/codex/repos/netscript-db-rfc`
- Baseline: `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`
- Prisma RC source: `.llm/tmp/prisma-v8-rc1` at `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5`
- Prisma current-main comparison pin: `71e2e0d9ee1f306b5a11435cd1973023cb33866a`

Read `AGENTS.md`, `.agents/skills/netscript-harness/SKILL.md`, and these three research files
completely:

- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/netscript-current-state.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/prisma-8-deep-dive.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/market-analysis.md`

Verify load-bearing claims against the local NetScript and Prisma sources. Do not trust the research
conclusions by default.

## Assignment

Falsify or strengthen the proposed direction from three angles:

1. **Abstraction minimization:** determine whether a NetScript database graph, target descriptors,
   contract spaces, capability negotiation, and consumer-owned ports are the minimum durable
   concepts or an accidental second ORM/control plane. Propose a smaller superior alternative where
   possible.
2. **Prisma integration risk:** identify every place Prisma 8 RC1/current-main churn, package
   topology, migration semantics, runtime lifecycle, Deno behavior, contract versioning, extension
   model, or agent surface could invalidate a NetScript public contract. Cite exact source paths,
   commits, scorecard rows, issues, or PRs.
3. **Proof design:** specify negative-path conformance tests and adoption gates that distinguish
   compile-time promises from actual plan/SQL/result/lifecycle behavior. Include two same-provider
   targets, multi-schema, external ownership, plugin upgrade/removal, partial cross-target apply,
   interrupted emission, version skew, stale plans, and Deno dependency graphs.

Also answer:

- Which provider strategy avoids blocking the architecture on Prisma 8's PostgreSQL-only GA target
  without retaining Prisma 7 compatibility?
- Which proposed NetScript concepts must be public, internal, generated data, or adapter-local?
- What should be conditionally deferred until Prisma 8 final?
- What dangerous market analogy or missing competitor invalidates a conclusion in the market audit?
- What are the ten highest-risk RFC decisions, with severity, evidence, and required disposition?

## Output

Make no file edits and do not run mutation commands. Return one self-contained Markdown report in
your final response with:

- requested/observed route caveat;
- independent verdict;
- corrected facts;
- minimum viable architecture;
- public/internal boundary table;
- Prisma adopt/wrap/reject/defer table;
- provider/parity strategy;
- adversarial finding ledger;
- conformance matrix;
- decisions that must remain conditional;
- source register.

Label facts, inferences, and proposals. Do not write generic advice.
