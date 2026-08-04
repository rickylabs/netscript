# Evaluation: fix-plugin-remove-bare-name-rollback--w5-v3

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `fix-plugin-remove-bare-name-rollback--w5-v3` |
| Target         | PR #1237 / Issue #1236 — plugin remove bare-name dispatch and rollback |
| Archetype      | `6 — CLI / Tooling` |
| Scope overlays | `none` |
| Evaluator      | `Independent IMPL-EVAL session, 2026-08-04` |

## Process Verification

| Check                                  | Result   | Evidence |
| -------------------------------------- | -------- | -------- |
| Plan-Gate passed before implementation | PASS     | `plan-eval.md` all rows COMPOSED per milestone-run.md + orchestrator ruling D6; authorized composition, not self-certified. |
| Design section exists in worklog       | PASS     | `worklog.md` `## Design` section covers public surface, spine/layer-2 abstracts, domain vocabulary, ports, constants, extension axes, generated outputs, permissions, commit slices, deferred scope. |
| Commit slices match design plan        | PASS     | 5 slices (S0–S4): plan lock (a1d2d46ef), RED test (ed4b342e2), atomic removal + lifecycle (fba403646), gate evidence (bb01b59ff, 22e3c2e15). Matches plan.md S0–S4. |
| Each slice has a passing gate          | PASS     | S0: composed plan-gate row. S1: RED test exited 1 on baseline. S2/S3: focused tests 3/3 pass. S4: quality/doc/JSR/scaffold.runtime green. |
| No speculative seams (unused files)    | PASS     | All five files in `remove/` are exercised by the test suite; no dead code introduced. |
| Constants used for finite vocabularies | PASS     | `MANAGED_INSTALL_FILES` const array in `install-plugin.ts`; removal path constants reuse `join()` with the plan's configured name — no new hardcoded plugin-name switch. |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno run … run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 0 occurrences, 7 batches, 0 failures. | All 791 selected files clean. |
| Slice typecheck  | `deno test --unstable-kv -A …/remove-plugin_test.ts` | PASS | 3 passed, 0 failed (374ms). | Focused remove, rollback, and lifecycle tests all green. |
| Format           | `deno run … run-deno-fmt.ts --root packages/cli --ext ts,tsx` | PASS | 0 findings on touched files. | One pre-existing finding in `packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` (not touched by this PR). |
| Lint             | `deno run … run-deno-lint.ts --root packages/cli --ext ts,tsx` | PASS | 0 findings. | No new lint ignores introduced. |
| Doc lint         | `deno run … run-deno-doc-lint.ts --root packages/cli --pretty` | PASS | combinedTotal: 0 (privateTypeRef, missingJSDoc, other all 0). | |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` | PASS | "Success Dry run complete". | |
| Link/path check  | `rtk git diff 3677973bc..HEAD --stat` | PASS | 16 files changed, 1021 insertions, 28 deletions. All paths within `packages/cli` source and run artifacts. | |

## Fitness Gates

| Gate | Function                     | Result         | Evidence | Violations |
| ---- | ---------------------------- | -------------- | -------- | ---------- |
| F-1  | File-size lint               | PASS           | remove-plugin.ts: 236 LOC (≤250 use-case cap); plugin-removal-plan.ts: 166 LOC; project-path-snapshot.ts: 69 LOC; remove-plugin-command.ts: 76 LOC (≤150 presentation cap). | none |
| F-2  | Helper-reinvention scan      | PASS           | Uses existing `validateResourceName`, `resolvePluginPackageSpec`, `reconcilePluginReferences`, `regenerateAspireHelpers`. No new utility duplicating upstream. | none |
| F-3  | Layering check               | PASS           | F-CLI-3/4: no cross-surface imports, no kernel-from-surface imports in remove feature. | none |
| F-4  | Inheritance audit            | PASS           | No new abstract class introduced. | none |
| F-5  | Public surface audit         | PASS           | No new package export. `removePlugin()` and command API unchanged. | none |
| F-6  | JSR publishability gate      | PASS           | Publish dry-run exit 0; doc-lint combinedTotal 0. | none |
| F-7  | Doc-score gate               | PASS           | doc-lint combinedTotal: 0. | none |
| F-8  | Workspace `lib` override check | PASS         | No deno.json workspace change. | none |
| F-9  | Permission declaration check | PASS           | No new permission required; existing --allow-read/write/run cover all operations. | none |
| F-10 | Test-shape audit             | PASS           | Three focused tests: dispatch-resolution, rollback, and public lifecycle. Semantic assertions, not string snapshots (AP-18 clear). | none |
| F-11 | Forbidden-folder lint        | PASS           | No forbidden folder created. | none |
| F-12 | Naming-convention lint       | PASS           | File names follow feature patterns. | none |
| F-13 | Saga and runtime invariants  | N/A            | No saga or runtime change. | none |
| F-14 | Console-log lint             | PASS           | 0 console.log/error/warn calls in remove feature. | none |
| F-15 | Re-export-of-upstream lint   | N/A            | No upstream re-exports. | none |
| F-16 | Folder-cardinality lint      | PASS           | `remove/` has 5 files (≤12 cap). | none |
| F-17 | Abstract-derived co-location lint | PASS       | No new abstract. | none |
| F-18 | Sub-barrel lint              | PASS           | No mod.ts/index.ts introduced in feature folder. | none |
| F-19 | Scoped source gate runners   | PASS           | quality:gate exit 0, 0 scanner findings, 7 pre-existing allowances (none in remove files). | none |

## Runtime Gates

| Gate                     | Validation | Result | Evidence |
| ------------------------ | ---------- | ------ | -------- |
| Focused remove tests     | `deno test --unstable-kv -A …/remove-plugin_test.ts` | PASS | 3 passed, 0 failed. |
| Full CLI E2E (scaffold.runtime) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | PASS | Clean retry: 71 passed, 0 failed. First run's transient `workers-api` timeout is recorded as infrastructure behavior (drift D4); cleanup and leak-check were clean. |
| Plugin doctor after remove | Lifecycle test invokes `createDoctorPluginCommand` after remove | PASS | Doctor exits clean with no diagnostic findings. |

## Consumer Gates

| Consumer             | Validation | Result | Evidence |
| -------------------- | ---------- | ------ | -------- |
| Public CLI contract  | `plugin remove <configured-name>` help unchanged; bare-name argument proven by lifecycle test | PASS | Test installs streams by `--local-path`, removes by bare name `streams`, dispatch receives `@netscript/plugin-streams`. |
| Plugin install state | `install-plugin.ts` records pre/post install state in scaffold manifest | PASS | `managedFilesBefore`/`managedFilesAfter` and `rootDenoJsonBefore`/`rootDenoJsonAfter` enable three-way reversal. |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | No monolith. remove-plugin.ts at 236 LOC decomposed into plan, snapshot, and use-case files. | |
| AP-2  | N/A    | Not in scope. | |
| AP-3  | N/A    | Not in scope. | |
| AP-4  | N/A    | Not in scope. | |
| AP-5  | N/A    | Not in scope. | |
| AP-6  | CLEAR  | No base class with concrete orchestration. `removePlugin()` is a free function; dependencies injected via `RemovePluginDependencies`. | |
| AP-7  | N/A    | Not in scope. | |
| AP-8  | N/A    | Not in scope. | |
| AP-9  | N/A    | Not in scope. | |
| AP-10 | N/A    | Not in scope. | |
| AP-11 | CLEAR  | No filesystem/process access outside ports. `Deno.makeTempDir`/`Deno.writeTextFile`/`Deno.remove` appear only in test fixtures (`remove-plugin_test.ts`). | |
| AP-12 | N/A    | Not in scope. | |
| AP-13 | N/A    | Not in scope. | |
| AP-14 | N/A    | Not in scope. | |
| AP-15 | N/A    | Not in scope. | |
| AP-16 | CLEAR  | No root helpers.ts pattern. | |
| AP-17 | N/A    | Not in scope. | |
| AP-18 | CLEAR  | Tests assert semantic properties (file content equality, directory absence, dispatch package specifier, error message vocabulary), not giant string snapshots. | |
| AP-19 | CLEAR  | No new permissions required. | |
| AP-20 | N/A    | Not in scope. | |
| AP-21 | CLEAR  | Feature folder respects cardinality (5 files ≤ 12). | |
| AP-22 | CLEAR  | No barrel file introduced. | |
| AP-23 | CLEAR  | No inline command body in composition. Command wiring stays in existing composition. | |
| AP-24 | N/A    | Not in scope. | |
| AP-25 | CLEAR  | No side effects in non-edge files. All IO goes through injected ports. | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new debt introduced. |
| Resolved entries      | 1     | `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` closed: status changed to "closed by #1236 / PR #1237 (2026-08-04)". Gate requires reverse-plan contract and add/remove/re-add lifecycle — proven by focused lifecycle test and scaffold.runtime 71/71. |
| Deepened violations   | 0     | Archetype 6 Restructure verdict not deepened; changes are in the existing vertical feature slice. |
| Unrecorded violations | 0     | No doctrine violation found in the implementation. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| (none)   | —       | —        | —               |

## Close-Gate Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Issue #1236 acceptance criteria | PASS | All 6 boxes checked with linked evidence in PR body `acceptance-evidence` block. |
| Issue #1236 `gate:` checkboxes | PASS | No `gate:` label on issue; acceptance boxes are the close-gate. All satisfied. |
| PR #1237 Definition-of-Done | PASS | All 6 DoD checkboxes checked in PR body. |
| PR closing keyword | PASS | PR body contains `Closes #1236`. |
| PR labels | PASS | `type:fix`, `area:cli`, `area:plugins`, `status:ready-merge`, `priority:p2`. |
| PR milestone | PASS | Milestone `0.0.5` assigned. |
| deno.lock hygiene | PASS | Pre-existing user-owned modification excluded from all commits; `rtk git diff --stat` shows only `deno.lock | 1 +` (unstaged). |

## SKILL Chapter Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Agent briefs carry SKILL chapter | PASS | This evaluation was invoked with a `## SKILL` chapter naming all relevant skills. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence          |
| --------- | ----------- | -------------- | ------------------- |
| (none)    | —           | —              | —                   |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All five evaluation criteria are independently verified: (1) bare configured-name resolves to `@netscript/plugin-sagas`/`@netscript/plugin-streams` before dispatch — proven by dispatch assertion; (2) all validation and snapshotting precedes mutation — `planPluginRemoval()` + `captureProjectPaths()` complete before the try/catch mutation block; (3) dispatch failures preserve state (dispatch is outside the try/catch), post-mutation failures restore byte-for-byte — proven by rollback test with injected regeneration failure; (4) public install→remove restores owned config, registries, generated wiring, and doctor is clean — proven by lifecycle test using real filesystem and public command tree; (5) all Archetype-6 static/fitness/JSR/E2E gates pass with no new ignores, casts, or lock churn. The `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` debt entry is properly closed with lifecycle and full E2E evidence. PR #1237 satisfies the close-gate for issue #1236. |
