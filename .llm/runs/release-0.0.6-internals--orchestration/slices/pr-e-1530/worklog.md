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
| E5 | Refresh the generated consumer-tool asset after CI exposed the scanner's embedded-source coupling. | Generator diff contains only the embedded scanner plus bundle hash; regeneration is idempotent; quality gates stay green. |

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

## E4 — redundant allowances and final gates

- Removed only the trailing `quality-allow:` clauses from the two actual SDK fixture directives;
  the `@ts-expect-error` assertions and their assertion reasons remain unchanged.
- Base repo scan at `84dd44ae7`: exit 1, five findings, `allowCount: 10`.
- Head repo scan: exit 0, no findings, `allowCount: 8`.
- Fixture diff audit: only the two named trailing allowance clauses changed across all `*_type.ts`
  files. `deno.lock` is unchanged. No new suppression/cast/allowance construct was introduced.

| Gate | Result |
| --- | --- |
| Quality tool tests | exit 0; 8 passed, 0 failed |
| `quality:scan:repo` | exit 0; `findings: []`; `allowCount: 8` |
| `quality:scan` | exit 0; `findings: []`; `allowCount: 7` |
| `quality:gate` | exit 0; scanner and doctrine chain green (warnings non-blocking) |
| Scoped check | exit 0; 2 files, 0 findings |
| Scoped lint | exit 0; 2 files, 0 findings |
| Scoped fmt | initial exit 1 on the pre-existing test block adjacent to E1; file-only formatting applied; rerun exit 0, 2 files, 0 findings |

Reconcile: all six pre-merge acceptance boxes have evidence. Box 7 remains intentionally unmapped
and unchecked because it is marked `[post-merge]`. PR #1560 remains draft for orchestrator-owned
IMPL-EVAL and merge handling.

## E5 — generated asset freshness

- CI's `Generated asset freshness` step exposed that
  `.llm/tools/quality/scan-code-quality.ts` is bundled as consumer tool source in
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`.
- Ran `deno task gen:assets-barrel` from the repository root. The complete generated diff changes
  only the embedded scanner source (`isTypeFixture` plus the `isScannable` conjunction) and the
  derived bundle hash. No other tool source or generated entry changed.
- `skills.generated.ts` mentions the installed scanner command but does not embed the scanner's
  full source, so the canonical generator correctly left it unchanged.
- A second pre-commit generator run produced the identical one-file diff.

| Gate | Result |
| --- | --- |
| `gen:assets-barrel` | exit 0; generated diff remains exactly 2 additions / 2 deletions in `agent-tools.generated.ts` |
| Quality tool tests | exit 0; 8 passed, 0 failed |
| `quality:scan:repo` | exit 0; `findings: []`; `allowCount: 8` |
| `quality:gate` | exit 0; scanner and doctrine chain green (warnings non-blocking) |

Reconcile: E5 repairs the real CI coupling without changing scanner behavior or fixture assertions.
PR #1560 state, labels, milestone, existing IMPL-EVAL verdict, and merge authority remain untouched.
