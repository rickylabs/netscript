# Worklog: #754 deeper type-erasure elimination tail

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q754-tail--codex` |
| Branch | `quality/q754-tail-h` |
| Archetype | 1, 2, 4, and 6 by package |
| Scope overlays | frontend for fresh-ui |

## Design

### Public Surface

- Preserve all export-map entrypoints and runtime behavior.
- `PrimitiveNode` becomes the truthful Preact VNode type.
- Accordion trigger props describe the intrinsic summary element actually rendered.
- Telemetry's exported compatibility types derive from public oRPC handler types.

### Domain Vocabulary

- `SdkModuleRecord` and module-specific guards — validated computed dynamic imports.
- `OrpcContractRouter` guard — narrows SDK's structural contract at the adapter boundary.
- `ContractErrorDefinition` / standard-schema guard — converts shared unknown schema fields into a
  valid oRPC error-map item.
- `PlatformStyle` — string-or-object style accepted by Preact.

### Ports

- No new ports. Existing SDK client link and telemetry SDK loader are the real external seams.

### Constants

- No new finite domain vocabulary is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove telemetry dynamic/oRPC boundaries without `any` or ignores; remove lexical false positives. | telemetry check/test + seven-root scanner | telemetry sources/tests; three comment sites; run artifacts |
| 2 | Prove SDK and Fresh UI boundaries with router, VNode, style, summary, and event types. | sdk/fresh-ui check/test + scanner | SDK/Fresh UI sources/tests; run artifacts |
| 3 | Prove both plugin error vocabularies enter oRPC through validated schemas. | both plugin-core check/test + scanner | both contract files/tests; run artifacts |
| 4 | Record complete package gates and independent IMPL-EVAL. | all acceptance commands | run artifacts only |

### Deferred Scope

- Historical architecture/doc debt and visual/browser behavior are unchanged; no visual output is
  modified, so browser screenshot validation is N/A unless tests expose behavioral drift.

### Contributor Path

Start at the scanner finding, follow the package-owned public type to its upstream declaration, add
a local guard only at an actual unknown boundary, and prove it with the closest package test before
running the scoped wrapper and publish gates.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | plan | baseline | Hard reset confirmed; baseline 16 findings / 0 allowances; rejected pass 6 allowances. |
| 2026-07-12 | plan-eval | verdict | Independent Claude session `session_01WMKgGNRNc4UG9E7bjDryF1` returned PASS. |
| 2026-07-12 | slice 1 | implementation | Telemetry dynamic modules use structural guards; oRPC callbacks use exact package-owned shapes; three prose hits removed. |
| 2026-07-12 | slice 1 | gates | Scanner 16→6 / allowCount 0; telemetry package + scoped checks/lint/fmt green; 51 tests pass; publish green; doctrine FAIL=0. |
| 2026-07-12 | slice 1 | review | Claude Opus correction review `ba454352-eec5-46ef-a5cb-9d9eb14d3c5e` PASS on final diff. |
| 2026-07-12 | slice 1 | reconcile | No PR by owner override; no new issue/comment input; plan unchanged; lock churn removed before sign-off. |
| 2026-07-12 | slice 2 | implementation | SDK recursively validates real oRPC router leaves; Fresh UI uses package-owned VNode structure, truthful string/object styles, and `summary` element props/events. |
| 2026-07-12 | slice 2 | fail-fix | First Claude Opus review found a Fresh public doc-lint regression and missing guard/accordion tests. The new SDK test then exposed and closed vacuous empty-router / reserved-`~orpc` acceptance. |
| 2026-07-12 | slice 2 | gates | Scanner 6→2 / allowCount 0; SDK 16 tests and Fresh UI 134 tests pass; scoped check/lint/fmt green; curated Fresh doc entrypoints return to 0. |
| 2026-07-12 | slice 2 | review | Claude Opus session `99d47bf8-00fd-464e-89b3-13d7b90ff04d` correction pass returned PASS; generated root/package lock churn removed before sign-off. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Target zero allowances | allowances are last resort, not a completion strategy | owner directive |
| Use runtime guards for unknown external values | establishes structural evidence before use | A1/A2 and upstream declarations |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Remote target branch absent before final push | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| baseline scanner | exact seven-root command | FAIL (expected) | 16 findings, allowCount 0 |
| slice 1 scanner | exact seven-root command | PASS for owned sites | 6 residual findings, allowCount 0; all residual sites are slices 2/3 |
| telemetry check | package task + scoped wrapper | PASS | 0 diagnostics |
| telemetry lint/fmt | scoped wrappers | PASS | 0 findings |
| telemetry tests | `deno task test` | PASS | 51 passed / 0 failed |
| telemetry publish | `deno publish --dry-run --allow-dirty` | PASS | no slow types; intentional computed-import warning only |
| slice 2 scanner | exact seven-root command | PASS for owned sites | 2 residual findings, both plugin-core slice 3; allowCount 0 |
| SDK check/lint/fmt | scoped wrappers | PASS | 0 diagnostics/findings |
| Fresh UI check/lint/fmt | scoped wrappers | PASS | 0 diagnostics/findings |
| SDK tests | `deno task test` | PASS | 16 passed / 0 failed, including valid/rejected router guard paths |
| Fresh UI tests | `deno task test` | PASS | 134 passed / 0 failed, including summary/disabled SSR regression |
| SDK doc lint | `deno task doc:lint --root packages/sdk --pretty` | RECORDED | primary entrypoint clean; one combined pre-existing downstream private reference |
| Fresh UI doc lint | `deno task doc:lint --root packages/fresh-ui --pretty` | RECORDED | `mod.ts` and `primitives.tsx` clean; 123 pre-existing interactive diagnostics |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | PASS | `plan-eval.md` | implementation unblocked |
| slice 1 doctrine | PASS | `check-doctrine.ts --root packages/telemetry` | FAIL=0; warnings pre-existing |
| slice 2 review | PASS | `slice-review-2.md` | first FAIL_FIX corrected and independently re-reviewed |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| browser/runtime | N/A | typing-only slice | reconsider if behavior changes |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| SDK + Fresh UI | PASS | scoped wrappers and package tests | typed adapter/public-surface consumers proven |

## Handoff Notes

- PLAN-EVAL should challenge every claimed guard and the Fresh summary public-type correction.
- Prior attempt allowance count: 6. Final allowance count: pending; target 0.
