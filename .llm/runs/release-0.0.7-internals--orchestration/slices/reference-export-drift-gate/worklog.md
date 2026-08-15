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

## S2 — named discoverability paths

- Authorization: coordinator S1 slice-review `PASS` at `678840603`.
- Scope: S2 only. S3 was not started.
- Commit: the S2 commit containing this amendment; the pushed SHA is recorded in the structured PR
  comment.

### Implementation

- Added `docs:exports-drift` as a directly invocable task with only `--allow-read` and
  `--allow-run=deno`. The checker does not receive environment, write, network, or broad
  `--allow-all` permission.
- Replaced the accuracy checker's hidden raw-script argv with one `deno task docs:exports-drift`
  child invocation. Existing nonzero handling remains intact: the child's stdout and stderr are
  surfaced before the aggregate throws.
- Added one explicitly named Pages build step that runs `deno task docs:exports-drift` from the
  repository root, behind `if: env.RUN == 'true'` and without `working-directory`.
- This is a discoverability repair over the pre-existing fail-closed non-draft CI enforcement chain;
  it does not claim S2 created enforcement.

### Evidence

| Proof                           | Result                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Explicit wiring search          | raw exit 0; one task definition, one aggregate call, one Pages command                                                                                             |
| Named `docs:exports-drift` task | raw exit 0 before and after the negative diagnostic; terminal PASS                                                                                                 |
| `deno task docs:accuracy`       | raw exit 0; terminal `docs accuracy: PASS`                                                                                                                         |
| Single-execution audit          | raw exit 0; maintenance reaches drift only through one accuracy call, accuracy calls the task once, and Pages calls the task once without also calling accuracy    |
| Permission audit                | raw exit 0; task text exactly matches `--allow-read --allow-run=deno` and no broader permission                                                                    |
| Pages trigger/guard/root audit  | raw exit 0; pre-`jobs` workflow prefix byte-identical to S1 HEAD, guard present, no working directory                                                              |
| Pages workflow structural test  | raw exit 0; 1 passed, 0 failed                                                                                                                                     |
| CI classifier/workflow test     | raw exit 0; 60 passed, 0 failed                                                                                                                                    |
| Docs source-format gate         | raw exit 0; `Docs source format: OK`                                                                                                                               |
| Docs source-format tests        | raw exit 0; 6 passed, 0 failed                                                                                                                                     |
| Structured check wrapper        | raw exit 0; one file selected, no findings                                                                                                                         |
| Structured format wrapper       | raw exit 0; all six changed files selected, no findings                                                                                                            |
| Controlled named-task drift     | raw child exit 1; surfaced invented and omitted ActionMenu names                                                                                                   |
| Controlled aggregate drift      | raw child exit 1; surfaced child output and threw fail-closed                                                                                                      |
| Controlled-drift restoration    | raw diagnostic exit 0; SHA-256 before/after `e822e8503636fd9f99ae816172baab0815d034f3fe745f9c58f10e9293b34db`, byte-exact, scratch removed, target diff raw exit 0 |
| Thirteen-path audit             | raw exit 0; three approved S2 implementation paths plus three slice artifacts, no unauthorized or forbidden path                                                   |
| `fresh-browser`                 | `NOT_RUN` — N/A / waived; no runtime lease                                                                                                                         |

One extra structured lint probe returned raw exit 2 because Deno excluded the `.llm` file under the
repository lint configuration; the wrapper correctly refused an empty selection instead of claiming
green. A diagnostic `deno lint --no-config` on that exact file returned raw exit 0. The first
single-execution assertion probe also returned raw exit 1 because its shell-embedded YAML quote was
stripped; the corrected character-code assertion returned raw exit 0 with every count, guard,
permission, and trigger check true. Neither diagnostic red is treated as a product verdict.

No Aspire, Docker, browser, `e2e:cli`, scaffold/runtime smoke, publish, S3 durable gate receipt,
workflow trigger, `deno.lock`, central state, or other lane was touched.

## Handoff

S2 stops after commit, explicit-refspec push, and its structured PR comment. The coordinator owns
the required substantive slice review. S3 must not begin until that review authorizes continuation.
