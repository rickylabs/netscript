# Worklog: G4 #452 desktop Aspire generator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g4-452-generator` |
| Branch | `feat/desktop-frontend-452-generator` |
| Archetype | `6 — CLI / Tooling` (folded Archetype 2 contract concern) |
| Scope overlays | `none` |

## Design

### Public Surface

- `@netscript/aspire/config` — `AppType` adds `'desktop'`; `AppEntry` adds optional
  `PackageTaskName`; `AppEntrySchema` applies the conditional enablement default.
- `@netscript/aspire/types` — existing aliases expose the widened `AppType`/`AppEntry` without a
  duplicate declaration.
- `generateRegisterApps(options)` — existing internal CLI generator gains an explicit desktop
  output path; no new CLI command or exported package entrypoint.

### Domain Vocabulary

- `AppType` — closed application variant union: `app | tauri | task | desktop`.
- `AppEntry` — canonical parsed Aspire application configuration.
- `TaskName` — desktop development/predev task; default `desktop:predev`.
- `PackageTaskName` — optional stable task hook consumed by #456; downstream default convention
  `desktop:package`.
- `desktop` — a Deno Desktop window resource with internal random loopback serving, never an
  Aspire-exposed HTTP endpoint.
- `services__<name>__http__0` — server-side service/plugin discovery environment contract.

### Ports

- No new port. The generator consumes the existing Aspire builder/resource APIs through emitted
  source. `addExecutable`, `withEnvironment`, and `getResourceEndpoint` remain the concrete
  vocabulary already used by sibling blocks.

### Constants

- `AppType` finite values remain the canonical Zod enum and derived public union; no parallel
  string constant is introduced.
- Desktop finite defaults are local named constants only if reuse warrants them during S2:
  `desktop:predev`, `desktop:package`, `--backend`, `cef`.
- Existing CLI command names, exit codes, and output formats are untouched.

### Archetype-6 Structural Inventory

- Spine abstracts (existing, untouched): `CliCommand<TDefinition>`, `CliRoot<TDefinition>`,
  `UseCase<TInput,TResult>`, `Registry<TKey,TValue>`. The profile's fifth named spine,
  `CliCommandGroup`, is not present in the current tree; G4 does not create or deepen this existing
  structural deviation.
- Layer-2 abstracts introduced: none. Existing `ScaffoldCommand` and `DeployStepCommand` are
  outside the slice.
- Vertical feature catalog changed: none. This work remains under the existing horizontal kernel
  template adapter path.
- Extension axes changed: none. Existing registries and `kernel/extension-points.ts` are untouched.
- Ports changed: none (command execution, filesystem, process, HTTP probing, templates, prompts,
  output rendering all unchanged).
- Composition declarativity: public/maintainer composition and top-level command lists untouched.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S1 | Prove the public desktop config contract, conditional opt-in default, and #456 package-task hook. | Aspire config/type tests; CLI consumer compile; scoped wrappers; doc-lint; JSR audit; publish dry-run; `quality:scan`; `arch:check`. | `packages/aspire/config.ts`; `packages/aspire/types.ts` only if docs require; `packages/aspire/tests/config_test.ts`; `packages/aspire/tests/types_test.ts`; `packages/cli/.../tests/generators-test-support.ts`; run artifacts. |
| S2 | Prove generated desktop launch/build-order/CEF/discovery/no-endpoint semantics without changing non-desktop output. | Focused generator tests; scoped wrappers; `quality:scan`; `arch:check`; JSR/consumer gates re-run because S2 consumes the public surface. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`; `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts`; run artifacts. |
| S3 | Prove merge-readiness of Aspire helper generation and record the complete handoff. | `deno task e2e:cli`; one-pass `scaffold.runtime`; final JSR rubric/consumer compile/quality gates; supervisor-owned review follows. | Run artifacts and PR evidence only; no production source unless a gate exposes an in-scope defect. |

### Deferred Scope

- #456 native-format pipeline invokes `PackageTaskName` and owns targets/formats/compression/output.
- #841 owns auto-update API wrapping; #457 owns native installation/update evidence.
- #834/#825 own later graph/snapshot packaging.
- No release or published-graph execution occurs in this run.

### Contributor Path

To add or adjust an app variant, start at canonical `AppType`/`AppEntrySchema` in
`packages/aspire/config.ts`, confirm the alias in `packages/aspire/types.ts`, then follow one sibling
block in `generate-register-apps.ts` and add semantic presence/absence assertions to the split app
generator suite. A new desktop packaging implementation consumes `PackageTaskName`; it does not add
native packaging logic to the dev registration block.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-17 | plan | Research | Re-baselined live #452/#375/#456, source, doctrine, JSR surface, and existing debt. |
| 2026-07-17 | plan | Design checkpoint | Locked public contract, opt-in semantics, generator behavior, three slices, and gate set. Implementation not started. |
| 2026-07-17 | plan | Review-ready handoff | Pushed `40b56f18`, opened draft PR #848 against `feat/desktop-frontend`, applied the requested taxonomy/milestone, and posted PR comment `5007823117` with `Plan & Design — READY FOR REVIEW`. |
| 2026-07-17 | S1 | Plan-Gate | Tier-A supervisor reported group verdict `PASS`; implementation hard stop cleared. |
| 2026-07-17 | S1 | Deno argv verification | Deno 2.9.3 appends arguments after the task name directly. A task-level `--` is not required; option separation is owned by the invoked command. Since `deno desktop` owns `--backend`, emit `deno task <name> --backend cef`, not `-- --backend cef`. |
| 2026-07-17 | S1 | Build-order API verification | Official Aspire 13.4 TypeScript API documents `ExecutableResource.waitForCompletion(dependency, exitCode = 0)`; S2 will make the desktop executable wait for a separate successful Fresh build resource. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Explicit fourth desktop branch | Prevent catch-all task behavior and mirror requested sibling pattern. | issue #452; generator source |
| Conditional opt-in at schema and emitted guard | Headless/CI safety cannot depend on one boundary. | #375 acceptance; `config.ts` baseline |
| `PackageTaskName` is downstream hook | Typed minimal contract for #456 without importing its pipeline. | #452 RFC amendment; #456 Option A |
| No endpoint or Vite variables | Desktop owns random loopback; needs server-side discovery only. | #375 POC |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None at Plan & Design checkpoint. | — | N/A |

## Gate Results

### S1 — public contract

| Gate | Result | Evidence |
| --- | --- | --- |
| Aspire config/type tests | PASS | `2 passed (35 steps)` |
| CLI consumer compile | PASS | `deno check --unstable-kv` on `generators-test-support.ts` |
| Scoped check/lint/fmt | PASS | Repo wrappers passed for the owned Aspire sources/tests and CLI fixture. |
| `doc:lint` | PASS | `deno task doc:lint --root packages/aspire --pretty`, zero diagnostics. |
| Publish dry-run | PASS | `deno publish --dry-run --allow-dirty` from `packages/aspire`; slow-type analysis completed without a diagnostic. |
| JSR fitness wrapper | BASELINE | Wrapper exits 1 for four untouched missing `@module` tags (`application`, `adapters`, `testing`, `public`) and misclassifies the successful publish banner as a slow-type warning; authoritative doc-lint and publish dry-run are green. |
| `quality:scan` | PASS | Exit 0, no findings; seven existing allowances reported. |
| Root `arch:check` | PASS | Exit 0. |
| Per-root doctrine scan | BASELINE | Aspire: 0 FAIL / 1 existing WARN; CLI: 46 FAIL / 42 WARN from the known broad scanner baseline, including existing test-framework/path findings. No new finding introduced by S1. |
| Lock hygiene | PASS | No `deno.lock` change. |

## Handoff Notes

- Tier-A Plan-Gate PASS is recorded in `plan-eval.md`; implementation is active.
- S1 establishes the public contract and typed CLI consumer fixture. S2 owns generated build-order,
  CEF, discovery, and no-endpoint semantics.
- Review surface: https://github.com/rickylabs/netscript/pull/848
