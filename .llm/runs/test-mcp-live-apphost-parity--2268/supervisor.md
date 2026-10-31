# MCP live AppHost parity — issue 2268 remainder

Branch: test/mcp-live-apphost-parity. Baseline main:
cecf7762124bdb50cb3f9c81bffbf0b696411ef5. Previous PR 2530 is merged.
Scope: implement and execute the remaining real scaffolded-AppHost telemetry proof
for issue 2268, which is already implemented by merged PR 2521. Tracker 2474 lists
this proof as incomplete; current issue comments/open PRs show no competing claim.
Claim posted to tracker and issue before source work.

Feature-tier leaf under the existing harness. OpenAI implementation; separate
native Claude Opus 5.5/high read-only PLAN-EVAL and IMPL-EVAL, closed stdin,
following the owner's explicit issue-2268 routing override. Matrix resolved with
agentic:matrix --tier feature --json. No complex/architecture tier selection.

Allowed writes: this run; a focused live MCP telemetry verifier and its tests in
packages/cli/e2e or .llm/tools; minimal existing runtime suite integration and
relevant verification documentation. Runtime generated projects and private raw
output remain in the project run outside Git. Do not edit production MCP behavior,
scaffold templates, dependency versions or locks without recording proven need.

No labels/milestones, rebase/force push, merge/tag/release. No local full
scaffold.runtime suite. Use a targeted, isolated no-container scaffold to prove
real telemetry; exact run-owned cleanup only. No external existing app is mutated.
Do not print credentials, operational paths, endpoints or session identifiers in
public evidence. Native evaluator identity/resume data stays private.
