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
| 2026-08-30T06:49Z | 4 | Durable fitness evidence | `quality-gate` and package-scoped `doc-lint` receipts both attest `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`, exit `0`, outcome `PASS`. |
| 2026-08-30T06:50Z | 4 | Publish/cascade evidence | CLI publish dry-run, `check:mcp-export-corpus`, and `check:publish-assets` exited `0`; `check:assets-barrel` is inapplicable because no template or `kernel/assets` path is in the six-file ceiling. |
| 2026-08-30T06:50Z | 4 | Lock hygiene | Raw worktree and pinned-base comparisons both exited `0`: `deno.lock` is byte-unchanged through the final product head. |

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
| Exact-file lint | `run-deno-lint.ts` over all six ceiling paths using a scratch copy of the root lint rules without the root's `packages/cli` exclusion | PASS | Exit `0`; six selected/processed, zero findings. Receipt: `.llm/tmp/gate-receipts/plugin-doctor-registry-drift/scoped-lint.json`. |
| Exact-file format | `run-deno-fmt.ts` over all six ceiling paths using a scratch copy of the root format rules without the root's `packages/cli` exclusion | FAIL (ATTRIBUTED) | Exit `1`; six selected/processed, four findings. A pristine archive of base `13878a80a` has the same three findings in the existing generator, doctor use case, and composition root; the fourth is the accepted S2 regression test at dispatch start and was not altered to manufacture green. Evidence: `scoped-fmt.json` and `main-existing-scoped-fmt.json`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Code quality + doctrine | PASS | `.llm/tmp/gate-receipts/plugin-doctor-registry-drift/quality-gate.json` | Durable receipt attests exact git head `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`; exit `0`, outcome `PASS`. |
| JSR doc surface | PASS | `.llm/tmp/gate-receipts/plugin-doctor-registry-drift/doc-lint.json` | Durable receipt attests the same exact head; one package, three entrypoints, zero errors/private-type refs/missing JSDoc/other findings. |
| JSR package dry run | PASS | `deno publish --dry-run --allow-dirty` from `packages/cli` | Exit `0`; `Success Dry run complete`. Existing unanalyzable dynamic-import warnings remain warnings. |
| F-CLI-1..31 | PASS | quality/doctrine receipt + focused semantic suites | Command vocabulary/options are unchanged; source discovery remains manifest-driven and composition remains declarative. |

### Generated Cascade and Lock Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `check:mcp-export-corpus` | PASS (measured negative) | Exit `0`; corpus SHA-256 `88011e6e459097ba4c74111063dbef13a95823702bd37447f358bc19375cc262`, 35 packages/270 subpaths/7,614 symbols | Required by supervisor despite plan reasoning; no generated corpus drift. |
| `check:publish-assets` | PASS (measured negative) | Exit `0` | Required by supervisor despite plan reasoning; checked publish assets are current. |
| `check:assets-barrel` | N/A | six-file product ceiling | No template or `kernel/assets` path is changed, so the assets-barrel derivative has no input in this leaf. |
| `deno.lock` | PASS | raw `git diff --exit-code -- deno.lock` and `git diff --exit-code 13878a80a50c55b9662099fed64555f2310ae4a3 e5123a0e4f3d6844dbc173d5b09249a24e637fb8 -- deno.lock` | Both exit `0`; byte-unchanged. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| e2e/Aspire/Docker/browser | N/A | user boundary | Explicitly unauthorized. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `netscript plugin doctor` focused temp workspace | PASS | focused `5/5` and related `47/47` structured receipts | Missing source registration, reverse orphan, imported-but-unused, aligned, and no-target claims are covered without a live backend. |

## Handoff Notes

- Tier-A should inspect the source-file discovery contract, import-binding comparison, and exact
  healthy/error wording first.
- Final product/gate head is `e5123a0e4f3d6844dbc173d5b09249a24e637fb8`; the S4 commit contains
  evidence-only run-artifact updates.
- Scoped format remains transparently red with three base-proven existing findings and one inherited
  accepted-S2-test finding; no product or test source was reformatted outside the locked slices.
- Runtime gates remained unauthorized and were not run. No architecture debt entry was created.
- This implementation author does not provide a sign-off or IMPL-EVAL verdict.
