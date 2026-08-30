# Aspire 13.5 adoption research supervisor

## Identity

- Run: `research-aspire-13.5-adoption--0.0.7`
- Role: harness research orchestrator
- Route: native Claude / Anthropic / Fable 5 / medium
- Route reason: explicit owner override for this architectural research epic
- Remote Control: required. Observed session URL:
  <https://claude.ai/code/session_011Ng6hnMLyY8vzM8EJo2XKg> (the session is registered on
  claude.ai/code; `/rc` is a user-side slash command that the orchestrator cannot toggle from inside
  the turn — the owner keeps it enabled on this session).
- Requested identity: Claude · Anthropic · Fable 5 · medium (owner override, drift D-1).
- Observed identity: model id `claude-fable-5` (reported by the runtime environment on 2026-08-29);
  effort is not introspectable from inside the session — verify with `/status`.
- Host: WSL2 (Linux 6.18.33.2-microsoft-standard-WSL2), Aspire CLI 13.4.6 on PATH, Deno workspace.
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
- For every relevant documentation page, select the TypeScript view using `?aspire-lang=typescript`
  (or the page's equivalent parameter) and retrieve its Markdown form.
- Use `aspire docs search`, `aspire docs get`, and
  `aspire docs api search ... --language
  typescript` where available. Never infer TypeScript
  support from C# samples.
- Record the exact upstream page, retrieval date, version, and whether the claim is TypeScript, CLI,
  MCP, dashboard, deployment, orchestration, or general.

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
7. Every canonical skill, embedded/static resource, generated agent-doc corpus, MCP corpus, scaffold
   template, example, workflow, and public doc that mentions Aspire. Identify the generator and the
   derived-artifact regeneration chain; no hand-edited mirrors.
8. Existing 0.0.7/0.0.8 issues, especially Aspire/plugin discovery, ports, health, MCP, CI, and
   agent-init work. State exact close/supersede/dependency relationships.
9. A test and canary strategy for each slice, including which changes justify an additional 0.0.7
   canary before stable.

## Deliverables

- `research.md`: evidence-backed upstream-to-repo capability matrix and current-state audit.
- `plan.md`: recommended adoption slices, dependency DAG, canary points, rollback boundaries.
- `epic-draft.md`: complete umbrella issue text.
- `sub-issues/NN-*.md`: complete issue text with acceptance, boundaries, tests, docs/static asset
  regeneration, related existing issues, and milestone recommendation.
- `existing-issue-map.md`: close/supersede/unblock/dependency matrix against live GitHub issues.
- `worklog.md`, `context-pack.md`, and `drift.md`: resumable evidence and corrections.
- Commit and explicitly push the research artifacts to the branch; end with the exact commit SHA and
  a concise ratification recommendation.

## Safety and scope

- Research is read-only against Aspire/AppHost runtime; do not upgrade the host CLI in this turn.
- Do not start an AppHost unless a claim cannot be verified statically and the coordinator grants
  the globally serialized runtime lease.
- Do not edit generated `.aspire/modules/` or derived static resources directly.
- Do not create or modify product code, PRs, releases, milestone assignments, or GitHub issues.
- Preserve the primary 0.0.7 coordinator and all existing topic supervisors.

## Evaluation history and routing (2026-08-29)

- PLAN-EVAL cycle 1 (`plan-eval.md`, head `d8caa507e`) → FAIL_PLAN F1–F7; repaired at `1bfe60b05`.
- PLAN-EVAL cycle 2 (`plan-eval-cycle-2.md`, head `1bfe60b05`) → FAIL_PLAN, six consistency
  findings; repaired in the cycle-2 repair commit (matrix in `worklog.md`). No third ordinary
  PLAN-EVAL under owner policy; remaining ratification is coordinator-owned.
- Owner routing: after coordinator ratification this same session becomes the epic implementation
  supervisor (serial Sol implementation agents per slice in owned worktrees; the primary Sol high
  coordinator keeps milestone authority, leases, merges, canary admission, ledger;
  PLAN-EVAL/IMPL-EVAL agents stay independent).

## Runtime lease (2026-08-30)

- Granted by the primary coordinator for S2 (#1714): host Aspire CLI upgraded 13.4.6 → 13.5.3
  (dotnet global tool), one isolated generated AppHost at a time, V1–V12 probes, owned cleanup.
  Safety rule in `supervisor.md` "Research is read-only against Aspire/AppHost runtime" is
  superseded for this lease only; S1/S3+ remain non-runtime unless the coordinator grants again.

## NAS supervisor recovery — 2026-08-30

- **Role:** Aspire 13.5 topic supervisor for release 0.0.7 (fresh session after the N5 NAS
  migration). Accepted Aspire topic ownership is preserved; the old Claude job registry is **not**
  resumed or recreated. Every `aspire-s*-impl-eval*` Remote Control session from the WSL era is
  `offline` and is treated as historical only.
- **Requested identity:** Claude · Anthropic · Opus 5 · high (`planning_decisions` orchestrator
  lane, `.llm/harness/workflow/lane-policy.md`).
- **Observed identity:** model id `claude-opus-5` reported by the runtime; session name
  `007-aspire-9a`.
- **Host:** `ai-agents` container on the Minisforum N5 NAS (Linux 6.18.34+). Toolchain pinned by
  `mise` at `/home/agent/projects/netscript/.mise.toml` — deno 2.9.5, Aspire CLI **13.5.3+b5f14331**
  (the S2 lease upgrade survived the migration). Docker is the disposable
  `DOCKER_HOST=tcp://netscript-dind:2375` sandbox; the host runtime is never touched.
- **Worktree:** `/home/agent/projects/netscript/worktrees/007-aspire`
- **Branch:** `research/aspire-13.5-0.0.7` @ `42ea3fcc` (remote-authoritative).
- **Slice worktrees (recreated on the NAS):**
  - `/home/agent/projects/netscript/worktrees/007-aspire-s5` — `fix/aspire-13-5-s5-literal-ports` @
    `0bd8ba83`, upstream deliberately unset.
  - `/home/agent/projects/netscript/worktrees/007-aspire-s6` — `feat/aspire-13-5-s6-health-checks` @
    `1fa5aeec` (survived migration).
  - `/home/agent/projects/netscript/worktrees/007-aspire-s7-eval` — detached @ `eb6f188ce`.
- **Standing constraints for this session:** Aspire runs in parallel and is **not** a global canary
  barrier. No merge, no publish, no relabel, no issue close, no central-state mutation — those stay
  with the primary coordinator. New Codex threads are launched **only** through
  `deno task agentic:launch-codex-slice`. Runtime work requires an explicitly granted singleton
  lease. NAS/session evidence is never published to GitHub.

## Lane bindings in force (this recovery)

| Lane                                   | Route                                             |
| -------------------------------------- | ------------------------------------------------- |
| Topic supervisor / Tier-A slice review | Claude · Anthropic · Opus 5 · high (this session) |
| S5 repair implementation               | Codex · OpenAI · GPT-5.6 Sol · medium             |
| S7 IMPL-EVAL cycle 2                   | Claude · Anthropic · Fable 5 · medium             |

## NAS supervisor restart — 2026-08-30 (checkpoint 2)

- **Requested identity:** Claude · Anthropic · **Fable 5 · medium** (owner-accepted Aspire
  supervisor route; supersedes the checkpoint-1 Opus 5 high identity).
- **Observed identity:** model id `claude-fable-5` reported by the runtime; session
  `session_01Jusn3woxeK5xhCdj6ccooR` (<https://claude.ai/code/session_01Jusn3woxeK5xhCdj6ccooR>).
  Effort is not introspectable from inside the turn; Remote Control is user-side (`/rc`).
- **Host/worktree/branch:** unchanged (`ai-agents`,
  `/home/agent/projects/netscript/worktrees/007-aspire`, `research/aspire-13.5-0.0.7`); slice
  worktrees `007-aspire-s5` @ `aa822069`, `007-aspire-s6` @ `564d465c`, eval worktrees
  `007-aspire-s5-eval`, `007-aspire-s7-eval` (detached, historical).
- **Host runtime prerequisites:** `aspire doctor` → `.NET SDK not found` (1 failed), Docker client
  27.5.1 < 28.0; runtime leases cannot be exercised on this host until provisioned (D-31).
