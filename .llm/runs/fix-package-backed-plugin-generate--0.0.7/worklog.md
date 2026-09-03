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
| 1 | Reproduce published behavior and lock deterministic RED | executable `--mode red` assertion + raw receipt | run dir |
| 2 | Prove the fixture-only repair and complete doctor behavior | executable `--mode green` + complete fixture | CLI e2e fixture + run dir |
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
| 2026-09-03 01:08Z | 1 | executable RED | At `2fa5f60eb359ffdc5484728ef9845d8594e734b8`, `deno run -A .llm/runs/fix-package-backed-plugin-generate--0.0.7/reproduce-canary8.ts --mode red` exercised the exact published Canary-8 CLI from repo and project cwd. Both nested commands exited 1 on the minimum-dependency-date rejection and wrote no generated tree. Raw receipt: `receipts/red-canary8.txt`. |
| 2026-09-03 01:08Z | 2 | executable GREEN | At the same product head, `deno run -A .llm/runs/fix-package-backed-plugin-generate--0.0.7/reproduce-canary8.ts --mode green` exercised both cwd values. Both commands exited 0; each tree contains `.netscript/generated/plugin-workers/job-registry.ts`, whose raw contents include `package-backed-job`. Raw receipt: `receipts/green-canary8.txt`. |
| 2026-09-03 01:08Z | 2 | complete fixture | The exact published `package-backed-plugin-doctor-fixture.ts` command exited 0 with `PACKAGE_BACKED_PLUGIN_DOCTOR_PASS`; raw command/output/tree/semantic matches are in `receipts/doctor-fixture-canary8.txt`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL N/A | Canonical issue and brief already bind the small repair's contract, ceiling, RED, and gates. | `run-loop.md` §4; issue #1966 |
| Keep workers and CLI product code unchanged | Executable RED/GREEN proves the dedicated fixture config is the only repair boundary. | Supervisor correction; receipts |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Baseline root config excludes `packages/cli/`, so the exact scoped lint/fmt wrappers refuse incomplete coverage. | significant | yes |
| Initial product-defect hypothesis was replaced by the proven fixture dependency-age cause. | significant | yes |

## Reproduction Evidence

All commands below ran at product head `2fa5f60eb359ffdc5484728ef9845d8594e734b8`.

| Mode | Exact harness command | Repo cwd result | Project cwd result | Durable raw receipt |
| --- | --- | --- | --- | --- |
| RED | `deno run -A .llm/runs/fix-package-backed-plugin-generate--0.0.7/reproduce-canary8.ts --mode red` | Published nested command exit 1; minimum-dependency-date rejection; `.netscript/generated` missing. | Published nested command exit 1; same rejection; `.netscript/generated` missing. | `receipts/red-canary8.txt` |
| GREEN | `deno run -A .llm/runs/fix-package-backed-plugin-generate--0.0.7/reproduce-canary8.ts --mode green` | Exit 0; workers registry written with `package-backed-job`. | Exit 0; workers registry written with `package-backed-job`. | `receipts/green-canary8.txt` |
| Complete fixture | `deno run -A packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts --project-root /tmp/netscript-1966-doctor-receipt-2fa5f60e/project --repo-root /home/agent/projects/netscript/worktrees/007-leaf-1966 --cli-entrypoint jsr:@netscript/cli@0.0.7-canary.8 --package-version 0.0.7-canary.8` | Exit 0; `PACKAGE_BACKED_PLUGIN_DOCTOR_PASS`. | Fixture intentionally invokes the CLI from repo cwd, matching CI. | `receipts/doctor-fixture-canary8.txt` |

Each mode records the exact nested `deno run -A --minimum-dependency-age=0
jsr:@netscript/cli@0.0.7-canary.8 generate plugins --project-root <root>` command, invoking cwd,
timestamp, git head, exit code, full stdout/stderr, generated tree, and registry contents when present.

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
| Published two-cwd RED/GREEN reproduction | PASS | `receipts/red-canary8.txt`; `receipts/green-canary8.txt` | Executable mode assertions cover both repo and project cwd at `2fa5f60eb359ffdc5484728ef9845d8594e734b8`. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Package-backed workers registry | PASS | `receipts/green-canary8.txt` | Both cwd variants write the declared registry and its raw contents include `package-backed-job`. |
| Complete package-backed doctor fixture | PASS | `receipts/doctor-fixture-canary8.txt` | Exact Canary-8 fixture exits 0 with `PACKAGE_BACKED_PLUGIN_DOCTOR_PASS`. |

## Handoff Notes

- Implementation and executable evidence are complete; the run is awaiting merge coordination.
- Review the immutable receipt trio for the two-cwd RED/GREEN boundary and complete fixture proof.
- Product code, plugin code, root config, and `deno.lock` are unchanged by this harness repair.
