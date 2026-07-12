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
| 2026-07-12 | slice 2 | implementation | Replaced builder self-rebranding with immutable snapshots and freshly parameterized builders over canonical domain types; removed root facade casts. Scanner reduced 27 → 8 with allowCount 0. |
| 2026-07-12 | slice 2 | review | Independent Opus/high review `c73951cb-4291-4fc9-a932-954e9ce96def` found a vacuous fixed-union `build()` receiver guard (`FAIL_FIX`). Conditional receiver types tied to `TConfigured` fixed all job/task/workflow surfaces; the same reviewer reproduced initial-state rejection and updated the verdict to `PASS`. |
| 2026-07-12 | slice 2 | reconcile | Scope remains locked. The `./builders` definition aliases now expose the canonical domain shape intentionally; no in-repo consumer break, allowance, debt entry, or lock churn. Remaining 8 findings belong only to Slice 3. |
| 2026-07-12 | slice 3 | implementation | Replaced all eight runtime/fixture cast bridges with canonical structural ports, precise option types, direct fixture generics, and stable workflow/shutdown identities. Scanner reduced 8 → 0 with allowCount 0. |
| 2026-07-12 | slice 3 | review | Independent Opus/high review `d2768a42-6d10-4b9a-a702-ffb87935da6d` confirmed the typing but found Slice-3 doc-lint regression 24 → 33 (`FAIL_FIX`). Canonical alias targets were exposed and schema-derived public types made explicit/equivalent; same reviewer proved runtime/registry entrypoints 0 and combined doc debt 13, then updated to `PASS`. |
| 2026-07-12 | slice 3 | reconcile | Final target met with 0 findings / 0 allowances. No allowance requires justification. Doc-lint improves the pre-Slice-3 24 to 13 (0 missing JSDoc) and no new architecture debt is introduced. |
| 2026-07-12 | impl-eval | PASS | Fresh Opus/high session `5407040d-e2d7-4442-97df-6da4c7f7e9da` independently reran gates and returned `PASS`; only low, non-blocking stream doc-completeness and prompt-heading observations remain. |

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
| Slice 2 scanner | scoped scanner | PASS | 0 findings in builders/root; overall 8 findings / 0 allowances remain. |
| Slice 2 check | scoped wrapper | PASS | 110 files, 0 errors. |
| Slice 2 fmt | scoped wrapper | PASS | 6 selected files, 0 findings. |
| Slice 2 tests | package task | PASS | 25 passed, 0 failed. |
| Slice 2 typestate probes | independent reviewer | PASS after fix | Initial `build()` rejected on root and builders subpaths; configured `build()` accepted. |
| Final scanner | exact owner command with `--max-allow 5` | PASS | `ok:true`; 0 findings; allowCount 0; no allowances. |
| Final check | scoped wrapper | PASS | 110 files, 0 errors. |
| Final lint | scoped wrapper | PASS | 110 files, 0 findings; no lint ignore. |
| Final fmt | scoped wrapper | PASS | 110 files, 0 findings. |
| Final publish | package dry-run | PASS | No slow types; only known unanalyzable dynamic-import warning. |
| Final doc lint | root structured wrapper | RECORDED | Combined private refs: literal base 4 → pre-Slice-3 24 → final 13; runtime/registry 0; contract surface unchanged at 4; missing JSDoc 0. The remaining +9 versus literal base is stream generic doc-completeness, recorded by IMPL-EVAL as low/non-blocking. |
| Final tests | package task + co-located KV test | PASS | 25 package tests + 5 KV tests passed. |
| Architecture | `deno task arch:check` | PASS with warnings | Exit 0; package has existing size/layout warnings, no failures. |
| Lock hygiene | diff from `3b3d615b` | PASS | No `deno.lock` churn. |
| Final IMPL-EVAL | `evaluate.md` | PASS | Separate Opus/high evaluator; no high/medium findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1–F-19 | NOT_RUN | planned | Run after implementation. |
| Slice review gate | PASS | `slice-1-review.md`, `slice-2-review.md` | Substantive opposite-family reviews; both remediation loops verified. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Package runtime tests | PASS | 25 package tests + 5 co-located KV tests | No failures. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Export-map consumers | PASS | 110-file scoped check + publish dry-run | Runtime/registry/builders subpaths type-check and document without new private refs. |

## Handoff Notes

- Slice 3 owns only runtime composition and testing-fixture boundaries; the target remains zero allowances.
