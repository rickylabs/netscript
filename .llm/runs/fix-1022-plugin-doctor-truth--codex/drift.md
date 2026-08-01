# Drift Log: plugin doctor runtime truth

## 2026-08-01 — evaluator route owner override

- **What:** Opus 5 supervisor supplies PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train.
- **Expected:** Default harness formal evaluator uses the bound open-model route.
- **Actual:** Owner explicitly selected a separate Opus 5 session and pre-approved this plan.
- **Severity:** minor
- **Action:** accept
- **Evidence:** owner instruction in task thread; `plan-eval.md`.

## 2026-08-01 — config validation issues are flattened

- **What:** The doctor use case can expand structured validation issues, but the production child
  config loader throws a plain `Error` containing raw stderr.
- **Expected:** A `ZodError` might cross the loader boundary for per-field rendering.
- **Actual:** `project-config-loader.ts` discards the structured error shape at the process edge.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `packages/cli/src/kernel/adapters/config/project-config-loader.ts`; acceptance box 5
  remains unticked in PR #1045.

## 2026-08-01 — workers has two registry generator shapes

- **What:** The first implementation recognized only `compileWorkersRegistry` namespace imports;
  `generateRuntimeRegistries` emits default imports and direct map entries at the same path.
- **Expected:** One canonical generated registry syntax.
- **Actual:** Two syntaxes satisfy the same runtime loader contract.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Opus 5 IMPL-EVAL; positive tests cover both real shapes.

## IMPL-EVAL round 3

- The supervisor cause held: `loadRegisteredPlugins` imported project modules and collapsed all
  diagnostics at the workspace boundary.
- Static `scaffold.plugin.json` was not originally materialized into installed project plugin
  directories, so merely extending its source schema left the doctor seam invisible. The correction
  adds a plugin-owned metadata artifact and a published `./doctor` export; host code imports only that
  declared adapter module.
- The e2e local-source lane previously installed the published package outside the userland suite.
  Local lanes now pass `--local-path`, so the e2e measures the worktree under test.
- The corrected lane reaches known #1010: generation reports `0 written` and doctor exits 1 with
  workers/sagas registry errors. This is dependency evidence, not a doctor regression.
