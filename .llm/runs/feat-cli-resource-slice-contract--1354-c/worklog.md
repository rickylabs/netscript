# Worklog: Slice C resource contract and safe reconciler

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-contract--1354-c` |
| Branch | `feat/cli-resource-slice-contract` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | Fresh 2.x route shape semantics; no runtime/browser gate |

## Design

### Public Surface

- No package export or CLI command changes. The new symbols are internal application contracts for
  later Slice D/E consumers.
- Package spine context: `CliCommand<TDefinition>`, `CliRoot<TDefinition>`,
  `CliCommandGroup<TDefinition>` (profile vocabulary; no current class is changed),
  `UseCase<TInput, TResult>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced.
- Composition remains owned by `packages/cli/src/public/composition.ts`; this slice does not touch
  composition or a feature catalog.
- Existing extension axes remain the registries exported by `kernel/extension-points.ts`; this
  closed variant set is a resource-plan contract, not a runtime adapter registry.

### Domain Vocabulary

- `NormalizedResourceSliceInput` — validated names, static route mapping, selected client/procedure,
  and additive variants.
- `ResourceSliceVariant` / `ResourceSliceLeafRole` — finite planner vocabulary.
- `OwnedResourceSliceLeafMetadata` — schema/resource/role/options/body hash encoded in the exact
  first-line marker.
- `ResourceSlicePlan` — deterministic intended leaf descriptors and shared-source requirements.
- `ResourceSliceLeafClassification` — `absent`, `exact`, `owned`, `owned-edited`, or `unowned`.
- `ResourceSliceReconcileResult` — dry-run, ready apply plan, or failed preflight union.
- `AppRoutesReconcileResult` / `StateReconcileResult` — exact, transformed, or fail-closed result.

### Ports

- None. Slice C has no IO. Later callers supply already-read current content and already-staged
  candidates; successful reconciliation returns an immutable apply plan.
- Existing CLI ports for filesystem, templates, formatting, and output remain untouched.

### Constants

- `RESOURCE_SLICE_VARIANTS` — `core`, `form`, `partial`, `stream`.
- `RESOURCE_SLICE_LEAF_ROLES` — the eleven D7 leaf roles.
- `RESOURCE_SLICE_MARKER_PREFIX` / schema `1` — exact ownership convention.
- Shared-source result/failure phase literals — deterministic preflight reporting.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| C | Define the complete contract, planner, ownership/preflight reconciler, and two bounded shared-source transforms. | Five focused test modules; structured CLI wrappers; arch/quality/docs gates. | The ten master-plan Slice C paths. |

### Deferred Scope

- Rendering/templates and Fresh writer adapter — Slice D/B.
- CLI orchestration and application writes — Slice E.
- Init convergence/command registration — Slice F.
- Crash-atomic multi-file application, invocation locking, recovery journal, rollback, resource
  removal, and arbitrary AST migration — explicitly deferred by D3.

### Contributor Path

Start at `resource-slice-contract.ts` for finite vocabulary and normalization, add a role descriptor
to `plan-resource-slice.ts`, then pin path/option deltas in its colocated test. Shared-file support
must be a bounded fail-closed transform with a colocated fixture matrix; IO belongs in an adapter or
later command slice, never here.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 | C | bootstrap/research/design | Baseline clean; #1664 `d155db116` intersection with ten paths is empty; `PLAN-EVAL: N/A` because the master plan passed. |
| 2026-09-02 | C | contract/planner | Added normalized static-route contract, canonical ownership marker, D7 roster, query-factory bindings, and option delta tests. |
| 2026-09-02 | C | reconciliation | Added full-preflight leaf reconciliation, all D3 ownership/force/zero-write proofs, and bounded router/State transforms. |
| 2026-09-02 | C | hardening | Restricted State member detection to the interface body and made both source transforms use comment/string-aware matching-brace scans. |

## Gate Results

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused resource-slice tests | 0 | 32 passed, 0 failed, 0 ignored across five test modules. |
| Scoped structured check | 0 | 10 selected; 0 diagnostics. |
| Scoped structured lint | 0 | 10 selected/processed; 0 findings. A task-local ignored config was needed because root config excludes `packages/cli`. |
| Scoped structured fmt | 0 | 10 selected/processed; 0 findings. Same task-local config. |
| Full structured CLI check | 0 | 926 selected in 8 batches; 0 diagnostics. |
| Full package-owned CLI tests | 0 | 1,569 passed, 0 failed, 0 ignored. Final rerun follows evaluator if code moves. |
| `deno task arch:check` | 0 | CLI summary `FAIL=0 WARN=59 INFO=1`; no warning names a new Slice C file. Current directory has 10 children. |
| `deno task quality:gate` | 0 | Quality scanner `ok=true`, no findings, seven accepted existing allowances; nested arch gate green. |
| `deno task docs:readme-fences` | 0 | PASS; 7 existing type errors, matching baseline ceiling 7. |
| `deno task docs:jsdoc-examples` | 0 | PASS; `unboundName=116`, matching baseline ceiling 116. |

The locked assembled-state observation remains: adding Slice A's two and Slice D's render pair to
this directory produces 14 direct children and the expected F-16 warning above the cap of 12. It
does not fire on this disjoint C-only branch, is not a FAIL, and a fifteenth child requires rescope
or a named subfolder.

The planner's negative generated-content test scans its complete core+form+partial+stream plan for
`any`, raw `fetch(`, handwritten `queryKey: [`, and manual `JSON.parse(`. The bindings are derived
from the selected query factory; rendered template bodies remain Slice D scope.
