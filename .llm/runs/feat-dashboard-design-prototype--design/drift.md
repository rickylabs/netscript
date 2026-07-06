# Drift Log: Dev Dashboard E2E Claude Design prototype + design-sync system

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-06 — DDX-15 scope expansion + DDX-0 dependency inversion

- **What:** Owner expanded the design pre-step from DDX-15's filed scope (design-sync artifact +
  Fresh panel-shell prototype) to a full E2E Claude Design prototype + production-grade reusable
  sync system, and inverted the filed DDX-0→DDX-15 edge: prototype pass 1 now validates/amends the
  DDX-0 L3 promote-set **before** DDX-0 is implemented (the eis-chat two-pass loop).
- **Source:** owner directives in session 2026-07-06 (five forks answered; see plan.md LD-1…LD-7).
- **Expected:** `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/epic-and-issues.md` —
  DDX-15 depends on DDX-0, blocks DDX-5 + panels.
- **Actual:** This run supersedes #425 in execution; #425 stays open as the beta.6 tracking point
  and is closed by this run's PR when the artifacts land. New issue filed in Backlog / Triage.
- **Severity:** significant
- **Action:** rescope (owner-ratified); board comments on #400/#425 at bootstrap.
- **Evidence:** research.md F1/F11; session decision log.

## 2026-07-06 — Lane override: Tier-A implements repo tooling + drives the canvas

- **What:** Tier-A (Fable 5 supervisor) implements `tools/design-sync/` and orchestrates the
  Claude Design canvas via MCP, instead of routing implementation to Tier-D.
- **Source:** owner fork answers (fully-agentic canvas; sync home = tools/); supervisor.md
  § Recorded lane/eval overrides.
- **Expected:** lane-policy default — source slices → Tier D.
- **Actual:** deliverable is repo tooling (not `packages/`/`plugins/`) + a Claude-native cloud
  surface only Claude can drive; boundary not crossed.
- **Severity:** minor
- **Action:** accept (recorded).
- **Evidence:** supervisor.md lane table; AGENTS.md tooling tiers.

## 2026-07-06 — Canvas sync mechanism: native DesignSync tool, not raw MCP

- **What:** The sync lane runs on Claude Code's native `DesignSync` tool (+ `/design-sync` skill)
  instead of the raw `claude-design` MCP endpoint the plan assumed.
- **Expected:** plan/research OQ-1 assumed MCP tools (`mcp__claude-design__*`) with known 404/401
  flakiness and an owner-relay fallback.
- **Actual:** `DesignSync` is first-class in the harness: claude.ai-login auth (owner ran
  `/design-login`), read smoke PASS (`list_projects` → stale `eis-chat — NS One` visible,
  `ea3fa1b9-…`), `localPath` disk uploads that keep the 290KB registry / ~80KB CSS closure out of
  model context, and a finalize_plan write boundary. Strictly better; the MCP server stays
  registered as a secondary surface for canvas-driving if needed.
- **Severity:** minor (favorable; de-risks the top risk-register entry)
- **Action:** accept; slice 0 write half (`create_project` + round-trip) still gates after
  PLAN-EVAL PASS. Slice 1 targets the DesignSync bundle shape (`@dsCard` preview markers,
  256-file batches).
- **Evidence:** worklog.md § Runtime Gates.
