# Evaluation: <target>

Fill this template during evaluation. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `<run-id>`                     |
| Target         | `<target>`                     |
| Archetype      | `<N - name                     |
| Scope overlays | `<frontend/service/docs/none>` |
| Evaluator      | `<session/date>`               |

## Process Verification

| Check                                  | Result        | Evidence                    |
| -------------------------------------- | ------------- | --------------------------- |
| Plan-Gate passed before implementation | `<PASS/FAIL>` | `<plan-eval.md verdict>`    |
| Design section exists in worklog       | `<PASS/FAIL>` | `<section heading found>`   |
| Commit slices match design plan        | `<PASS/FAIL>` | `<slice count and order>`   |
| Each slice has a passing gate          | `<PASS/FAIL>` | `<gate evidence per slice>` |
| No speculative seams (unused files)    | `<PASS/FAIL>` | `<dead code scan>`          |
| Constants used for finite vocabularies | `<PASS/FAIL>` | `<string literal scan>`     |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `<command>`      |        |          |       |
| Slice typecheck  | `<command>`      |        |          |       |
| Format           | `<command>`      |        |          |       |
| Lint             | `<command>`      |        |          |       |
| Doc lint         | `<command>`      |        |          |       |
| Publish dry-run  | `<command>`      |        |          |       |
| Link/path check  | `<files>`        |        |          |       |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               |        |          |            |
| F-2  | Helper-reinvention scan      |        |          |            |
| F-3  | Layering check               |        |          |            |
| F-4  | Inheritance audit            |        |          |            |
| F-5  | Public surface audit         |        |          |            |
| F-6  | JSR publishability           |        |          |            |
| F-7  | Doc-score gate               |        |          |            |
| F-8  | Workspace lib check          |        |          |            |
| F-9  | Permission declaration check |        |          |            |
| F-10 | Test-shape audit             |        |          |            |
| F-11 | Forbidden-folder lint        |        |          |            |
| F-12 | Naming-convention lint       |        |          |            |
| F-13 | Saga/runtime invariants      |        |          |            |
| F-14 | Console-log lint             |        |          |            |
| F-15 | Re-export-upstream lint      |        |          |            |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| `<gate>` | `<validation>` |        |          |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| `<consumer>` | `<validation>` |        |          |

## Anti-Pattern Check

Only mark `CLEAR` when the run scope touched or could affect the pattern. Use `N/A` for patterns
outside scope. Use `DEBT_ACCEPTED` only with a matching `debt/arch-debt.md` entry.

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  |        |          |       |
| AP-2  |        |          |       |
| AP-3  |        |          |       |
| AP-4  |        |          |       |
| AP-5  |        |          |       |
| AP-6  |        |          |       |
| AP-7  |        |          |       |
| AP-8  |        |          |       |
| AP-9  |        |          |       |
| AP-10 |        |          |       |
| AP-11 |        |          |       |
| AP-12 |        |          |       |
| AP-13 |        |          |       |
| AP-14 |        |          |       |
| AP-15 |        |          |       |
| AP-16 |        |          |       |
| AP-17 |        |          |       |
| AP-18 |        |          |       |
| AP-19 |        |          |       |
| AP-20 |        |          |       |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           |       |          |
| Resolved entries      |       |          |
| Deepened violations   |       |          |
| Unrecorded violations |       |          |

## Findings

| Severity            | Finding     | Evidence     | Required action      |
| ------------------- | ----------- | ------------ | -------------------- |
| `<high/medium/low>` | `<finding>` | `<evidence>` | `<fix/debt/rescope>` |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence          |
| --------- | ----------- | -------------- | ------------------- |
| `<title>` | `<pattern>` | `<archetypes>` | `<low/medium/high>` |

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | `<PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT>` |
| Rationale | `<why>`                                  |
