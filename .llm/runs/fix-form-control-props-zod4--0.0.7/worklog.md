# Worklog: #1249 form control props and Zod 4 constraints

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-form-control-props-zod4--0.0.7` |
| Branch | `fix/form-control-props-zod4` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` (consumer type contract) |

## Design

### Public Surface

- `@netscript/fresh/form` existing `ControlProps` export — narrow only `role` to the intrinsic Preact role property contract.
- `createZodAdapter(...).getConstraints()` existing behavior — add locked Zod 4 check representations without changing its signature.

### Domain Vocabulary

- `ControlProps` — framework-owned prop bag returned by field descriptors.
- `FieldConstraints` — native-control metadata derived conservatively from schema checks.
- Zod check definition — upstream internal record read through the existing guarded inspection seam.

### Ports

- None. Preact JSX types and Zod schema metadata are existing compile-time/upstream inputs, not new package-owned ports.

### Constants

- `URL_PATTERN` remains the existing stable URL presentation constraint; no new finite constant group is needed.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Harness research, locked plan, design, and evaluator handoff state | Plan checklist; `PLAN-EVAL: N/A` rationale | Run dir |
| 1R | Prove `controlProps()` cannot spread onto input/select/textarea | Scoped Fresh check exits nonzero with TS2322 | New form `_test.tsx`, run dir |
| 1G | Make the public role property intrinsic-compatible | Scoped Fresh check/test exits 0 | `prop-types.ts`, run dir |
| 2R | Prove the five-field Zod 4 constraint map is incomplete | Focused test exits nonzero with raw diff | `schema-adapter.test.ts`, run dir |
| 2G | Derive regex and inclusive numeric constraints | Focused/scoped tests exit 0 | `zod-constraints.ts`, run dir |
| 3 | Prove docs/public surface and all local gates | doc lint, JSR audit, scoped wrappers, quality gate, lock comparison | Run dir; JSDoc only if required |

### Deferred Scope

- Fresh UI narrowing helpers — separate `packages/fresh-ui` follow-up outside the ceiling.
- Docs-site form prose simplification — docs-lane follow-up.
- Exclusive numeric bounds — server-only until a faithful native representation exists.

### Contributor Path

Start at `schema-adapter/schema-adapter.test.ts` for a full expected map, extend guarded check decoding in `zod-constraints.ts`, then validate the public descriptor contract through the colocated TSX consumer test.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02T23:10Z | 0 | Re-baseline | Clean branch at `93c5fa5a5`; pinned base and lock hash verified; no existing PR. |
| 2026-09-02T23:10Z | 0 | PLAN-EVAL | `N/A`: issue #1249 and the implement brief fully specify contract, bounded scope, independent admission probes, mapping decisions, and gates; no unresolved architecture or sequencing decision remains. |
| 2026-09-02T23:12Z | 0 | Pre-push gates | Scoped check/test/lint/fmt and `quality:gate` all exited 0; 81 tests passed. Existing doctrine warnings were advisory and outside this slice. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Use Archetype 4 + frontend contract overlay | Doctrine classifies Fresh as a public DSL/builder; the consumer is Preact JSX. | Doctrine verdict and archetype profile |
| Omit exclusive native min/max | HTML bounds are inclusive; no invented off-by-one. | `plan.md` D2 |
| Separate-session evaluation only | Generator may not self-certify. | Harness/user brief |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None yet | — | — |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline lock | SHA-256 current vs `8c549c061:deno.lock` | PASS | Both `6c8f90a26375dcc0cec969f01e5bfb9e474216adb10f1cfbf68df5edab6b94d6`. |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | PASS | Exit 0; 213 files, 2 batches, 0 findings. |
| Scoped tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/tests packages/fresh/src/application/form` | PASS | Exit 0; 81 passed, 0 failed. |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | PASS | Exit 0; 213 files, 0 findings. |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | PASS | Exit 0; 213 files, 0 findings. |
| Quality gate | `deno task quality:gate` | PASS | Exit 0; quality scan 0 findings/7 registered allowances; doctrine scan has pre-existing advisory warnings only. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 4 / JSR | NOT_RUN | Planned commands in `plan.md` | Public surface inspected with `deno doc`; final gates pending. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Browser/runtime | N/A | No UI workflow or route behavior changes | Type contract and pure metadata adapter only. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Preact intrinsic elements | NOT_RUN | S1 RED/GREEN | Pending. |

## Handoff Notes

- The evaluator should inspect the independent RED outputs, exclusive-bound omission, public role derivation, full five-field map, and base lock identity first.
