# Drift Log: declare the plugin-streams-core dependency

## 2026-09-01 — MCP export corpus already stale at base

- **What:** The requested `deno task check:mcp-export-corpus` gate exits 1.
- **Source:** Current worktree gate and a detached worktree at base `38f2ce735`.
- **Expected:** The validation plan expected all four generated-corpus checks to exit 0.
- **Actual:** `check:agent-docs-prose`, `check:assets-barrel`, and `check:publish-assets` exit 0;
  `check:mcp-export-corpus` exits 1 both before and after this slice.
- **Severity:** minor
- **Action:** accept for this draft and report; do not update the forbidden active sibling leaf at
  `packages/mcp`.
- **Evidence:** Current `REAL_EXIT=1`; detached-base `BASE_REAL_EXIT=1`; error says
  `MCP export-surface corpus is stale`.
