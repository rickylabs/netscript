# Drift Log: Zod npm alignment

## 2026-08-05 — train has two unreported hard Zod 3 paths

- **What:** After the measured AI/MCP peer cluster deduplicated onto npm Zod 4, the GREEN guard still found npm Zod 3 through kvdex and AG-UI.
- **Source:** `deno why npm:zod@3.25.76`, regenerated `deno.lock`, and cached `@ag-ui/core@0.0.52/package.json`.
- **Expected:** Issue #1295 states nothing deliberately pins v3 and all remaining packages accept v4.
- **Actual:** `@ag-ui/core@0.0.52` hard-depends on `zod: ^3.22.4`; `jsr:@olli/kvdex@3.6.7` also materializes Zod 3. Latest stable TanStack AI 0.43 requires a cluster upgrade and currently pulls a canary AG-UI version; latest kvdex remains 3.6.7.
- **Severity:** significant
- **Action:** owner-approved rescope: retain and document the exact two-parent v3 boundary; move full collapse to #1320; do not force incompatible ranges or take TanStack 0.43.
- **Evidence:** live guard `LOCK_INSTANCE ... zod@3.25.76, zod@4.4.3`; `deno why` paths; `deps:latest` reports TanStack AI 0.39→0.43 and no newer kvdex.

## 2026-08-05 — direct service test made the real member count 19

- **What:** The original 18-manifest census omitted `packages/service/tests/handlers_test.ts`, which imported JSR Zod directly outside the service import map.
- **Source:** Targeted wrapper/test RED with TS2307 after replacing the direct import with the catalog alias.
- **Expected:** 18 member manifests move to the root catalog.
- **Actual:** A complete no-JSR workspace requires `packages/service/deno.json` as the nineteenth `catalog:` consumer.
- **Severity:** minor
- **Action:** fix; prefer the real single-home boundary over preserving a stale count.
- **Evidence:** `packages/service/deno.json`; guard source scan; targeted service test.

## 2026-08-05 — publish simulation temporarily expands catalog specifiers

- **What:** The publish dry-run temporarily rewrites member `catalog:` aliases to concrete npm ranges while assembling packages.
- **Source:** A concurrently started quality gate observed the simulator's transient manifests; the simulator restored them on completion.
- **Expected:** Validation commands can run independently against the working tree.
- **Actual:** Catalog-sensitive validation must run after the mutating publish simulator, not concurrently with it.
- **Severity:** minor
- **Action:** orchestration-only; reran `quality:gate` serially after publish restoration and it passed.
- **Evidence:** publish dry-run exit 0; restored member manifests; subsequent live guard and `quality:gate` pass.

## 2026-08-06 — local-source child roots must own the workspace catalog

- **What:** Moving member packages to `catalog:zod` made standalone child processes fail when they import those packages by local file URL.
- **Source:** `check:emitted-samples` and nine cloud check-test failures under project config/runtime registry child processes.
- **Expected:** Generated member manifests remain portable through explicit npm imports, and generated workspace roots can consume local NetScript package sources.
- **Actual:** The child roots had import maps but no catalog, so Deno could not resolve the local source package's `catalog:zod` reference.
- **Severity:** significant
- **Action:** repair the generic generated-workspace root contract and shared child-project fixture seams; do not restore JSR Zod or inline workspace package versions.
- **Evidence:** local RED `Package 'zod' not found in catalog`; cloud run `30994687130`.
