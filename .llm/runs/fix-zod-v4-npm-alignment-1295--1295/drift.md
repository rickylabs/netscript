# Drift Log: Zod npm alignment

## 2026-08-05 — train has two unreported hard Zod 3 paths

- **What:** After the measured AI/MCP peer cluster deduplicated onto npm Zod 4, the GREEN guard
  still found npm Zod 3 through kvdex and AG-UI.
- **Source:** `deno why npm:zod@3.25.76`, regenerated `deno.lock`, and cached
  `@ag-ui/core@0.0.52/package.json`.
- **Expected:** Issue #1295 states nothing deliberately pins v3 and all remaining packages accept
  v4.
- **Actual:** `@ag-ui/core@0.0.52` hard-depends on `zod: ^3.22.4`; `jsr:@olli/kvdex@3.6.7` also
  materializes Zod 3. Latest stable TanStack AI 0.43 requires a cluster upgrade and currently pulls
  a canary AG-UI version; latest kvdex remains 3.6.7.
- **Severity:** significant
- **Action:** owner-approved rescope: retain and document the exact two-parent v3 boundary; move
  full collapse to #1320; do not force incompatible ranges or take TanStack 0.43.
- **Evidence:** live guard `LOCK_INSTANCE ... zod@3.25.76, zod@4.4.3`; `deno why` paths;
  `deps:latest` reports TanStack AI 0.39→0.43 and no newer kvdex.

## 2026-08-05 — direct service test made the real member count 19

- **What:** The original 18-manifest census omitted `packages/service/tests/handlers_test.ts`, which
  imported JSR Zod directly outside the service import map.
- **Source:** Targeted wrapper/test RED with TS2307 after replacing the direct import with the
  catalog alias.
- **Expected:** 18 member manifests move to the root catalog.
- **Actual:** A complete no-JSR workspace requires `packages/service/deno.json` as the nineteenth
  `catalog:` consumer.
- **Severity:** minor
- **Action:** fix; prefer the real single-home boundary over preserving a stale count.
- **Evidence:** `packages/service/deno.json`; guard source scan; targeted service test.

## 2026-08-05 — publish simulation temporarily expands catalog specifiers

- **What:** The publish dry-run temporarily rewrites member `catalog:` aliases to concrete npm
  ranges while assembling packages.
- **Source:** A concurrently started quality gate observed the simulator's transient manifests; the
  simulator restored them on completion.
- **Expected:** Validation commands can run independently against the working tree.
- **Actual:** Catalog-sensitive validation must run after the mutating publish simulator, not
  concurrently with it.
- **Severity:** minor
- **Action:** orchestration-only; reran `quality:gate` serially after publish restoration and it
  passed.
- **Evidence:** publish dry-run exit 0; restored member manifests; subsequent live guard and
  `quality:gate` pass.

## 2026-08-06 — local-source child roots must own the workspace catalog

- **What:** Moving member packages to `catalog:zod` made standalone child processes fail when they
  import those packages by local file URL.
- **Source:** `check:emitted-samples` and nine cloud check-test failures under project
  config/runtime registry child processes.
- **Expected:** Generated member manifests remain portable through explicit npm imports, and
  generated workspace roots can consume local NetScript package sources.
- **Actual:** The child roots had import maps but no catalog, so Deno could not resolve the local
  source package's `catalog:zod` reference.
- **Severity:** significant
- **Action:** repair the generic generated-workspace root contract and shared child-project fixture
  seams; do not restore JSR Zod or inline workspace package versions.
- **Evidence:** local RED `Package 'zod' not found in catalog`; cloud run `30994687130`.

## 2026-08-06 — formal IMPL-EVAL found a 70-error public doc regression

- **What:** The npm catalog alignment made pre-existing public `z.ZodType<T>` annotations resolve as
  private npm implementation types in `deno doc --lint`.
- **Source:** Qwen high evaluator `f516aada-2a74-4dad-821e-b20963fe2983`, independently repeated
  against canary.14 using the same 19-root full-export sweep.
- **Expected:** Published public surfaces do not add documentation lint debt when dependency
  identity moves from JSR to npm.
- **Actual:** Evaluated head added 70 root-summed `private-type-ref` errors, representing 55
  distinct new sites in 14 files across eight roots.
- **Severity:** blocking.
- **Action:** repair with one coherent pattern: concrete Zod constructors remain private where
  composition and `isolatedDeclarations` need them; public constants and aliases expose
  package-owned structural parse/Standard-Schema contracts. No suppressions or doc-lint allowances.
- **Evidence:** repair `b29879e9468d4c154bc67beb1cbe430984f8290c`; canary/head totals are recorded
  in `worklog.md`, with every head count at or below baseline.

## 2026-08-06 — detached Fresh stream fixture was outside root CI

- **What:** `packages/fresh`'s `check:streams-types` used a foreign config that activated local
  `catalog:zod` sources without owning a catalog, while the root wrapper checked files directly and
  never invoked the member task.
- **Source:** evaluator finding 2 and local RED `Package 'zod' not found in catalog`.
- **Expected:** the detached consumer resolves dependencies portably and the acceptance fixture is
  part of the root CI chain.
- **Actual:** canary.14 passed because local packages still used JSR Zod; the aligned head failed.
- **Severity:** blocking.
- **Action:** give the foreign config its own npm Zod catalog and add the member task as a named
  root `ci:quality` dependency.
- **Evidence:** `deno task check:streams-types` and the full `packages/fresh` check both exit 0.

## 2026-08-06 — evaluator low findings remain tool limitations

- **What:** `run-deno-doc-lint.ts` reports diagnostics but exits 0, and `check-emitted-samples.ts`
  copies the complete root catalog into its temporary fixture.
- **Action:** record both limitations without broadening this product repair into validation-tool
  redesign. Verdicts use parsed diagnostic counts, not the doc wrapper exit code; the emitted-sample
  positive result is paired with the preserved pre-repair missing-catalog RED evidence.
- **Evidence:** evaluator findings 5 and 6; current full-export counts and 40-sample output.

## 2026-08-06 — post-smoke leak report contains only older resources

- **What:** The mandatory one-pass runtime smoke cleaned up its generated AppHost and reported
  `passed=73 failed=0`. The subsequent read-only reporter found no resource created by this smoke,
  but listed foreign/unproven containers plus three stale containers owned by unrelated prior slices
  in this shared worktree.
- **Action:** leave all unrelated resources untouched; preserve `.llm/runs/.../leak-report.md` as
  artefact evidence.
