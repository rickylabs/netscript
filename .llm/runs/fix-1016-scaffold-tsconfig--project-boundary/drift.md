# Drift Log: scaffold TypeScript project boundaries (#1016)

## 2026-08-01 — Vite failure occurs on SSR request

- **What:** Starting `deno task dev` reaches Vite's ready state on baseline; requesting `/` triggers the upward-config failure.
- **Source:** Clean-room reproduction under `.llm/tmp/issue-1016-before-parent/repro-before`.
- **Expected:** The brief summarized the dev server as failing.
- **Actual:** Process startup succeeds; first SSR module evaluation fails with the same unresolved parent `extends`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Vite log: `Error when evaluating SSR module fresh:server_entry: failed to resolve "extends":"astro/tsconfigs/strict"` for `SidebarToggle.tsx`.

## 2026-08-01 — Local formal evaluator credential unavailable

- **What:** The policy-bound local Claude/OpenRouter Qwen evaluator could not launch.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/fix-1016`.
- **Expected:** A separate local open-model PLAN-EVAL session.
- **Actual:** Exit 4, `status: blocked`, `credential: absent`, diagnostic `auth_required`.
- **Severity:** significant
- **Action:** defer pending owner authorization of a permitted evaluator path
- **Evidence:** Provider-canary JSON captured in the supervisor session; no implementation started.
