# Worklog — #1253 MCP export corpus

## Progress

| Date       | Slice | State       | Evidence                                                                                                   |
| ---------- | ----- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | 0     | bootstrap   | Issue read first; canary.7 failure reproduced over published stdio; release/version mismatch traced.       |
| 2026-08-04 | 1     | implemented | Release preparation regenerates/stages the corpus and structured failures retain their bounded root cause. |
| 2026-08-04 | 2     | verified    | A real 146-file scaffold calls docs and export search over CLI stdio; targeted and package gates pass.     |

## Gate results

| Family                 | Result                    | Evidence                                                                                                                      |
| ---------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Published reproduction | PASS (failure reproduced) | canary.7 initializes then returns generic `export_corpus_error`.                                                              |
| RED/GREEN              | PASS                      | Published canary.7 reproduced the version mismatch as a generic error; release sequence and diagnostic regressions are green. |
| Static/package         | PASS                      | Changed-file check/lint/fmt pass; MCP 110 tests, release/docs 91 tests, CLI 591 tests / 484 steps, all green.                 |
| Fitness/JSR            | PASS_WITH_BASELINE        | Root quality gate exits 0; direct MCP doctrine retains known baseline findings. Doc lint and publish dry-run pass.            |
| Real scaffold stdio    | PASS                      | Production CLI creates a 146-file scaffold, then both search tools succeed over JSON-RPC stdio.                               |
| Generated freshness    | PASS                      | Regenerated corpus hash `360081d7…`; `check:mcp-export-corpus` exits 0.                                                       |

## Lock hygiene

- The inherited `deno.lock` addition for `@netscript/queue@0.0.4` is user-owned and excluded.

## Tracked follow-up

- #1260 tracks the distinct shipped SDK prose corpus gap required by acceptance box 4.
