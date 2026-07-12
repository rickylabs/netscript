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
| 2026-07-12 | slice 4 | streams/final gates | Narrowed the package-owned loose StreamDB schema at the upstream boundary with a structural guard, then passed the generated `StateSchema<StreamStateDefinition>` directly to `createStreamDB`. Scanner finished at 0 findings / 1 allowance. Check, lint, format, 197 tests, and publish dry-run passed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Target zero allowances | Owner rejected suppression as strategy. | owner directive / plan D6 |
| Retain one inline-contract allowance | Optional inline schemas preserve prior builder output types, while the bound-route generic maps omission to `EmptyRecord`; a direct attempt and presence-constrained generics could not equate those states without redesigning legacy overloads. | `route-support.ts`; compiler evidence |
| Treat the prior allowance count as 25 | The rejected dangling implementation contained one `quality-allow` marker for every scanner finding; base itself had 25 findings and no allowances. | rejected commit `cb538f4008c5f3a6af6f309db5408aef9f535f6e`; preflight scanner |

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
| final scanner | `scan-code-quality.ts --root packages/fresh --max-allow 6` | PASS | 0 findings; allowance count reduced from rejected-pass 25 to 1 |
| scoped check | `run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files; 0 diagnostics |
| scoped lint | `run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files; 0 findings; no new `deno-lint-ignore` |
| scoped format | `run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | 164 files; 0 findings |
| package doc-lint | `deno task doc:lint --root packages/fresh` | RECORDED (exit 0) | 14 entrypoints; 25 route private-surface/JSDoc diagnostics remain from exposing the implementation route reference; structured runner contract records rather than fails these diagnostics |
| package publish dry-run | `deno publish --dry-run --allow-dirty` | PASS | all 14 exports checked; slow-type pass; dry run complete |
| JSR audit | package audit | RECORDED (exit 1) | pre-existing missing module tags for `./ai` and `./vite`, plus runtime/AI cardinality warning; no dependency or publish failure introduced by this slice |
| lock hygiene | SHA-256 before/after | PASS | `da85900f95ea01eaa44a8bfc6f3f3aabdf7ce65806d16225fd6a2cb1901ec1f5`; unchanged |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Plan-Gate | PASS | `plan-eval.md` | Separate opposite-family review completed before source edits. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| package tests | PASS | `deno task test` | 197 passed, 0 failed |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Fresh subpath consumers | PASS | scoped check + publish dry-run | all exported entrypoints type-checked and packaged |

## Handoff Notes

- Final scanner allowance count is **1**, down from **25** in the rejected pass. The sole survivor is
  the inline builder-route conversion in `route-support.ts`: an omitted optional schema preserves
  the builder's prior path/search output, while `BoundRouteContract` maps omission to `EmptyRecord`.
  TypeScript cannot equate those conditional states without adding presence-specific overloads to
  the legacy builder surface.
- No PR or issue mutation was made, per the owner directive.
