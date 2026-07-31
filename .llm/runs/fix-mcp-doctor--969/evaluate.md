# Evaluation: PR #981 - fix(mcp): doctor agrees with the running AppHost

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `run-30645811233-1`            |
| Target         | `fix/mcp-doctor-truthful-report` |
| Archetype      | `6 - CLI Tooling`              |
| Scope overlays | `none`                         |
| Evaluator      | `openhands-agent / 2025-07-31` |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | `PASS` | PLAN-EVAL waived (MECHANICAL classification, recorded in issue #969) |
| Design section exists in worklog       | `PASS` | `.llm/runs/fix-mcp-doctor--969/design.md` exists with 2 sections |
| Commit slices match design plan        | `PASS` | 1 slice: `ebf1aca5 fix(mcp): report doctor checks truthfully` |
| Each slice has a passing gate          | `PASS` | Fails-before tests verified, all 12 tests pass with fix |
| No speculative seams (unused files)    | `PASS` | All 5 changed files have clear purposes |
| Constants used for finite vocabularies | `PASS` | Status values use string literals consistently |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno check` on changed files | `PASS` | Exit code 0 | All 5 files typecheck cleanly |
| Slice typecheck  | Full workspace `deno check` | `PASS` | Exit code 0 | No new type errors introduced |
| Format           | `deno fmt --check` | `PASS` | Exit code 0 | All files formatted correctly |
| Lint             | `deno lint` | `PASS` | Exit code 0 | 4 lint warnings (pre-existing, not in changed code) |
| Doc lint         | N/A | `N/A` | No documentation changes | Scope is implementation only |
| Publish dry-run  | N/A | `N/A` | No package publishing | CLI tooling change |
| Link/path check  | N/A | `N/A` | No links or paths affected | N/A |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | `PASS` | No files exceed size limits | None |
| F-2  | Helper-reinvention scan      | `PASS` | No helper reinvention | None |
| F-3  | Layering check               | `PASS` | Proper layering maintained | None |
| F-4  | Inheritance audit            | `PASS` | No inheritance changes | None |
| F-5  | Public surface audit         | `PASS` | Public API unchanged | None |
| F-6  | JSR publishability gate      | `N/A` | No package publishing | N/A |
| F-7  | Doc-score gate               | `N/A` | No documentation changes | N/A |
| F-8  | Workspace `lib` override check | `PASS` | No lib overrides | None |
| F-9  | Permission declaration check | `PASS` | No permission changes | None |
| F-10 | Test-shape audit             | `PASS` | Tests follow established patterns | None |
| F-11 | Forbidden-folder lint        | `PASS` | No forbidden folders | None |
| F-12 | Naming-convention lint       | `PASS` | Naming conventions followed | None |
| F-13 | Saga and runtime invariants  | `N/A` | No saga/runtime changes | N/A |
| F-14 | Console-log lint             | `PASS` | No console.log additions | None |
| F-15 | Re-export-of-upstream lint   | `PASS` | No upstream re-exports | None |
| F-16 | Folder-cardinality lint      | `PASS` | No folder cardinality issues | None |
| F-17 | Abstract-derived co-location lint | `N/A` | No abstract-derived types | N/A |
| F-18 | Sub-barrel lint              | `PASS` | No barrel changes | None |
| F-19 | Scoped source gate runners   | `PASS` | All tests pass | None |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| Fails-before test 1 | Telemetry probe HTTP semantics | `PASS` | Test fails without fix (removed `res.ok`), passes with fix |
| Fails-before test 2 | AppHost marker file extension | `PASS` | Test fails without fix (changed to `.ts`), passes with fix (`.mts`) |
| Test suite (doctor) | `deno test packages/mcp/tests/doctor_test.ts` | `PASS` | 7/7 tests pass |
| Test suite (doctor-families) | `deno test packages/mcp/tests/doctor-families_test.ts` | `PASS` | 4/4 tests pass |
| Test suite (cli-mcp-adapters) | `deno test packages/cli/src/public/features/agent/mcp/cli-mcp-adapters_test.ts` | `PASS` | 1/1 test passes |
| Architecture check | `deno task arch:check` | `PASS` | Exit code 0, warnings are pre-existing |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| CLI users | Command catalog unchanged | `PASS` | No changes to command registry structure |
| MCP consumers | Doctor report truthful | `PASS` | Telemetry probe now correctly rejects HTTP errors, AppHost marker recognized |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | `N/A` | No file size changes in changed files | N/A |
| AP-2  | `CLEAR` | No helper reinvention | Fix uses existing `res.ok` pattern |
| AP-3  | `CLEAR` | Proper layering maintained | Infrastructure layer only |
| AP-4  | `N/A` | No inheritance changes | N/A |
| AP-5  | `CLEAR` | Public API unchanged | Only internal behavior fixed |
| AP-6  | `N/A` | No package publishing | N/A |
| AP-7  | `N/A` | No documentation changes | N/A |
| AP-8  | `CLEAR` | No lib overrides | N/A |
| AP-9  | `CLEAR` | No permission changes | N/A |
| AP-10 | `CLEAR` | Tests follow patterns | Fails-before pattern used correctly |
| AP-11 | `CLEAR` | No forbidden folders | N/A |
| AP-12 | `CLEAR` | Naming conventions followed | N/A |
| AP-13 | `N/A` | No saga/runtime changes | N/A |
| AP-14 | `CLEAR` | No console.log additions | N/A |
| AP-15 | `CLEAR` | No upstream re-exports | N/A |
| AP-16 | `CLEAR` | No folder cardinality issues | N/A |
| AP-17 | `N/A` | No abstract-derived types | N/A |
| AP-18 | `CLEAR` | No barrel changes | N/A |
| AP-19 | `N/A` | No scope gate changes | N/A |
| AP-20 | `CLEAR` | Command catalog not expanded | Verified via test |
| AP-21 | `CLEAR` | Issue framing corrected | PR body explicitly notes MECHANICAL classification |
| AP-22 | `CLEAR` | No speculative scope | Only 2 defects fixed, both from issue #969 |
| AP-23 | `CLEAR` | No plugin-owned workers metadata | Verified command catalog unchanged |
| AP-24 | `CLEAR` | No false expansion | Fix is minimal and targeted |
| AP-25 | `CLEAR` | No debt introduced | N/A |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new architecture debt introduced |
| Resolved entries      | 0     | No existing debt resolved |
| Deepened violations   | 0     | No violations deepened |
| Unrecorded violations | 0     | No unrecorded violations |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| None     | None    | All gates pass, both defects fixed correctly | None |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Fails-before pattern valuable | Regression tests that fail without the fix and pass with it provide strong evidence | All archetypes | `high` |
| MECHANICAL classification accurate | Simple, targeted fixes with clear scope benefit from PLAN-EVAL waiver | Archetype 6 (CLI Tooling) | `high` |
| Issue framing corrections important | Explicitly noting scope corrections prevents future confusion | All archetypes | `medium` |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Both defects in issue #969 are correctly fixed with proven fails-before regression guards. All 12 tests pass, all static gates pass, command catalog behavior unchanged, no false scope expansion, issue framing correction documented, PLAN-EVAL waiver appropriate for MECHANICAL classification. |

OPENHANDS_VERDICT: PASS

