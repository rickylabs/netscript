# Plan — Graft integration + before/after benchmark

## Profile

- Archetype: none (no `packages/`/`plugins/` source touched). Overlay: agent-tooling /
  harness-infrastructure (SCOPE-docs-adjacent: skills + `.llm/` artifacts + benchmark tooling).
- Doctrine verdict: unaffected — framework source is out of scope by design.

## Goal

Decide, on measured evidence, whether NanoNets/Graft joins the NetScript agent harness. The
deliverable is (a) a merge-ready minimal integration and (b) a complete before/after benchmark
posted as a PR comment for the owner's merge decision.

## Locked decisions

1. **CLI + skill integration only.** No MCP registration, no hooks, no statusline in this PR.
   Rationale: smallest reviewable surface; the CLI is the entire query capability; MCP/hooks are
   config mutations better done after a positive verdict.
2. **Canonical skill at `.agents/skills/graft/`, mirrored to `.claude/skills/graft/`** per repo
   skill doctrine (CLAUDE.md: `.claude/skills` is generated from `.agents/skills`).
3. **Graph is a local cache, never committed.** Keep Graft's own `.gitignore` entry; keep the root
   `.ignore` (greppability). Teammates run `graft build` (~36s).
4. **Benchmark lane: Opus 5, medium effort, one subagent per (task × condition)** — owner
   directive. Conditions: `baseline` (no Graft, standard repo tools) vs `graft` (instructed to use
   the Graft CLI first). Same task text otherwise.
5. **Structural graph only** (no `GRAFT_API_KEY` here). The verdict measures Graft's zero-cost
   tier; recorded as a known limitation.
6. **Metrics:** output-token delta per agent (workflow `budget.spent()` deltas, sequential
   execution), agent-reported tool-call count, wall time (self-reported via `date` at start/end),
   and blind pairwise answer quality judged by a separate Opus 5 medium judge against
   supervisor-verified ground truth.
7. **Task set: 6 real NetScript navigation/comprehension tasks** spanning trace, locate,
   cross-package impact, and architecture-summary shapes, with supervisor-verified answer keys.

## Open-decision sweep

- MCP server + post-edit hooks integration — safe to defer (follow-up issue if verdict is merge).
- `graft build --deep` enrichment + provider routing via `.llm/tools/agentic/config` — safe to
  defer (needs key management decision).
- CI/pre-build of the graph — safe to defer (local cache is fine at this stage).

## Risk register

| Risk | Mitigation |
| --- | --- |
| Benchmark noise from N=1 per cell | 6 tasks × 2 conditions; report per-task and aggregate; no overclaiming in verdict |
| Graft agents ignore the tool | Skill + explicit prompt instruction; agents report which graft commands they ran |
| Token metric conflates thinking/output | Same model+effort both conditions; deltas are comparative, not absolute |
| Structural-only graph undersells Graft | Recorded limitation; verdict phrased as zero-cost-tier measurement |
| npm global dep in a Deno repo | Doc-only prerequisite (like rtk); no manifest change |

## Evaluator route

- **PLAN-EVAL: N/A** — bounded tooling evaluation, no framework source, acceptance criteria fixed
  by the owner in chat (benchmark decides merge). Recorded per run-loop §4.
- **IMPL-EVAL:** the owner's merge decision on the posted benchmark comment is the final gate; the
  PR stays draft. If the owner wants a formal separate-session IMPL-EVAL, route per lane-policy.

## Gates

- Skill mirror validation: `.llm/tools/agentic/claude/validate-claude-surface.ts` (Claude surface
  changed).
- Docs formatting on touched md: scoped `run-deno-fmt.ts` on the new files.
- Benchmark harness: workflow completes with all 12 probe agents + judge returning structured
  output; results table posted to the PR.

## Debt implications

None created; none closed.

## Deferred scope

MCP/hooks/statusline wiring, deep enrichment pass, CI graph prebuild, `graft init` multi-agent
wiring for Codex/OpenHands lanes.
