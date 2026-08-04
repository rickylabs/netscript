# Evaluation: PR #1264 — fix(cli): detect incomplete Windows npm materialization

## Metadata

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Run ID         | `fix-windows-node-modules-materialization--1246`                       |
| Target         | `packages/cli` — generated scaffold verifier and recovery documentation |
| Archetype      | `6 — CLI/tooling`                                                      |
| Scope overlays | frontend consumer/dev-start surface                                    |
| Evaluator      | `qwen/qwen3.7-max` · session `ef9775bb-95fe-422c-9507-602dba016727` · 2026-08-04 · IMPL-EVAL |

## Process Verification

| Check                                  | Result | Evidence                                                                                                                               |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` records `COMPOSED_WAIVER` per milestone D6 ruling. Owner brief and `supervisor.md` confirm. Valid milestone override.    |
| Design section exists in worklog       | PASS   | `worklog.md` contains S0, S1, S2 entries with implementation contract, gate evidence, and drift notes.                                 |
| Commit slices match design plan        | PASS   | 3 commits: S0 `25dc8014f` (docs/harness), S1 `671f0ad41` (implementation), S2 `e24f624e2` (runtime evidence). Matches plan.md slices. |
| Each slice has a passing gate          | PASS   | S0: git boundary. S1: 33 tests, scoped check/lint/fmt, quality:scan, arch:check. S2: scaffold.runtime 71/0. All in worklog.md.        |
| No speculative seams (unused files)    | PASS   | `node-modules-verifier.ts` generated for both Aspire and non-Aspire scaffolds. `package-json.ts` always generated. Both wired in plan-init. |
| Constants used for finite vocabularies | PASS   | `SCAFFOLD_DEFAULTS.DENO_VERSION`, `SCAFFOLD_FILES.NODE_MODULES_VERIFIER`, `SCAFFOLD_FILES.PACKAGE_JSON`. No hardcoded literals in callers. |

## Static Gates

| Gate             | Command or check                                                                    | Result | Evidence                                                   | Notes |
| ---------------- | ----------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- | ----- |
| Narrow typecheck | `run-deno-check.ts` — 5 scoped roots, 58 files, 1 batch                            | PASS   | 0 occurrences, exit 0                                      |       |
| Slice typecheck  | Same as above                                                                       | PASS   | 0 occurrences                                              |       |
| Format           | `run-deno-fmt.ts` — 58 files, 1 batch                                              | PASS   | 0 findings                                                 |       |
| Lint             | `run-deno-lint.ts` — 58 files, 1 batch                                             | PASS   | 0 occurrences                                              |       |
| Doc lint         | N/A                                                                                 | N/A    | No CLI export or package dependency change                 |       |
| Publish dry-run  | N/A                                                                                 | N/A    | No `mod.ts` or `deno.json` exports change                  |       |
| Link/path check  | Generated file constants in `scaffold-files.ts` match generator names                | PASS   | `NODE_MODULES_VERIFIER: 'verify-node-modules.ts'` matches generator output filename |       |

## Fitness Gates

| Gate | Function                     | Result       | Evidence                                                                                                         | Violations |
| ---- | ---------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint               | PASS         | `node-modules-verifier.ts` generator: 169 LOC. `node-modules-verifier_test.ts`: 129 LOC. Both under limits.     |            |
| F-2  | Helper-reinvention scan      | PASS         | Uses `@std/path` join/relative/resolve. No hand-rolled path manipulation.                                        |            |
| F-3  | Layering check               | PASS         | Generator in `kernel/templates/workspace/`, consumed by `kernel/application/scaffold/plan-init.ts` — same layer. |            |
| F-4  | Inheritance audit            | N/A          | No class inheritance introduced.                                                                                  |            |
| F-5  | Public surface audit         | PASS         | `mod.ts` and `deno.json` exports unchanged (verified by empty diff).                                             |            |
| F-6  | JSR publishability gate      | N/A          | No public surface change.                                                                                        |            |
| F-7  | Doc-score gate               | PASS         | New functions have JSDoc one-liners. Module headers present.                                                     |            |
| F-8  | Workspace `lib` override check | N/A        | No workspace config changes.                                                                                     |            |
| F-9  | Permission declaration check | PASS         | Generated verifier declares `--allow-read --allow-env=DENO_DIR,LOCALAPPDATA,XDG_CACHE_HOME,HOME,USERPROFILE`.   |            |
| F-10 | Test-shape audit             | PASS         | Hermetic temp-dir fixtures with cleanup in `finally`. No snapshot assertions.                                    |            |
| F-11 | Forbidden-folder lint        | N/A          | No new folders created.                                                                                            |            |
| F-12 | Naming-convention lint       | PASS         | Files follow convention: `node-modules-verifier.ts`, `package-json.ts`.                                          |            |
| F-13 | Saga and runtime invariants  | N/A          | No saga changes.                                                                                                 |            |
| F-14 | Console-log lint             | N/A          | `console.error`/`console.log` in generated verifier output is expected (it IS the output renderer).              |            |
| F-15 | Re-export-of-upstream lint   | N/A          | No re-exports of upstream packages.                                                                              |            |
| F-16 | Folder-cardinality lint      | PASS         | 3 files added to `kernel/templates/workspace/` (9 total, ≤12). 0 files added to `kernel/constants/scaffold/` (10 total, ≤12). Both under R-A6-N1 limit. |            |
| F-17 | Abstract-derived co-location | N/A          | No new abstracts.                                                                                                |            |
| F-18 | Sub-barrel lint              | PASS         | No new barrel files.                                                                                             |            |
| F-19 | Scoped source gate runners   | N/A          |                                                                                                                  |            |

## Runtime Gates

| Gate                     | Validation                                                        | Result | Evidence                                                                                                             |
| ------------------------ | ----------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Verifier regression      | `node-modules-verifier_test.ts` (2 tests)                         | PASS   | 2 passed, 0 failed. Incomplete fixture fails with exact remediation. Complete fixture passes.                        |
| Scaffold plan tests      | `plan-init_test.ts` (7 tests)                                     | PASS   | 7 passed. Includes `scaffoldRoot always emits the npm materialization verifier and Deno pin`.                        |
| Workspace generators     | `generators_test.ts` (21 tests)                                   | PASS   | 21 passed. Includes `generatePackageJson pins the pre-window Deno runtime` and README tests.                         |
| Fresh adapter tests      | `fresh-adapter_test.ts` (1 test, 4 steps)                        | PASS   | 1 passed. `normalizeFreshOutput` updates `deno.json` with `deps:verify` prefix on dev task.                         |
| App generators-config    | `generators-config_test.ts` (2 tests, 15 steps)                   | PASS   | 2 passed. App `deno.json` dev task includes `deps:verify` prefix.                                                    |
| Full CLI package suite   | `deno test --allow-all` (full package)                            | PASS   | 595 passed (484 steps), 0 failed — worklog.md evidence.                                                              |
| scaffold.runtime         | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS   | 71 passed, 0 failed — worklog.md, evidence-comment.md, CI `scaffold-runtime` check pending/success.                  |
| Quality scan             | `quality:scan` + `arch:check`                                     | PASS   | No new findings. Seven pre-existing allowlisted findings only. CLI doctrine baseline unchanged. — worklog.md.         |

## Consumer Gates

| Consumer                | Validation                                                              | Result | Evidence                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| Root `dev` task         | Generated `deno.json` tasks.dev invokes `deps:verify` before app start  | PASS   | `deno-json.ts` line 82: `deno task deps:verify && deno run --allow-all …`                                            |
| Fresh app `dev` task    | Generated app `deno.json` tasks.dev invokes `deps:verify` before Vite   | PASS   | `fresh-adapter.ts` line 138: `deno task --cwd ../.. deps:verify && deno run -A npm:vite …`                          |
| Fresh app (normalize)   | `normalizeFreshOutput` preserves the `deps:verify` prefix on tasks.dev  | PASS   | `fresh-adapter_test.ts` step `should update deno.json with scoped name and exports` asserts the task content.         |
| Aspire startup          | Aspire starts the same app `dev` task                                   | PASS   | Aspire invokes `deno task dev` on the app workspace member, which already chains `deps:verify`. No Aspire-specific coupling. |
| Root `deps:verify` task | Standalone task exists for manual invocation                            | PASS   | `deno-json.ts` line 83-84: `'deps:verify': 'deno run --allow-read --allow-env=… .netscript/verify-node-modules.ts'` |
| Generated README        | Documents `deno install` → `deps:verify` → start sequence               | PASS   | `generate-readme.ts` lines 58-74: Quick Start block. Lines 164-185: Windows recovery section with upstream link.     |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                                    | Notes |
| ----- | ------ | ----------------------------------------------------------------------------------------------------------- | ----- |
| AP-1  | N/A    | No command pipeline introduced.                                                                             |       |
| AP-2  | N/A    |                                                                                                             |       |
| AP-3  | N/A    |                                                                                                             |       |
| AP-4  | N/A    |                                                                                                             |       |
| AP-5  | N/A    |                                                                                                             |       |
| AP-6  | N/A    | No base class with concrete orchestration.                                                                  |       |
| AP-7  | N/A    |                                                                                                             |       |
| AP-8  | N/A    |                                                                                                             |       |
| AP-9  | N/A    |                                                                                                             |       |
| AP-10 | N/A    |                                                                                                             |       |
| AP-11 | CLEAR  | `Deno.readDir`/`Deno.stat`/`Deno.env` only in generated verifier (a standalone script, not a kernel module). | Generator itself is pure string output. |
| AP-12 | N/A    |                                                                                                             |       |
| AP-13 | N/A    |                                                                                                             |       |
| AP-14 | N/A    |                                                                                                             |       |
| AP-15 | N/A    |                                                                                                             |       |
| AP-16 | CLEAR  | 3 files added to `kernel/templates/workspace/` (9 total, ≤12). 0 added to `kernel/constants/scaffold/` (10 total, ≤12). Both within R-A6-N1 cardinality limit. |       |
| AP-17 | N/A    |                                                                                                             |       |
| AP-18 | CLEAR  | Tests use semantic assertions (`assertStringIncludes` on specific filenames, remediation text), not snapshots. |       |
| AP-19 | CLEAR  | Generated verifier declares all needed permissions.                                                          |       |
| AP-20 | N/A    |                                                                                                             |       |
| AP-21 | CLEAR  | No flat command-surface folder. Verifier is a generated file, not a CLI command.                             |       |
| AP-22 | CLEAR  | No new barrel files.                                                                                         |       |
| AP-23 | CLEAR  | No inline command body in composition.                                                                       |       |
| AP-24 | N/A    |                                                                                                             |       |
| AP-25 | CLEAR  | Generated verifier uses `throw new Error()` for failure, not `Deno.exit()`. Side effects confined to the generated script. |       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                   |
| --------------------- | ----- | ---------------------------------------------------------- |
| New entries           | 0     | No changes to `docs/architecture/debt/arch-debt.md` (empty diff). |
| Resolved entries      | 0     | N/A                                                        |
| Deepened violations   | 0     | No new CLI doctrine debt. Baseline FAIL=50 WARN=50 unchanged. |
| Unrecorded violations | 0     | Quality scan clean. No new allowlisted findings.           |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | None    | —        | —               |

## Lessons for Promotion

| Lesson                                  | Pattern                                                                                      | Applies to | Confidence |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- | ---------- |
| Cache-marker exclusion law              | When comparing cache-to-local trees, Deno-owned bookkeeping (`.scripts-warned-*`) must be excluded from the comparison or the detector false-positives on a complete tree. | 6          | high       |
| Fail-closed no-op law for detectors     | A detector that silently skips when it cannot compare anything is worse than no detector. Always fail when zero items were verified. | 6, 5       | high       |
| Pre-window pin as honest mitigation     | When an upstream defect spans a version window, pin the pre-window version already proven in CI and describe it as a pre-window mitigation, not a proven fix. | 6          | medium     |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All approved scope is complete. The generated verifier correctly detects incomplete materialization (scoped packages, peer suffixes, registry roots, Deno-owned cache markers), fails closed when zero packages can be compared, and is wired into all claimed developer start paths (root `dev`, Fresh app `dev`, Aspire via app task, standalone `deps:verify`). Deno 2.9.0 is honestly described as a pre-window mitigation. `Refs #1246` is correct — native Windows acceptance is deferred to 0.0.6. No dependency, lock, public-surface, architecture-debt, or cleanup churn was introduced. Static gates pass independently. Focused tests (33 passed), full CLI suite (595 passed), and `scaffold.runtime` (71/0) all green. The `COMPOSED_WAIVER` for PLAN-EVAL is a valid milestone D6 process override, not a missing gate. |
