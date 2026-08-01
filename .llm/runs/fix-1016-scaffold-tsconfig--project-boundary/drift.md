# Drift Log: scaffold TypeScript project boundaries (#1016)

## 2026-08-01 — Vite failure occurs on SSR request

- **What:** Starting `deno task dev` reaches Vite's ready state on baseline; requesting `/` triggers the upward-config failure.
- **Source:** Clean-room reproduction under `.llm/tmp/issue-1016-before-parent/repro-before`.
- **Expected:** The brief summarized the dev server as failing.
- **Actual:** Process startup succeeds; first SSR module evaluation fails with the same unresolved parent `extends`.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Vite log: `Error when evaluating SSR module fresh:server_entry: failed to resolve "extends":"astro/tsconfigs/strict"` for `SidebarToggle.tsx`.
