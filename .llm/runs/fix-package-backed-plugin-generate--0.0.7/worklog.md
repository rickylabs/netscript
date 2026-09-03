# Worklog: package-backed plugin registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-package-backed-plugin-generate--0.0.7` |
| Branch | `fix/package-backed-plugin-generate` |
| Archetype | `6 — CLI / Tooling` (`5 — Plugin` consumer boundary) |
| Scope overlays | none |

## Design

### Public Surface

- Existing `netscript generate plugins --project-root <path>` command; no command name, option, export, or result contract changes.

### Domain Vocabulary

- `GenerateInstalledPluginRegistriesInput` — authoritative `projectRoot` and `dryRun` input.
- `InstalledRuntimePackage` / `ResolvedRuntimeManifest` — package-backed manifest identity and generator base.
- `GeneratedPluginRegistry` — declared registry output and registrable item count.

### Ports

- `ProjectRootResolver` — resolves the explicit/inferred root before the use case.
- `FileSystemPort` — discovers manifests/sources and verifies generated output.
- `ProcessPort` — executes a package-declared generator under the selected project config/cwd.
- `FetchRuntimeManifest` — retrieves published `scaffold.runtime.json` without coupling tests to network.

### Constants

- Existing manifest fields (`runtimeRegistryGenerator`, `runtimeRegistries`, `registryPath`) and existing workers target `.netscript/generated/plugin-workers/job-registry.ts`; no new finite vocabulary planned.

### Archetype-6 structure

- Spine abstracts are unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.
- No layer-2 abstract is introduced.
- Affected vertical feature: `src/public/features/generate/plugins/`; command presentation remains thin and delegates to the installed-runtime generator.
- Affected extension axis: installed runtime manifest → declared registry generator, populated by project `appsettings.json` and consumed by `generate plugins`/doctor inspection.
- Existing injected root, filesystem, process, HTTP, and output ports remain the only effect seams.
- Composition remains declarative in `src/public/composition.ts`; no command wiring change is planned.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Activate run record and draft review surface | artifact review | run dir |
| 1 | Reproduce published/local behavior and lock deterministic RED | focused structured test wrapper (expected failure) | CLI test + run dir |
| 2 | Repair the proven contract and establish GREEN | focused structured test wrapper + scoped local gates | CLI source/test + run dir |
| 3 | Exact-head gate/evaluator/hosted convergence | receipt sufficiency, CI, separate evaluation | run dir + PR metadata |

### Deferred Scope

- Doctor diagnostics — already truthful and explicitly excluded.
- Full local scaffold runtime — hosted lease only.
- Pre-existing CLI/workers doctrine and JSR debt — separate issues; must not deepen.

### Contributor Path

For another package-backed registry, declare its generator and targets in the plugin's `scaffold.runtime.json`; `createInstalledRuntimeRegistryGenerator` must resolve the manifest, execute it under the explicit project root, and assert the declared outputs. Extend the colocated installed-runtime generator tests with a synthetic manifest and semantic output assertion.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | 0 | bootstrap | Read issue #1966, requested skills, harness/doctrine/gates, current code path, and debt; selected PLAN-EVAL N/A. |
| 2026-09-03 | 0 | pre-push gates | At committed head `2d137cfa9`, scoped check and `quality:gate` passed. The exact scoped lint/fmt commands failed closed on baseline config exclusions; see drift. No product TypeScript changed in this slice. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL N/A | Canonical issue and brief already bind the small repair's contract, ceiling, RED, and gates. | `run-loop.md` §4; issue #1966 |
| Keep workers consumer-only initially | Host owns package-backed manifest dispatch; plugin edit requires direct causal proof. | Archetypes 5/6 and ceiling |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline root config excludes `packages/cli/`, so the exact scoped lint/fmt wrappers refuse incomplete coverage. | significant | yes |

## Reproduction Evidence

Pending exact published Canary 8 runs from both invoking cwd values and the baseline local-source comparison.

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Bootstrap cleanliness | direct `git status --short --branch` | PASS | Clean at `954126717`; only staged brief differs from baseline. |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 969 files, 9 batches, 0 failures at `2d137cfa9`. |
| Scoped lint | exact brief command | FAIL | Exit 2: selected 969, root configuration excluded the CLI surface; wrapper reported 5 failed/excluded batches and refused coverage. Baseline `79adb103b` carries the same exclusion. |
| Scoped fmt | exact brief command | FAIL | Exit 2: selected 969, processed 223, dropped the root-excluded CLI files; wrapper refused partial coverage. Baseline `79adb103b` carries the same exclusion. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plan gate | N/A | `plan.md` D4 | Small mechanical P0 with no open architecture decision. |
| Code quality / architecture | PASS | `deno task quality:gate` exit 0 | Exact bootstrap head `2d137cfa9`; no source delta yet. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Published two-cwd reproduction | NOT_RUN | pending | Run before RED. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Package-backed workers registry | NOT_RUN | pending | Exact published and focused temp-root test. |

## Handoff Notes

- Evaluator should inspect the two-cwd reproduction, causal distinction between root resolution and remote generator dispatch, and whether the regression truly excludes local-source fallback.
