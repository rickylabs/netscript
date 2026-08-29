# Aspire 13.5 adoption research supervisor

## Identity

- Run: `research-aspire-13.5-adoption--0.0.7`
- Role: harness research orchestrator
- Route: native Claude / Anthropic / Fable 5 / medium
- Route reason: explicit owner override for this architectural research epic
- Remote Control: required; record the attached session identity and URL before research begins
- Worktree: `/home/codex/repos/netscript-007-aspire-13-5-research`
- Branch: `research/aspire-13.5-0.0.7`
- Baseline: `cf648f1ff973d74c213bb125a6f5f5b9328e693b`
- Target milestone: `0.0.7`, subject to coordinator ratification after research

## Mandate

Research Aspire 13.5 as an adoption and stabilization opportunity, not a dependency-only upgrade.
Produce one umbrella epic draft plus one independently actionable sub-issue draft per supported
feature, migration, rewrite, or reliability improvement. Map every draft to existing NetScript
issues it closes, supersedes, unblocks, or depends on. Recommend coherent implementation slices and
canary boundaries. Do not implement product changes or create GitHub issues in this research turn;
the primary coordinator ratifies and publishes the issue graph.

## Source contract

- Primary release source: <https://aspire.dev/whats-new/aspire-13-5/>.
- Prefer official Markdown/agent pages over scraping rendered HTML.
- For every relevant documentation page, select the TypeScript view using
  `?aspire-lang=typescript` (or the page's equivalent parameter) and retrieve its Markdown form.
- Use `aspire docs search`, `aspire docs get`, and `aspire docs api search ... --language
  typescript` where available. Never infer TypeScript support from C# samples.
- Record the exact upstream page, retrieval date, version, and whether the claim is TypeScript,
  CLI, MCP, dashboard, deployment, orchestration, or general.

## Required coverage

1. Aspire CLI/AppHost 13.4.6 -> 13.5.x migration and all breaking/deprecated behavior.
2. NetScript's TypeScript Aspire integration bridge, generated AppHost/modules, resource graph,
   endpoint/env/service-discovery contracts, and integration APIs.
3. Aspire MCP additions/changes, resource MCP tools, agent workflows, and how NetScript should
   expose or consume them.
4. CI and E2E opportunities: startup/wait/readiness, isolated worktrees, resource commands,
   telemetry, deterministic teardown, container ownership, and structured receipts.
5. Dashboard/OTel/log/trace/export improvements relevant to generated projects and harness gates.
6. Deployment/publish changes that affect generated NetScript workspaces or docs.
7. Every canonical skill, embedded/static resource, generated agent-doc corpus, MCP corpus,
   scaffold template, example, workflow, and public doc that mentions Aspire. Identify the
   generator and the derived-artifact regeneration chain; no hand-edited mirrors.
8. Existing 0.0.7/0.0.8 issues, especially Aspire/plugin discovery, ports, health, MCP, CI, and
   agent-init work. State exact close/supersede/dependency relationships.
9. A test and canary strategy for each slice, including which changes justify an additional
   0.0.7 canary before stable.

## Deliverables

- `research.md`: evidence-backed upstream-to-repo capability matrix and current-state audit.
- `plan.md`: recommended adoption slices, dependency DAG, canary points, rollback boundaries.
- `epic-draft.md`: complete umbrella issue text.
- `sub-issues/NN-*.md`: complete issue text with acceptance, boundaries, tests, docs/static asset
  regeneration, related existing issues, and milestone recommendation.
- `existing-issue-map.md`: close/supersede/unblock/dependency matrix against live GitHub issues.
- `worklog.md`, `context-pack.md`, and `drift.md`: resumable evidence and corrections.
- Commit and explicitly push the research artifacts to the branch; end with the exact commit SHA
  and a concise ratification recommendation.

## Safety and scope

- Research is read-only against Aspire/AppHost runtime; do not upgrade the host CLI in this turn.
- Do not start an AppHost unless a claim cannot be verified statically and the coordinator grants
  the globally serialized runtime lease.
- Do not edit generated `.aspire/modules/` or derived static resources directly.
- Do not create or modify product code, PRs, releases, milestone assignments, or GitHub issues.
- Preserve the primary 0.0.7 coordinator and all existing topic supervisors.

