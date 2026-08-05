# Drift Log: Zod npm alignment

## 2026-08-05 — train has two unreported hard Zod 3 paths

- **What:** After the measured AI/MCP peer cluster deduplicated onto npm Zod 4, the GREEN guard still found npm Zod 3 through kvdex and AG-UI.
- **Source:** `deno why npm:zod@3.25.76`, regenerated `deno.lock`, and cached `@ag-ui/core@0.0.52/package.json`.
- **Expected:** Issue #1295 states nothing deliberately pins v3 and all remaining packages accept v4.
- **Actual:** `@ag-ui/core@0.0.52` hard-depends on `zod: ^3.22.4`; `jsr:@olli/kvdex@3.6.7` also materializes Zod 3. Latest stable TanStack AI 0.43 requires a cluster upgrade and currently pulls a canary AG-UI version; latest kvdex remains 3.6.7.
- **Severity:** significant
- **Action:** rescope required; do not weaken the one-instance guard or force incompatible transitive ranges.
- **Evidence:** live guard `LOCK_INSTANCE ... zod@3.25.76, zod@4.4.3`; `deno why` paths; `deps:latest` reports TanStack AI 0.39→0.43 and no newer kvdex.
