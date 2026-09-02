# Claude Code Opus 5 High — Independent Database Architecture Deep Dive

## Role

Use the NetScript harness. You are a subordinate architecture/research lane in an active RFC run,
not the supervisor and not the formal PLAN-EVAL. Work independently from the Codex framing,
challenge it, and return decision-grade evidence. You may use native Claude Workflows or focused
Claude subagents when they materially improve coverage; if you do, record the workflow/subagent
roles and observable identifiers in your report.

Requested route: native Claude Code, Opus 5, effort high.

## Worktree and run

- Worktree: `/home/codex/repos/netscript-db-rfc`
- Branch: `docs/database-architecture-rfc`
- Run: `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/`
- Baseline: `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`
- Prisma RC clone: `.llm/tmp/prisma-v8-rc1`
- Prisma RC pin: `a76a6c5ad627ceaf1d78e874757cb2ca43e93ff5`
- Prisma current-main pin observed by the supervisor: `71e2e0d9ee1f306b5a11435cd1973023cb33866a`

Read `AGENTS.md` and the complete `.agents/skills/netscript-harness/SKILL.md` first. Follow its
retrieval order for any doctrine/archetype decisions you make. This is a docs-only RFC research
slice describing future Archetype 1/2/4/5/6 surfaces.

## Owner intent

This is a clean-break architectural redesign of NetScript's database story around Prisma 8 / Prisma
Next. It is not a 1:1 Prisma migration. Backward compatibility must not constrain the design. Data
migration safety and a mechanical migration path are required, but runtime compatibility facades,
old generated clients, aliases, and hand-maintained shims are forbidden.

The architecture must eliminate manual schema/type generation, generated-source patching, manual
adapter assembly, Prisma-related CI instability, and copied plugin fragments while supporting
multiple schemas, multiple databases (including two targets of the same provider), provider/runtime
capability differences, plugin contributions, deterministic tooling, and an excellent human/CI/
agent experience.

## Required reading

Read these completely before forming conclusions:

- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/netscript-current-state.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/prisma-8-deep-dive.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/market-analysis.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/plan.md`
- `.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/context-pack.md`
- `rfcs/PROCESS.md` and the RFC template it points to
- relevant source paths cited by the current-state audit
- Prisma RC source/scorecard/ADRs/control/runtime/skills in the local clone

Do not accept the existing research's proposed conclusions merely because they are written. Verify
load-bearing claims against source and flag any error, overreach, or missed alternative.

## Independent questions

1. What is the smallest durable NetScript database kernel, and what must remain Prisma-specific?
2. Is a `DatabaseGraph` actually the right central abstraction? If so, define its identities,
   invariants, compilation phases, and failure behavior. If not, propose a superior abstraction.
3. What are the exact package boundaries and dependency directions? Assign the smallest fitting
   NetScript archetype to each.
4. Design implementation-grade TypeScript APIs for:
   - application target definition and selection;
   - runtime acquisition/scoping;
   - schema/contract-space contributions;
   - provider/driver/runtime adapters and capability negotiation;
   - migration plan/apply/verify operations;
   - validation artifact providers;
   - testkit/conformance certification; and
   - generated agent manifest/command context.
5. How should same-provider multi-target, same-database multi-schema, cross-space relations,
   replicas, serverless/request scope, and externally managed schemas differ in the type/domain
   model?
6. How should plugin upgrade, dependency ordering, collision, version skew, uninstall, retained
   data, and external drift behave?
7. Where can the design accidentally create a proprietary second ORM, an over-broad generic
   repository, a service locator, or a lowest-common-denominator portability layer?
8. Which Prisma 8 ideas should NetScript adopt, wrap, replace, or reject? Which exact upstream seams
   are mature enough to integrate, and what must be gated?
9. Design the zero-manual-step development loop and the deterministic CI/deployment protocol,
   including atomic artifacts, stale-output detection, plan approval, cross-target partial failure,
   resume, receipts, locks, and offline/Aspire classification.
10. Design the clean-break migration and temporary parallel-branch strategy without reintroducing
    compatibility into the product architecture.
11. Produce a failure-mode analysis and an implementation/conformance test matrix that would catch
    the incidents in the NetScript audit and the open Prisma 8 issues/PRs.
12. Identify any decision that the RFC must leave conditional on Prisma 8 final rather than
    pretending the RC has settled it.

## Output contract

Write exactly one file:

`.llm/runs/docs-database-architecture-rfc--prisma-8-rfc/research/claude-opus-architecture-review.md`

Do not edit any other file. Do not commit, push, comment on GitHub, change labels, or author the
canonical RFC.

The report must contain:

- requested and observed model/effort/session identity;
- whether workflows/subagents were used and their roles/identifiers;
- independent executive verdict;
- corrected or missing research findings with evidence;
- explicit architecture decision table with alternatives and rejection reasons;
- package/dependency graph;
- concrete API/DSL sketches (not merely nouns);
- graph compilation/runtime/control lifecycle;
- plugin contribution and removal protocol;
- capability/ownership/error models;
- multi-target transaction/failure semantics;
- dev/CI/agent experience;
- clean-break migration/parallel-branch strategy;
- threat/failure-mode analysis;
- implementation waves and per-wave proof gates;
- unresolved decisions and upstream maturity gates;
- severity-tagged adversarial findings against the current research/plan; and
- a primary-source register.

Distinguish observed fact, inference, and proposal. Prefer source and tests over stale prose. The
result should be suitable for direct use by the supervisor when locking the Plan-Gate.
