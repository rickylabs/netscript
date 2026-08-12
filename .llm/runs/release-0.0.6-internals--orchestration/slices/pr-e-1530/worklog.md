# PR-E #1530 Worklog

## Design

This implementation follows the orchestrator's locked E1–E4 sequence and the dispatch contract.
The scanner's public CLI and scan result types do not change.

| Slice | Contract and files | Gate |
| --- | --- | --- |
| E1 | Add a RED regression fixture in `.llm/tools/quality/scan-code-quality_test.ts`. | Target test fails before the scanner change. |
| E2 | Add a named directory-and-suffix predicate in `.llm/tools/quality/scan-code-quality.ts`. | Quality tests pass; repo scan no longer reports negative type fixtures. |
| E3 | Add ordinary-source, suffix-only, and directory-only leakage controls in the scanner test. | All three controls remain findings. |
| E4 | Remove two redundant SDK fixture allowances and run the full gate set. | Repo `allowCount` falls 10 → 8; all required gates pass. |

Deferred: export awareness, allowance issue links, `--max-allow` task wiring, docs-fence scanning,
workflow changes, and scaffold/runtime E2E. No package/plugin public surface changes.

PLAN-EVAL: PASS in the orchestrator rail plan; PR #1553 run 31589648809 at `69ef5f15d`.

## E1 — RED fixture

- Baseline `deno task quality:scan:repo`: exit 1; five `ts-error-suppression` findings;
  `allowCount: 10`.
- Added the negative type-fixture regression test before changing scanner scope.
- The dispatch requires this failing test as its own commit, superseding the rail Design row that
  groups E1 and E2 into one landed-green slice.
- Reconcile: live issue #1530 and draft PR #1560 were read; the PR remains draft and retains
  `Closes #1530`. E2 is the immediate next slice that restores green.

## E2 — directory-and-suffix exemption

- Added `isTypeFixture`, which normalizes path separators and requires both
  `/tests/type-fixtures/` and `_type.ts`.
- Quality tool tests: 7 passed, 0 failed, exit 0.
- Repo-wide scan: exit 0 with `allowCount: 8`; E4 still removes the now-unreachable allowance
  comments from source so the repository no longer carries redundant policy prose.
- Reconcile: the E1 RED is resolved without changing fixture assertions. PR #1560 remains draft;
  E3 must still prove the exemption does not leak.

## E3 — leakage controls

- Added one table-shaped test proving three paths remain scanned: ordinary source, `_type.ts`
  outside `tests/type-fixtures/`, and a non-`_type.ts` file inside that directory.
- Quality tool tests: 8 passed, 0 failed, exit 0.
- Reconcile: live contract coverage now proves both sides of the conjunction. PR #1560 remains
  draft; E4 owns redundant-comment removal and final gates.
