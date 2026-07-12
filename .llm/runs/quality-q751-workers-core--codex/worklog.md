# Worklog: `packages/plugin-workers-core` type-quality elimination

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q751-workers-core--codex` |
| Branch | `quality/q751-workers-core-h` |
| Archetype | `3 — Runtime / Behavior` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing root, builders, config, contracts/v1, runtime, streams, and testing exports are preserved; no export-map key is added or removed.
- Schema constants expose their concrete schema type plus derived input/output types rather than a cast facade.
- Builder entry functions retain `defineJob`, `defineTask`, and `defineWorkflow`; ready-state values expose a sound `build()` path.

### Domain Vocabulary

- `z.input<typeof Schema>` / `z.output<typeof Schema>` — authoring input versus parsed/defaulted output.
- `JobBuilderState`, `TaskBuilderState`, `WorkflowBuilderState` — compile-time lifecycle states; runtime state remains copied explicitly between immutable transitions.
- Canonical domain `JobDefinition`, `TaskDefinition`, `WorkflowDefinition`, handlers, and branded ids — one source for builder output.
- `WorkersStreamDefinition` and upstream `StateSchema` / `DurableStreamProducer` — collection-to-entity mapping.
- Existing worker runtime lifecycle remains `created → started → stopped`; supervisor/shutdown boundary and delivery behavior are unchanged.

### Ports

- Existing `JobStoragePort` and `WorkerPort` become the canonical composition contracts where shapes match.
- Existing task executor, workflow executor, scheduler, and shutdown contracts remain narrow; concrete defaults gain typed identity/capability alignment rather than post-hoc casting.
- Clock, cancellation, delivery guarantee, concurrency, and diagnostics behavior are unchanged by this type-only slice.

### Constants

- Existing builder state unions, stream entity keys (`execution`, `job`), runtime ids, and domain constants remain the finite vocabulary; no new free string protocol is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Schema/contract/stream boundaries derive real input/output and upstream generic types, proving the largest cast family can be removed without widening. | scanner + scoped check + relevant schema/contract/stream tests | `src/config/*.ts`, `src/contracts/v1/*`, `src/streams/*`, focused tests, run artifacts |
| 2 | Builder typestate transitions create correctly parameterized values over canonical domain types, proving no builder rebranding is needed. | scanner + scoped check + builder tests | `src/builders/*`, `src/public/root.ts`, focused tests, run artifacts |
| 3 | Runtime composition and fixtures satisfy canonical ports directly, then the full package gate set proves integration. | scanner + scoped check/lint/fmt + package tests + publish/doc/arch gates | `src/runtime/*`, concrete runtime collaborators as required, `src/testing/*`, run artifacts |

### Deferred Scope

- Runtime behavior, export redesign, and the pre-existing oRPC private-type doc debt remain outside #751.

### Contributor Path

Start at the exported schema/builder/runtime type, follow its concrete generic to the implementation, and add new behavior by extending the canonical domain or port type first; never introduce a second structural facade solely to make an assignment compile.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | preflight | reset/re-baseline | HEAD `3b3d615b`; clean branch; baseline 50 findings / 0 allowances; rejected attempt 14 allowances. |
| 2026-07-12 | plan | design | Archetype 3 plan locked; awaiting separate-session PLAN-EVAL. |
| 2026-07-12 | plan-eval | PASS | Opus session `26bd7bb6-ce5a-4cc6-ab9c-af98aca3ef27` confirmed all Plan-Gate items. |
| 2026-07-12 | slice 1 | implementation | Config/contract/stream casts replaced by typed Zod outputs, runtime Standard-Schema narrowing, upstream stream generics, and a correlated producer wrapper. Scanner reduced 50 → 27 with allowCount 0. |
| 2026-07-12 | slice 1 | review | Independent Opus review `c2028493-5a2e-49a2-9988-7c1fa04c1376`: initial `FAIL_FIX` only for fmt; scoped formatter remediated 5 files; same review updated to `PASS`. |
| 2026-07-12 | slice 1 | reconcile | No PR/issue sweep by owner directive; scope remains unchanged, no new debt, no lock churn, and remaining 27 findings map only to locked slices 2–3. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Target 0 allowances | Suppression was explicitly rejected; 5 is only a ceiling. | owner directive / plan D1 |
| Keep behavior and export map stable | Findings are boundary-type erasures, not a feature request. | research / doctrine A1-A2 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Owner prohibits the harness’s normal PR/comment trail. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline scanner | scoped quality scanner | FAIL (expected baseline) | 50 findings, 0 allowances |
| Baseline publish | package dry-run | PASS | 0 slow-type errors |
| Baseline doc lint | root structured wrapper | FAIL (pre-existing) | 4 private-type refs, 0 missing JSDoc |
| Slice 1 scanner | scoped scanner | PASS | 0 findings in Slice 1 files; overall 27 findings / 0 allowances remain. |
| Slice 1 check | scoped wrapper, reviewer rerun | PASS | 110 files, 0 errors. |
| Slice 1 lint | scoped wrapper, reviewer rerun | PASS | 0 findings; no lint ignore. |
| Slice 1 fmt | scoped wrapper | PASS after fix | Initial review caught 5 mechanical findings; write + check returned 0. |
| Slice 1 tests | contracts + streams | PASS | 7 passed, 0 failed. |
| Slice 1 publish | package dry-run | PASS | Reviewer confirmed no slow types. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-19 | NOT_RUN | planned | Run after implementation. |
| Slice review gate | PASS | `slice-1-review.md` | Substantive opposite-family review; fmt remediation verified. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Package runtime tests | NOT_RUN | planned | Type-only change still runs full package tests. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Export-map consumers | NOT_RUN | planned | Run focused checks if compiler identifies impact. |

## Handoff Notes

- PLAN-EVAL should challenge D2–D5, verify all 50 findings have an owned slice, and reject any plan that treats allowances as an implementation technique.
