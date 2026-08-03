# Evaluation: S1 only — command-gate retry + attempt-visible verdicts (closes #1168)

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `feat-1169-one-pass-publish--design`               |
| Target         | S1 only (PR #1176, closes #1168)                   |
| Archetype      | N/A — tooling/CI surface (e2e workspace-internal)  |
| Scope overlays | none                                               |
| Evaluator      | IMPL-EVAL · Qwen 3.7-max · 2026-08-03             |

## Process Verification

| Check                                  | Result | Evidence                                                                                          |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | Waived by owner in writing; recorded in `drift.md` entry 1 ("plan approved by me proceed")        |
| Design section exists in worklog       | PASS   | `worklog.md` § "Design" with public surface, domain vocabulary, ports, constants, commit slices   |
| Commit slices match design plan        | PASS   | 1 commit `26970dad9` for S1; sign-off `a4af0950b`; matches plan.md slice table                    |
| Each slice has a passing gate          | PASS   | Independent re-run below (check 117/0, test 80/0); print-failed-report-steps parser 4/0          |
| No speculative seams (unused files)    | PASS   | Every changed file is consumed: GateAttempt/GateFailureClass imported by command-gate, report, gate-runner, pretty-reporter |
| Constants used for finite vocabularies | PASS   | `RETRYABLE_COMMAND_FAILURE_CLASSES`, `MAX_COMMAND_GATE_ATTEMPTS = 2`, `CANCELED_EXIT_CODE = 6`, `CANCELED_MARKER` regex |

## Static Gates

| Gate             | Command or check                                                    | Result | Evidence                                                  | Notes              |
| ---------------- | ------------------------------------------------------------------- | ------ | --------------------------------------------------------- | ------------------ |
| Narrow typecheck | `run-deno-check.ts --root packages/cli/e2e --ext ts`                | PASS   | 117 files selected, 0 failed batches, 0 findings (re-run) |                    |
| Unit tests       | `deno task --cwd packages/cli/e2e test`                             | PASS   | 80 passed, 0 failed (re-run); includes 6 new retry tests  |                    |
| Parser compat    | `deno test .llm/tools/e2e/print-failed-report-steps_test.ts`        | PASS   | 4 passed, 0 failed (re-run); no parser edit needed        |                    |
| Lint             | `run-deno-lint.ts --root packages/cli/e2e --ext ts`                 | PASS   | Worklog claim: 0 findings; diff smell scan: 0 occurrences | Lane-run verified  |
| Format           | `run-deno-fmt.ts --root packages/cli/e2e --ext ts`                  | PASS   | Worklog claim: 117 files, 0 findings                      | Lane-run verified  |
| Doc lint         | N/A — no public package surface changes                             | N/A    | e2e is workspace-internal, publish-excluded               |                    |
| Publish dry-run  | N/A — e2e package not published to JSR                              | N/A    |                                                           |                    |
| Link/path check  | N/A                                                                 | N/A    |                                                           |                    |

## Fitness Gates

| Gate | Function                         | Result | Evidence                                                              | Violations |
| ---- | -------------------------------- | ------ | --------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                   | N/A    | No large files introduced; largest new file is test at 173 lines      |            |
| F-2  | Helper-reinvention scan          | PASS   | Retry loop uses plain `for`; `performance.now()` for timing — stdlib  |            |
| F-3  | Layering check                   | PASS   | command-gate (application) → gate-definition (domain); correct direction |         |
| F-4  | Inheritance audit                | PASS   | `CommandGate` unchanged class hierarchy; no new inheritance           |            |
| F-5  | Public surface audit             | N/A    | e2e is workspace-internal; no public API                              |            |
| F-6  | JSR publishability gate          | N/A    | e2e not published                                                     |            |
| F-7  | Doc-score gate                   | N/A    | No doc-bearing files changed                                          |            |
| F-8  | Workspace `lib` override check   | N/A    | No lib override touched                                               |            |
| F-9  | Permission declaration check     | N/A    | No new Deno permission flags                                          |            |
| F-10 | Test-shape audit                 | PASS   | 6 new tests use fake `SequenceCommandExecutor`; no real process I/O   |            |
| F-11 | Forbidden-folder lint            | PASS   | New files in existing `tests/` and `src/` locations                   |            |
| F-12 | Naming-convention lint           | PASS   | `GateFailureClass`, `GateAttempt`, `shouldRetry` — kebab-case files, PascalCase types | |
| F-13 | Saga and runtime invariants      | N/A    | No saga or runtime framework code touched                             |            |
| F-14 | Console-log lint                 | PASS   | No `console.log` added; pretty-reporter uses `Deno.stdout.write`      |            |
| F-15 | Re-export-of-upstream lint       | N/A    | No re-exports added                                                   |            |
| F-16 | Folder-cardinality lint          | PASS   | No new folders created                                                 |            |
| F-17 | Abstract-derived co-location     | N/A    | No abstract types introduced                                          |            |
| F-18 | Sub-barrel lint                  | N/A    | No barrel files changed                                               |            |
| F-19 | Scoped source gate runners       | N/A    | No gate runner changes outside e2e                                    |            |

## Runtime Gates

| Gate                  | Validation                                                                                | Result | Evidence                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Negative: assertion   | Assertion failure (exit 1) with retry configured → exactly 1 attempt, not retried          | PASS   | `command-gate_test.ts` L18-32: `executor.requests.length === 1`, `retried === false`, `failureClass === 'assertion'`. Test passes.                      |
| Negative: shouldRetry | `shouldRetry('assertion', ['assertion'])` returns false in code, not convention            | PASS   | `command-gate.ts` L94: `if (failureClass === 'assertion' ...) return false` — checked BEFORE consulting `configuredClasses`                              |
| Positive: timeout     | Timeout → 2 attempts; second passes → verdict passed, retried true                         | PASS   | `command-gate_test.ts` L34-52: `executor.requests.length === 2`, `verdict === 'passed'`, `retried === true`. Test passes.                               |
| Positive: canceled    | Exit 6 + `task was canceled` → classified canceled, retried                                | PASS   | `command-gate_test.ts` L54-64: case-insensitive marker match, `failureClass === 'canceled'`, 2 requests. Test passes.                                    |
| Negative: bare exit 6 | Exit 6 WITHOUT canceled marker → assertion, NOT retried                                    | PASS   | `command-gate_test.ts` L66-73: `failureClass === 'assertion'`, `retried === false`, 1 request. Test passes.                                             |
| Exhausted retries     | Both attempts time out → verdict failed, both durations present                            | PASS   | `command-gate_test.ts` L75-84: `attempts.length === 2`, `every(a => a.durationMs >= 0)`, both `failureClass === 'timeout'`. Test passes.                 |
| No retry configured   | Single attempt, `attempts.length === 1`, `retried: false`                                  | PASS   | `command-gate_test.ts` L86-93: 1 request, correct shape. Test passes.                                                                                    |
| Report flow           | `attempts`/`retried` reach StepResult via spread in `runGate`                              | PASS   | `gate-runner.ts` L43-46: `return { ...result, durationMs }` — `result` is `GateResult` which includes `attempts` and `retried`; `StepResult` declares both |
| Single opt-in         | Exactly one gate opts into retry (`runtime.aspire-restore`)                                | PASS   | `runtime-gates.ts` L76-92: `commandGate(GATE.RUNTIME_ASPIRE_RESTORE, ..., { classes: ['timeout', 'canceled'], maxRetries: 1 })`. `grep -rn 'retry'` returns only this + one code comment. All other 24 `commandGate` calls omit retry. |
| Reporter visibility   | Retried-pass prints distinctly; exhausted retries print all attempt durations              | PASS   | `pretty-reporter.ts` L37-45; `pretty-reporter_test.ts` L42-75 asserts `PASSED (attempt 2/2 after canceled attempt 1, 41s + 903s)`; L77-114 asserts `attempt durations: 900s + 900s` |

## Consumer Gates

| Consumer                          | Validation                                                 | Result | Evidence                                                                                        |
| --------------------------------- | ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `print-failed-report-steps.ts`    | Parser still works with extended StepResult shape          | PASS   | `deno test .llm/tools/e2e/print-failed-report-steps_test.ts` → 4 passed, 0 failed (re-run)    |
| Report JSON consumers             | `StepResult` gains `attempts` + `retried`; additive change | PASS   | `domain/report.ts` L13-14: fields added to interface; no existing field removed or renamed      |
| `suite-runner.ts`                 | Unchanged; flows GateResult through `runGate`              | PASS   | `gate-runner.ts` spread pattern unchanged; `suite-runner.ts` diff shows only type-import additions |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                   | Notes                                         |
| ----- | ------ | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| AP-1  | N/A    | No public package surface                                                                  | e2e is workspace-internal                     |
| AP-2  | N/A    | No new package                                                                             |                                               |
| AP-3  | CLEAR  | No circular imports; command-gate → gate-definition (domain), not reverse                  |                                               |
| AP-4  | CLEAR  | No `any` types introduced; diff smell scan = 0                                             |                                               |
| AP-5  | CLEAR  | No `deno-lint-ignore` added; diff smell scan = 0                                           |                                               |
| AP-6  | CLEAR  | No `as unknown as` added; diff smell scan = 0                                              |                                               |
| AP-7  | N/A    | No plugin scaffold                                                                         |                                               |
| AP-8  | N/A    | No Fresh/service code                                                                      |                                               |
| AP-9  | N/A    | No DB migration                                                                            |                                               |
| AP-10 | CLEAR  | Constants used for retryable classes, max attempts, exit code, marker regex                | Named, not magic                              |
| AP-11 | N/A    | No generated workspace                                                                    |                                               |
| AP-12 | CLEAR  | No barrel re-exports added                                                                 |                                               |
| AP-13 | N/A    | No saga code                                                                               |                                               |
| AP-14 | CLEAR  | `PrettyReporter` uses `Deno.stdout.write`, not `console.log`                               |                                               |
| AP-15 | N/A    | No upstream re-exports                                                                     |                                               |
| AP-16 | CLEAR  | No new folders                                                                             |                                               |
| AP-17 | N/A    | No abstract types                                                                          |                                               |
| AP-18 | N/A    | No sub-barrels                                                                             |                                               |
| AP-19 | CLEAR  | Gate runner unchanged; spread pattern preserved                                            |                                               |
| AP-20 | N/A    | No config surface                                                                          |                                               |
| AP-21 | N/A    | No permission changes                                                                      |                                               |
| AP-22 | N/A    | No lock file changes                                                                       |                                               |
| AP-23 | CLEAR  | `classifyFailure` is a pure function; `shouldRetry` is a pure function; both unit-testable  |                                               |
| AP-24 | N/A    | No documentation files in scope                                                            |                                               |
| AP-25 | N/A    | No release workflow touched                                                                | Per locked decision 4                         |

## Arch-Debt Delta

| Metric              | Count | Evidence                                                                                                                     |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| New entries         | 0     | No doctrine violations introduced                                                                                            |
| Resolved entries    | 0     | N/A for S1 scope                                                                                                             |
| Deepened violations | 0     | `commandGate` positional args growing (8 params) — accepted as cleanup candidate, not a deepening; sign-off noted this honestly |
| Unrecorded violations | 0   | HTTP gate classifying deadline failure as `assertion` is inert (HTTP gates cannot opt into retry); noted in sign-off, not a violation |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | None    | —        | —               |

### Accepted observations (non-blocking)

1. **Positional args growing** — `commandGate()` now takes 8 positional parameters. Future cleanup candidate for an options-object refactor. Not a finding because the existing call sites are unchanged and the new parameter is appended at the end with a default of `undefined`.
2. **HTTP gate failure class** — HTTP gate deadline failures are classified `assertion` (L76 of http-gate.ts). This is inert because HTTP gates have no retry policy and cannot opt in (different gate kind). Documented honestly in the sign-off.
3. **Skipped gates record a `passed` attempt** — `skipUnsupportedPlatform` in gate-runner.ts (L72) creates an attempt with `verdict: 'passed'` rather than `skipped`. `GateAttempt.verdict` only allows `'passed' | 'failed'`. Minor modeling debt; the gate-level verdict correctly says `'skipped'`.

## Lessons for Promotion

| Lesson                           | Pattern                                                                                              | Applies to     | Confidence |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| Hard-reject in code, not config  | `shouldRetry` checks `failureClass === 'assertion'` BEFORE consulting configured classes — even explicit opt-in cannot override | All archetypes | high       |
| Negative-first test design       | 4 of 6 new tests are negative cases; the assertion-rejection test passes `['assertion']` as retry classes to prove config cannot override | All archetypes | high       |
| Attempt-visible verdicts         | Every gate records `attempts[]` with per-attempt duration, failure class, and exit code — the primitive generalizes to S2/S3 provenance work | tooling/CI     | high       |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | PASS   |
| Rationale | All five required verification claims confirmed independently: (1) scoped check 117/0 and test 80/0 pass; (2) assertion failure with retry configured performs exactly one attempt — `shouldRetry` hard-rejects `assertion` in code before consulting config; (3) `attempts`/`retried` flow through `GateResult` → `StepResult` via spread in `runGate`; (4) exactly one gate (`runtime.aspire-restore`) opts into retry; (5) the Plan-Gate waiver is honestly recorded in drift.md. No doctrine violations introduced, no unrecorded debt, no speculative code. Three non-blocking observations recorded (positional args, HTTP gate class, skipped-as-passed modeling). S1 is ready for merge pending the last acceptance box (transient-vs-ceiling evidence from first real retry occurrence — intentionally deferred). |
