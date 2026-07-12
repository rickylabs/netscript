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

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan-Gate | PASS | `plan-eval.md` | implementation unblocked |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| browser/runtime | N/A | typing-only slice | reconsider if behavior changes |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| named packages | NOT_RUN | pending implementation | scoped checks/tests planned |

## Handoff Notes

- PLAN-EVAL should challenge every claimed guard and the Fresh summary public-type correction.
- Prior attempt allowance count: 6. Final allowance count: pending; target 0.
