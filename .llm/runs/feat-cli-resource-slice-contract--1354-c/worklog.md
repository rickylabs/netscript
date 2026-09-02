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
| 2026-09-02 | C | IMPL-EVAL cycle 1 | Separate native Claude Fable 5/medium session returned `PASS` with two low findings: post-eval PR lifecycle and optional indentation hardening. |
| 2026-09-02 | C | evaluator follow-up | Replaced indentation-sensitive router entry regexes with depth-aware top-level property parsing; custom indentation now returns exact/conflict without duplicate insertion. Focused tests and scoped wrappers remain green. |
| 2026-09-02 | C | current-head IMPL-EVAL | Resumed evaluator copy `0e8fa59d…` attested `bc5120684` with `PASS`; technical finding resolved. |
| 2026-09-02 | C | final author gates | Re-ran full structured check (926/0), full CLI suite (1,569/0), arch, quality, and both docs ceilings at the attested implementation head; all exited 0. |
| 2026-09-02 | C | push/PR handoff | Pushed the branch and opened non-draft PR #1946 against `main` with all six requested labels and milestone `0.0.7` in the creation command; posted IMPL and attributed IMPL-EVAL phase comments. |

## Gate Results

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused resource-slice tests | 0 | 32 passed, 0 failed, 0 ignored across five test modules. |
| Scoped structured check | 0 | 10 selected; 0 diagnostics. |
| Scoped structured lint | 0 | 10 selected/processed; 0 findings. A task-local ignored config was needed because root config excludes `packages/cli`. |
| Scoped structured fmt | 0 | 10 selected/processed; 0 findings. Same task-local config. |
| Full structured CLI check | 0 | 926 selected in 8 batches; 0 diagnostics. |
| Full package-owned CLI tests | 0 | 1,569 passed, 0 failed, 0 ignored on the final implementation. |
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

## Evaluation

- Initial IMPL-EVAL: native Claude Fable 5/medium, session `f24053fc…`, `PASS` at `03d4c2519`.
- Follow-up: resumed independent conversation `0e8fa59d…`, `PASS` attesting `bc5120684` after
  independently re-running 32/32 focused tests and all three 10-file structured wrappers.
- The sole remaining low observation is the owner-directed post-evaluation push/PR lifecycle step.

## PR receipt

- PR: `https://github.com/rickylabs/netscript/pull/1946`
- Creation state verified live: non-draft, base `main`, head `feat/cli-resource-slice-contract`,
  `orchestrator:features`, `status:impl`, `type:feat`, `area:cli`, `priority:p2`, `wave:v1`, milestone
  `0.0.7`.
- Body uses `Refs #1354` with no closing keyword and states that no command calls the planner.
- Phase comment ids: IMPL `5514035089`; IMPL-EVAL `5514035312`.

## Follow-up D6 remediation — 2026-09-02

The formal current-head IMPL-EVAL recorded `FAIL_FIX` for HIGH-1: the State transform's
line-oriented `[^;]+` property regex failed open for an object-literal type and a quoted key, while
also mistaking a nested member for a direct `State` property. The replacement uses the existing
brace/comment/string-aware interface walk as the single source of both the closing anchor and
top-level member boundaries. Direct bare or quoted same-name members are now classified by their
complete type text: one required non-optional type is `exact`; every other declaration is a
`conflict`. A same-name property nested below another member remains eligible for insertion.

LOW-1 rode along within the approved ten files: the planner and reconciler now use an explicit
`<`/`>` path comparator instead of ICU-backed `localeCompare`. A punctuation fixture pins the same
code-point order for both the report and apply plan.

### Red/green evidence

| Check | Exit | Evidence |
| --- | ---: | --- |
| Pre-change focused baseline | 0 | 32 passed, 0 failed, 0 ignored at the receipt-only head. |
| Three new State fixtures against the old scanner | 1 | 5 passed, 3 failed: object-literal and quoted members returned `insert`; the nested member returned `conflict`. |
| ICU-order fixture against `localeCompare` | 1 | 11 passed, 1 failed: `_b.tsx` preceded `(_components)/a.tsx`. |
| Final focused resource-slice suite | 0 | 36 passed, 0 failed, 0 ignored across all five test modules. |
| Scoped structured CLI check | 0 | 926 selected in 8 batches; 0 failed batches and 0 diagnostics. |
| `deno task arch:check` | 0 | CLI summary remains `FAIL=0 WARN=59 INFO=1`; no new failure. |
| Targeted formatting diagnostic | 0 | Five changed product/test files checked with the recorded task-local format config. |

Touch-set review: five of the ten approved product/test files changed; no product file outside
`packages/cli/src/kernel/application/resource-slice/` and no `deno.lock` change was needed.
