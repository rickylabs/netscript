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

## 2026-09-01 — S1 completeness contract exceeded its derivation

- **What:** S1 claimed every importing workspace member declared streams-core, but research searched
  only the two issue-named members and four other importing manifests remained undeclared.
- **Source:** IMPL-EVAL commit `4f194dbb1`; independent workspace-wide static import/export census.
- **Expected:** The worklog design contract described workspace-wide declaration completeness.
- **Actual:** `packages/sdk`, `packages/plugin-sagas-core`, `packages/plugin-auth-core`, and
  `packages/cli/e2e` had module edges without declarations at evaluated head `10aa2a944`.
- **Severity:** significant
- **Action:** fix in owner-authorized S2 by declaring all four and rerunning gates over all six
  touched members.
- **Evidence:** target manifests plus static import/export sites recorded in `research.md`.

## 2026-09-01 — String reference misclassified as module import

- **What:** S1 called `plugins/triggers/src/public/mod.ts:23` a sixth import site.
- **Source:** `streamsCore: definePlugin('@netscript/plugin-streams-core', ...).build()`.
- **Expected:** Dependency completeness counts only module-resolution edges.
- **Actual:** The line is plugin metadata containing a package-name string, not an import or export
  module specifier. Similar CLI codegen, generated prose/assets, documentation, and diagnostic
  strings are also non-edges.
- **Severity:** minor
- **Action:** correct the research and design vocabulary; keep string references separate from the
  static module-edge census.
- **Evidence:** syntax-context inspection of every target-string occurrence.
