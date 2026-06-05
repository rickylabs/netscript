# Fitness Gates

Fitness gates are the executable form of the doctrine. Doctrine source:
`.llm/research/architecture-doctrine-docs-v2/doctrine/09-anti-patterns-and-fitness-functions.md`.

Phase A does not implement scripts. This file defines the run contract, expected script names, and
evaluator reporting shape.

## Gates

| Gate | Name                         | Script target                            | Primary AP coverage      |
| ---- | ---------------------------- | ---------------------------------------- | ------------------------ |
| F-1  | File-size lint               | `.llm/tools/check-file-sizes.ts`         | AP-1                     |
| F-2  | Helper-reinvention scan      | `.llm/tools/check-helper-reinvention.ts` | AP-2, AP-9               |
| F-3  | Layering check               | `.llm/tools/check-layering.ts`           | AP-16, AP-17             |
| F-4  | Inheritance audit            | `.llm/tools/check-inheritance.ts`        | AP-4, AP-5, AP-6         |
| F-5  | Public surface audit         | `.llm/tools/check-doc-coverage.ts`       | AP-14, AP-15             |
| F-6  | JSR publishability           | built-in `deno publish --dry-run`        | public package readiness |
| F-7  | Doc-score gate               | JSR score/manual until automated         | public docs readiness    |
| F-8  | Workspace lib check          | `.llm/tools/check-workspace-lib.ts`      | AP-20                    |
| F-9  | Permission declaration check | `.llm/tools/check-permission-decl.ts`    | AP-19                    |
| F-10 | Test-shape audit             | `.llm/tools/check-test-shape.ts`         | AP-1, AP-18              |
| F-11 | Forbidden-folder lint        | `.llm/tools/check-forbidden-folders.ts`  | AP-16, AP-17             |
| F-12 | Naming-convention lint       | `.llm/tools/check-naming.ts`             | AP-15                    |
| F-13 | Saga/runtime invariants      | `.llm/tools/check-saga-invariants.ts`    | AP-10, AP-11, AP-12      |
| F-14 | Console-log lint             | `.llm/tools/check-console-usage.ts`      | AP-13                    |
| F-15 | Re-export-upstream lint      | `.llm/tools/check-upstream-reexport.ts`  | AP-14                    |

## Reporting States

| State            | Meaning                                                               |
| ---------------- | --------------------------------------------------------------------- |
| `PASS`           | Script or manual equivalent found no violation.                       |
| `FAIL`           | Violation found and not accepted as debt.                             |
| `PENDING_SCRIPT` | Phase A or later script does not exist yet; manual evidence required. |
| `N/A`            | Gate does not apply to the archetype or scope.                        |
| `DEBT_ACCEPTED`  | Violation exists and has a valid `arch-debt.md` entry.                |

## Manual Evidence Before Scripts Exist

When a script is not implemented, the generator/evaluator performs the narrowest manual check that
matches the gate. Examples:

- F-1: inspect line counts for changed package files.
- F-3: inspect imports across touched role folders.
- F-5: run `deno doc --lint` and read exported symbols.
- F-9: compare README permissions to touched `Deno.*`, network, KV, and process calls.
- F-15: inspect changed exports.

Manual evidence is temporary. Later phases replace it with scripts.

## Debt Rule

A known violation can close only as `DEBT_ACCEPTED` when `../debt/arch-debt.md` has a matching,
time-bounded entry. Unrecorded violations cause `FAIL_DEBT` or `FAIL_FIX` depending on whether code
changes are required.
