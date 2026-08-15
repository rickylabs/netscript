# Worklog — reference-export-drift-gate

## S1 — explicit coverage and reference reconciliation

- Authorization: PLAN-EVAL cycle 2 `PASS` at evaluator commit `45c249b9c`, evaluated over SA-2 head
  `80046696e`.
- Scope: S1 only. S2 and S3 were not started.
- Commit: the S1 commit containing this artifact; the pushed SHA is recorded in the structured PR
  comment.

### Implementation

- Replaced boolean `checkSymbols`/`excludedSymbols` state with a discriminated, reason-bearing
  `symbolCoverage` policy.
- Added fail-closed runtime policy validation, sorted exact omission groups, stale-omission checks,
  and explicit documented-non-export checks.
- Added an exported injectable `checkDrift(mapping): Promise<number>` seam and bound process status
  only under `if (import.meta.main)`.
- Restricted symbol parsing to tables whose first trimmed header cell is exactly `Symbol`; prop,
  field, shape, and category tables no longer enter the inventory. Display generic suffixes such as
  `<T>` normalize to the exported name.
- Promoted Fresh UI to complete coverage across all six entrypoints. Its policy excludes no exported
  symbols. The only allowed doc-only names are seven Dropzone copy-source contracts, grouped with
  the same reason as the page's explicit non-export label.
- Repaired the Fresh UI reference for ActionMenu, Combobox, all public interactive contracts,
  desktop chrome, registry contracts, render-UI types, DataGrid contexts, and the maintainer
  derivation/update runbook.
- Corrected exactly the four authorized Contracts `@example` import subpath lines. No runtime, type,
  export, or schema line changed.

### N1 / D11 evidence

The checker was not tuned quiet:

1. After policy/parser implementation but before reference reconciliation, the direct checker
   returned raw exit 1 with the real Fresh UI omissions plus unsorted policy groups. It reported no
   parser-generated inventions.
2. After documenting the live Fresh UI surface, the checker returned raw exit 1 for only the
   inherited Telemetry omission group's unsorted order. The group was sorted mechanically without
   changing its 154-symbol membership.
3. The final direct checker returned raw exit 0. Fresh UI measured 168 expected exports and 175
   documented inventory names: zero omissions and exactly the seven explicitly classified Dropzone
   non-exports. No exported Fresh UI symbol is omitted by policy.

### Evidence

| Proof                                               | Result                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Structured check wrapper on checker + checker test  | raw exit 0; 2 files selected, 0 findings                                                                  |
| Structured focused-test wrapper                     | raw exit 0; 6 passed, 0 failed                                                                            |
| Structured lint wrapper                             | raw exit 0; 6 TypeScript files selected, 0 findings                                                       |
| Structured format wrapper                           | raw exit 0; all 10 changed files selected, 0 findings                                                     |
| Four refusal cases                                  | empty/malformed reason, unknown mode, invented symbol, omitted symbol each asserted return code 1         |
| Direct exports/symbol drift                         | raw exit 0; eight per-package mode/reason/group reports; terminal PASS                                    |
| Fresh UI live inventory diagnostic                  | raw exit 0; expected 168, documented 175, omissions 0, inventions exactly seven classified Dropzone names |
| Docs source format                                  | raw exit 0; `Docs source format: OK`                                                                      |
| `deno task docs:accuracy`                           | raw exit 0; terminal `docs accuracy: PASS`                                                                |
| Six affected Contracts symbols on ruled entrypoints | raw exit 0 each via `deno doc --no-lock --filter`                                                         |
| Contracts JSDoc diff                                | exactly one import-subpath line in each of four authorized files                                          |
| Contracts full-export `doc:lint`                    | raw exit 1; unchanged baseline nine `private-type-ref` diagnostics, zero on `/query` and `/transform`     |
| Thirteen-path audit                                 | raw exit 0; seven approved S1 implementation paths plus three slice artifacts, no unauthorized path       |
| `fresh-browser`                                     | `NOT_RUN` — N/A / waived; no runtime lease                                                                |

No Aspire, Docker, browser, `e2e:cli`, scaffold/runtime smoke, publish, S2 task/workflow wiring, or
S3 durable gate receipt was fired.

## Handoff

S1 stops after commit, explicit-refspec push, and its structured PR comment. The coordinator owns
the required substantive slice review. S2 must not begin until that review authorizes continuation.
