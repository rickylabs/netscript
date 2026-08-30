# S9 fix cycle — `agent.aspire-mcp-smoke` vs 13.5.3 dashboard availability (same thread, static)

You are the S9 implementer (thread `01a0523a-d727-7610-9cd4-e4eddbd77aea`, worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s9`, branch
`fix/aspire-13-5-s9-skills-mcp-alignment`). **Static only: no runtime, no AppHost, no CI dispatch,
no evaluators.** Explicit-refspec push. Note: your local commit `918a958cd`
(`include-hidden-files` on the workflow upload blocks) is intentionally unpushed — the supervisor
credential lacks `workflow` scope; keep it as a separate commit, do not squash it away, do not
try to push around it (if the push of your fix commit is refused because `918a958cd` touches
`.github/workflows`, commit your fix, then tell the supervisor instead of force-modifying history).

## Evidence

Hosted proof run 33328972788 (sha `d0023b834`, sqlite tier): 53 gates PASS (aspire start,
restart, waits, describe — S10's parser now clears everything) then your
`agent.aspire-mcp-smoke` FAIL after ~19 s: `tools/call failed: … -32603 "The Aspire Dashboard is
not available in the running AppHost"`; cleanup passed. Stdout empty; stderr 255 bytes
(`tools/call failed: {…}`). The postgres tier was cancelled (concurrency), so this is the one
data point; do not retry unchanged.

## Diagnosis to complete (you own it)

`evaluate.ts` calls `list_resources` on the primary transport, then derives `structuredLogs`
evidence via `list_structured_logs` — one of `ASPIRE_MCP_DASHBOARD_TOOLS`
(`list_structured_logs`, `list_traces`, `list_trace_structured_logs`). In the hosted runner the
13.5.3 AppHost evidently runs **without a reachable dashboard** (headless CI), and the aspire MCP
server answers dashboard-backed tools with `-32603 Dashboard is not available in the running
AppHost`. Decide from your own D-45 contract (14-tool baseline, `documentedUnobserved` semantics)
and the 13.5.3 CLI behaviour:

- If the dashboard tools are *expected* to be conditionally unavailable, the smoke must treat
  `-32603 Dashboard is not available` on exactly the `ASPIRE_MCP_DASHBOARD_TOOLS` as a
  **documented degraded outcome**: record it in the receipt (`structuredLogs.entryCount: null`,
  a new explicit `dashboardAvailable: false` field or equivalent), keep the tool-surface
  assertions (the tools must still be *listed*), and pass. Any other error, or -32603 on a
  non-dashboard tool, still fails.
- If instead the suite is supposed to run with a dashboard, say so with evidence from the suite's
  `aspire start` invocation and fail the diagnosis back to the supervisor — do not silently
  choose this branch.

## Required change (bounded)

RED first from the live shape (a transport stub returning the exact `-32603` JSON-RPC error for
`list_structured_logs`), then the tolerant handling; update the receipt contract type and its
consumers; keep every existing assertion for the 13.5.3 tool surface, visibility, and redaction.
Gates: scoped `run-deno-check.ts`/`lint`/`fmt --ext ts,tsx` on `packages/cli/e2e`,
`run-deno-test.ts -- --allow-all` on the aspire-mcp tests. Commit citing run 33328972788; push
explicitly; PR #1759 comment `## [PHASE: IMPL] S9 — mcp-smoke dashboard availability`; final line
= new head SHA.
