# PR-D worklog

## Design

- Public surface: existing `scanCodeQuality*` APIs gain docs-fence provenance; one diff predicate is
  added for the pull-request workflow.
- Domain vocabulary: source scan units, soundness fixture, docs companion, allowance budget delta,
  and issue link.
- Ports: consume `extractFencedBlocks`; invoke `git` only at the diff predicate CLI boundary.
- Constants: the two quality task names form the finite allowance-budget surface.
- Commit slices: S1 scanner/docs contracts; S2 allowance ratchet and diff predicate; S3 typed
  triggers plus final evidence.
- Deferred scope: export reachability and live issue-state verification remain in #1378 for 0.0.7.
- Contributor path: scanner behavior and its fixtures live together under `.llm/tools/quality/`.

## Evidence

| Check                                   | Result                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Baseline `quality:scan:repo`            | exit 0, findings 0, allowCount 10                                                                 |
| Baseline `quality:scan`                 | exit 0, findings 0, allowCount 7                                                                  |
| Docs-fence red control                  | exit 1: fenced `as any` under `docs/site/**` produced no finding before implementation            |
| Scanner focused tests after integration | exit 0: 14 passed, 0 failed                                                                       |
| Quality suite after budget predicate    | exit 0: 21 passed, 0 failed                                                                       |
| Docs snippet gate                       | exit 0: PASS, scanned 578, checked 21, exempt 14, malformed 0                                     |
| Trigger executable twin check           | exit 0: `deno check --unstable-kv docs/site/reference/triggers/examples_test.ts`                  |
| Final quality + docs tests              | exit 0: 46 passed, 0 failed, 22 s                                                                 |
| Final repo scan                         | exit 0: findings 0, allowCount **10 → 8**                                                         |
| Final default scan                      | exit 0: findings 0, allowCount **7 → 7**                                                          |
| `arch:check` / `arch:check:repo`        | exit 0 in 10 s / exit 0 in 7 s                                                                    |
| Scoped check / lint / fmt               | exit 0 / exit 0 / exit 0; 28 files selected                                                       |
| Docs snippet gate                       | exit 0 in 6 s: PASS, scanned 578, checked 21, exempt 14, malformed 0                              |
| Authorized contracts fixture            | single-file scan exit 0; check exit 0; 3 tests passed                                             |
| Asset barrel idempotence                | first generator exit 0; derivative-only commit `b82d2086e`; second generator exit 0; status empty |
| Trigger + contracts companions          | combined `deno check --unstable-kv` exit 0                                                        |

## Reconcile

- Bootstrap commit `7624bc01750cd49a8f94a1aa86c492f8bbfa0405` is pushed and PR #1596 exists
  with `Closes #1549`, the required taxonomy, and milestone 0.0.6. The PR is non-draft following
  the first IMPL-EVAL; the orchestrator retains ready-state, evaluation-trigger, and merge authority.
- Live issue #1549 contains seven acceptance boxes. Evidence will use `box-index: 1..7`.
- D-1 recorded three pre-existing docs-companion findings that the widened scan exposed; the
  orchestrator authorized exactly those three, and commit
  `d876bfa93635ce924539f12ad236fc482f2d5815` resolves them with sound input narrowing and no casts
  or suppressions.
- Trigger reference and executable twin now use the exported `TriggerEventSubscriptionMessage`; the
  docs snippet gate and direct twin check both pass.
- D-2 recorded the asset-barrel freshness/boundary contradiction; the orchestrator authorized the
  mandatory derivative, and commit `f73fb369620e154f4c134cccf16423c9ae2f8f4c` contains only that
  generated file. The second
  generator run is idempotent and leaves status empty.
- Final reconcile: #1549 remains fully resolved by draft PR #1596; #1378 and #1545 remain open,
  non-closing references. No fourth widened-scan finding exists.

## IMPL-EVAL correction

- Formal IMPL-EVAL on pre-rebase head `7264ce6aac21eecade916ea4b0332f5a1912e0c3` returned
  `FAIL_FIX`: the embedded scanner imported `../docs/snippet-extractor.ts`, while the two-category
  consumer manifest embedded only support metadata and runnable tools.
- Before follow-up implementation, the branch was rebased cleanly onto current `origin/main`
  `f542f31cbea383f28dd2ea8ebc7ac99697c147a2`; the rebased pre-fix head was
  `1c0ffdfc3fd5865d820fc2c31f464a68df546a69`.
- The manifest moves from schema version 1 to version 2. This is intentionally incompatible: a v1
  reader silently ignores the new module category and can emit an executable bundle with unresolved
  imports. The generator rejects versions other than 2, while the installed-manifest smoke asserts
  version 2.
- `modules` contains source/path pairs, participates in the same embedded file map and canonical
  ordered-path hash as support files and runnable tools, and is excluded from the `tools` command
  surface. The extractor is registered at `docs/snippet-extractor.ts` without modifying or copying
  its parser.
- The closure guard derives imports from every bundled source file. RED before registration was
  exit 1 with exactly `quality/scan-code-quality.ts -> docs/snippet-extractor.ts`; after registration,
  the closure test and its synthetic omitted-module negative control pass.
- Existing `init-agent_test.ts` coverage is the C3 end-to-end proof: it installs
  `EMBEDDED_AGENT_TOOL_FILES` into a temporary project and executes `--help` for every manifest
  `tools` entry from a foreign process CWD. It was extended only to assert schema version 2 and the
  installed module path; no parallel smoke was added.
