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
