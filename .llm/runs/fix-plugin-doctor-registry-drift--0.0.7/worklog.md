# Worklog: plugin doctor registry/source drift

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-plugin-doctor-registry-drift--0.0.7` |
| Branch | `fix/plugin-doctor-registry-drift` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- User command remains `netscript plugin doctor --project-root <path>`; no option, command name, or
  package export changes.
- `PluginDoctorDependencies` gains an internal read-only installed-registry inspection seam.
- `GeneratedPluginRegistry` gains internal `sourceFiles` evidence for each manifest registry target.

### Domain Vocabulary

- `GeneratedPluginRegistry.sourceFiles` — normalized project-relative definition files discovered
  by the authoritative generator manifest.
- `RuntimeRegistryDriftCheck` — one exact comparison result with `healthy`/`error` status.
- `RuntimeRegistryImport` — a project-relative generated-registry import and its local binding.

### Ports

- Existing `FileSystemPort` — reads registry modules and source-tree existence through the package's
  established seam.
- `inspectRuntimeRegistries(projectRoot)` — injected read-only dry-run of the existing installed
  registry generator; no new external-system port.

### Constants

- Stable check prefix: `runtime-registry`.
- Remediation: `netscript generate plugins`.
- Status vocabulary remains `healthy | warning | error`.

### Archetype-6 Existing Structure (unchanged)

- Spine abstracts: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; this slice introduces none.
- Layer-2 abstracts: none introduced or changed.
- Vertical features touched: `public/features/plugins/doctor` and
  `public/features/generate/plugins`; command definitions remain in their owners.
- Extension axes: installed runtime manifests map source-directory policies to registry targets;
  the existing generator consumes this axis. No new registry class or key union.
- Composition declarativity: `public/features/root/public-command-dependencies.ts` wires the same
  generator closure into both generate and doctor flows; it contains no check body.
- Existing ports relevant to the feature: filesystem and process. HTTP manifest lookup remains in
  the generator adapter closure.
- Permission impact: none beyond existing doctor/generator read/network permissions.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bootstrap plan/design and draft review surface | manual Plan-Gate; PLAN-EVAL N/A | run artifacts |
| 2 | Red-before regression | focused structured test exits non-zero for the expected assertion failure | new regression test + run artifacts |
| 3 | Bidirectional manifest-backed drift check | focused and related structured tests | six ceiling paths + run artifacts |
| 4 | Quality evidence and handoff | scoped wrappers, quality receipt, JSR gates | run artifacts |

### Deferred Scope

- Stream topology without a runtime-registry manifest — no generated registry contract exists on
  current main.
- Recursive directory discovery and arbitrary handwritten registry grammars — preserve generator
  manifest semantics.
- #1366, #1574, #1365, and all live-runtime gates.

### Contributor Path

To add a new registry-backed definition kind, declare its source directories/suffixes/exclusions
and registry path in the plugin's `scaffold.runtime.json`; the generator and doctor comparison then
consume the same declaration without a CLI plugin-name switch. To extend doctor wording, edit the
focused `runtime-registry-drift.ts` policy and its semantic tests.

## PLAN-EVAL

`N/A` — issue #1673 and current-tree research provide a bounded internal contract, explicit negative
regression, locked path ceiling, reverse case, and complete gate set. No architecture or sequencing
decision remains open that would benefit from a separate planning evaluator. IMPL-EVAL remains
mandatory in a fresh opposite-family session.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-29T23:29Z | 1 | Research/plan | Re-baselined issue #1673 at `origin/main` `13878a80a`; selected A6 and locked six product/test paths. |
| 2026-08-29T23:32Z | 1 | Issue evidence contract | Preserved the five target-contract statements and converted them to `## Acceptance` checkboxes; no labels, milestone, or state changed. |
| 2026-08-29T23:35Z | 2 | Regression authored | Generated a real saga registry with `registered-saga.ts`, then authored `sagas/late-saga.ts` without regeneration and invoked the real doctor command. No product source had changed. |
| 2026-08-29T23:35Z | 2 | Red-before | Structured wrapper exited `1`: `passed=0 failed=1`; sole failure was `AssertionError: Expected function to reject.` Doctor incorrectly exited zero, exactly reproducing #1673. |
| 2026-08-30T08:35Z | 3 | Manifest discovery evidence | Extended the installed-runtime generator's dry-run result with normalized per-target `sourceFiles`, preserving manifests as the only discovery authority and preserving the non-dry command result shape. |
| 2026-08-30T08:36Z | 3 | Bidirectional comparison | Added focused registry import/binding comparison, reverse-orphan detection, imported-but-unused rejection, exact healthy evidence, and the bounded no-target statement. |
| 2026-08-30T08:37Z | 3 | Production wiring | Kept doctor discovery optional for legacy seams and supplied the existing generator closure unconditionally from `public-command-dependencies.ts`. |
| 2026-08-30T08:45Z | 3 | Green regression | Focused structured test exited `0`: `passed=5 failed=0`; exact six-file structured check exited `0`; related structured suite exited `0`: `passed=47 failed=0`. |
| 2026-08-30T08:47Z | 3 | Reconcile | PR #1739 remains draft with `Closes #1673`; issue #1673 remains open and unchanged; no new reviewer/evaluator comment or scope adjustment. S2/S3 body progress and the S3 phase comment will be updated after the explicit-refspec push. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reuse manifest-backed generator discovery | It is the source tree contract that produced the registry. | research D1 / A6 / AP-9 |
| Keep stream registry creation out of scope | No such generated contract exists on current main; doctor must state evidence limits. | research re-baseline |
| PLAN-EVAL N/A | Small bounded defect with no material open planning decision. | harness run-loop §4 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Current streams plugin has no runtime registry manifest despite issue's generic stream wording. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Red-before regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --pretty -- --allow-all packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts` | EXPECTED_FAIL | Exit `1`; `passed=0 failed=1`; `AssertionError: Expected function to reject.` This is the required baseline defect evidence, not a product-gate failure. |
| Focused green regression | same structured wrapper and test path | PASS | Exit `0`; `passed=5 failed=0`; covers late source, reverse orphan, imported-but-unused binding, aligned evidence, and no-target wording. |
| Related doctor/generator tests | structured wrapper over the five locked test paths | PASS | Exit `0`; `passed=47 failed=0`. |
| Exact-file type check | `run-deno-check.ts` over all six ceiling paths | PASS | Exit `0`; six files selected; zero diagnostics. |
| Final-head lint/fmt | structured wrappers | NOT_RUN | S4 runs and records the final-head receipts. Root config intentionally excludes `packages/cli`; S4 uses a scratch config carrying the same rules without that exclusion. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1/F-3/F-5/F-6/F-7/F-8/F-9/F-10/F-11/F-12/F-15..F-19 | NOT_RUN | selected gate list in `plan.md` | No public/asset surface change planned. |
| F-CLI-1..31 | NOT_RUN | quality/doctrine gate + manual structural review | No command vocabulary or presentation shape change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| e2e/Aspire/Docker/browser | N/A | user boundary | Explicitly unauthorized. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `netscript plugin doctor` focused temp workspace | RED_BASELINE | structured wrapper output recorded above | Doctor succeeded after `sagas/late-saga.ts` was added without regeneration. No live backend used. |

## Handoff Notes

- Tier-A should inspect the source-file discovery contract, import-binding comparison, and exact
  healthy/error wording first.
- This implementation author does not provide a sign-off or IMPL-EVAL verdict.
