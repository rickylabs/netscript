# Worklog: properly type `packages/fresh`

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `quality-q752-fresh--codex` |
| Branch | `quality/q752-fresh-h` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- Existing `@netscript/fresh/builders`, `/route`, `/form`, `/query`, and `/streams` exports remain
  source-compatible; this slice adds no entrypoint.

### Domain Vocabulary

- Schema input/output — distinct raw and parsed values carried by a schema generic.
- Bound route — route pattern plus path/search schema outputs and navigation helpers.
- Island query — package-owned narrowed options and structurally honest upstream result.
- Stream definition/schema — collection-key relationship retained through factory creation.
- Field error key — a runtime key proven to belong to the form-value key set before assignment.

### Ports

- Existing `NetScriptStreamDBFactory<TDef>` remains the test/adapter seam; no new port is planned.
- Upstream Preact Query hooks remain direct dependencies; package-owned types are the public façade.

### Constants

- None required: the slice introduces no finite runtime vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Type route and builder contracts end-to-end, including link props and compatibility façades. | focused tests + scanner delta + scoped check | `src/application/{builders,route}/**`, related tests/types |
| 2 | Type form error writes and Zod narrowing from runtime evidence. | form tests + scanner delta + scoped check | `src/application/form/**`, related tests |
| 3 | Type TanStack query wrappers with upstream-derived generics or explicit structural adapters. | query tests + scanner delta + scoped check | `src/application/query/**`, related tests |
| 4 | Type StreamDB factory generics and run the complete acceptance gate set. | streams tests + full gates | `src/runtime/streams/**`, run artifacts |

### Deferred Scope

- Broader Archetype-4 restructure and legacy PageBuilder compatibility debt remain separately owned.
- Visual/browser checks are deferred because no rendered behavior is changed.

### Contributor Path

Start at the relevant public subpath, follow its exported generic into the implementation factory,
and add a focused inference/runtime case beside that feature before extending a façade.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-12 | preflight | reset/research | HEAD `3b3d615b`; baseline 25 findings / 0 allowances; rejected pass 25 allowances. |
| 2026-07-12 | plan-gate | PLAN-EVAL | Separate Claude Opus/high session `7197d457-c50d-48fe-ad43-b84ade676b0e` returned PASS. |
| 2026-07-12 | slice 1 | route/builders | Unified compatibility aliases with implementation types, propagated route factory generics, explicitly built link props, and narrowed complete route references. Scoped check passed; route/builder tests passed in the 197-test package run. Reconcile: no GitHub mutation per owner directive. |
| 2026-07-12 | slice 2 | form/Zod | Used a mutable string-keyed internal error map and Zod class/property guards (`unwrap`, `_zod.def.items`) instead of mapped writes and double assertions. Form/schema tests passed in the 197-test package run. Reconcile: no GitHub mutation per owner directive. |
| 2026-07-12 | slice 3 | query | Bound all five hooks to upstream generic parameters, modeled infinite `{ pages, pageParams }` data, required upstream pagination callbacks, and adapted synchronous mutations to the async upstream function. Query tests passed in the 197-test package run. Reconcile: no GitHub mutation per owner directive. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Target zero allowances | Owner rejected suppression as strategy. | owner directive / plan D6 |
| Retain one inline-contract allowance | Optional inline schemas preserve prior builder output types, while the bound-route generic maps omission to `EmptyRecord`; a direct attempt and presence-constrained generics could not equate those states without redesigning legacy overloads. | `route-support.ts`; compiler evidence |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| PR trail omitted by explicit owner directive | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| baseline scanner | scoped scanner | FAIL (expected) | 25 findings, 0 allowances |
| baseline doc-lint | structured full-export runner | PASS | 14 entrypoints, 0 diagnostics |
| baseline publish dry-run | package-local Deno publish | PASS | no slow-type error |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Plan-Gate | PASS | `plan-eval.md` | Separate opposite-family review completed before source edits. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package tests | NOT_RUN | pending implementation | full package suite required |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh subpath consumers | NOT_RUN | pending implementation | scoped check + tests |

## Handoff Notes

- PLAN-EVAL should verify the zero-allowance default, four ordered slices, JSR risks, and explicit
  no-PR owner override before permitting implementation.
