# Plan: make `plugin install --no-samples` effective

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1017-plugin-install-no-samples--codex` |
| Branch | `fix/1017-plugin-install-no-samples` |
| Phase | `plan` |
| Target | `packages/cli`, `packages/plugin`, four official plugin adapters, CLI E2E |
| Archetype | `6 — CLI / Tooling`, with affected Archetype 5 plugin connectors |
| Scope overlays | `none` |

## Archetype

Archetype 6 is primary because the defect is in the public CLI install flow and subprocess dispatch.
The four `plugins/*` connectors are Archetype 5 surfaces and remain thin declarative wiring over the
core `@netscript/plugin/adapter` contract; no plugin-owned install algorithm is introduced.

## Current Doctrine Verdict

The historical doctrine table labels `@netscript/plugin` and `@netscript/cli` for restructuring,
with relevant accepted debt already recorded. This change does not restructure either package and
must not deepen those entries. It adds one explicit published adapter policy and keeps the CLI as a
router across the existing boundary.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The additive adapter policy is designed before implementation. |
| A2 | Undefined policy preserves existing plugin behavior; opt-in semantics are explicit. |
| A8 | Filtering remains in the install adapter; plugin files only classify resources. |
| A9 | CLI routing stays in Archetype 6 and plugin connectors stay thin Archetype 5 wiring. |
| A14 | Unit, black-box scaffold, quality, and generated-project checks prove the boundary. |

## Goal

Thread `includeSamples` across the official-plugin subprocess boundary, omit declared sample
resources when false, and keep generated structural barrel/runtime files valid and type-checkable.

## Scope

- Add `includeSamples` to `DispatchPluginScaffoldOptions` and serialized scaffold context.
- Pass the install plan value at every dispatch call site without changing sibling semantics.
- Add one optional additive `InstallStarterResource.samples` policy: omit a resource, or dispatch
  a no-samples alternate `ItemScaffolder` with its own input for a sample-dependent structural resource.
- Mark the six reported sample artifacts through the four official plugin starter declarations.
- Give all four structural barrels empty no-samples inputs; keep runtime glue structural.
- Add focused CLI/adapter tests and a CLI E2E black-box assertion for the exact six absent paths.

## Non-Scope

- Parser, kernel scaffolder, plugin add/resource commands, update/remove behavior, dependencies,
  manifests, or unrelated generated output.
- Refactoring existing CLI/plugin doctrine debt.

## Hidden Scope

- Empty generated barrels must contain valid module source and must not re-export suppressed files.
- Existing dispatch callers must state their current samples intent explicitly.
- The black-box lane must exercise all four official plugin subprocess scaffolders.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Serialize `includeSamples` as a boolean in scaffold `context.options`. | It is the existing cross-process option channel and avoids parser/kernel changes. |
| D2 | Publish `InstallStarterSamplesPolicy<TAlternateInput>` and add optional `InstallStarterResource.samples`: `{ kind: 'omit' }` suppresses a sample; `{ kind: 'alternate', scaffolder, input }` invokes a distinct no-samples `ItemScaffolder` with its own input. | The alternate scaffolder owns an empty-barrel artifact source, so it is expressible independently of the fixed sample barrel stub. Undefined remains emit-all. |
| D3 | Keep each existing structural barrel and runtime-glue artifact under no-samples; streams has no runtime glue and gains none. Each of the four barrels selects its own empty alternate scaffolder through D2. | Empty barrel scaffolders emit valid `export {};` modules without substituting the fixed sample-export stubs, so the outcome is reachable and type-checks without dangling exports. |
| D4 | Put filtering/fallback selection in `collectInstallArtifacts(plugin, options)`. | The core adapter owns install semantics; connectors only classify resources. |
| D5 | Add a dedicated E2E no-samples assertion gate/suite pattern under `packages/cli/e2e`, asserting the six exact paths. | This is the required black-box command boundary evidence. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact optional policy name | must resolve now — resolved | `InstallStarterSamplesPolicy<TAlternateInput>` is the exported policy type; `InstallStarterResource.samples` is its optional field. |
| Whether to omit barrels | must resolve now — resolved by D3 | Empty structural barrels are required. |
| Broader starter-resource redesign | safe to defer | Not needed for #1017. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Existing plugins unexpectedly stop emitting resources. | Undefined policy means emit original input; add default-behavior adapter test. |
| No-samples barrels reference missing files. | Provide explicit empty fallback inputs for all four barrels and type-check generated workspace in E2E. |
| Sibling dispatch flows change behavior. | Make every caller pass its already-planned boolean; add payload unit assertions. |
| E2E runtime depends on samples. | Keep the existing sample-enabled runtime project and test no-samples in an isolated black-box project/gate. |
| Public type causes slow-type/doc regression. | Named explicit policy type, JSDoc, scoped check/doc/quality evidence. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep the change in existing focused files; no new pipeline monolith. |
| AP-11 | clear target | Preserve process/filesystem work at existing adapter edges. |
| AP-14 | risk | Define the policy once in `@netscript/plugin`; plugins import it. |
| AP-18 | risk | Assert semantic exact paths and compile, not giant snapshots. |
| AP-23 | risk | Keep connector declarations declarative. |
| AP-24 | risk | Use a discriminated policy, not plugin-kind switches in the CLI/adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-15/F-16/F-17/F-18/F-19 | yes | scoped wrappers, tests, `quality:gate`, `arch:check` |
| F-6/F-7 | yes for exported adapter type | explicit docs/types and package publish/doc evidence or existing accepted package debt |
| F-CLI-1…31 | reviewed/PENDING_SCRIPT where applicable | no new CLI structure; `arch:check` and supervisor review |
| Runtime/consumer | yes | adapter tests, CLI feature tests, exact-path E2E, generated workspace check |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing CLI/plugin entries | none | Do not deepen or attempt unrelated closure. |
| New debt | none expected | Any inability to emit valid structural outputs triggers rescope, not debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | CLI check | requested scoped `run-deno-check.ts` for `packages/cli` with `--unstable-kv` | exit 0 |
| 2 | Plugin check | requested scoped `run-deno-check.ts` for `packages/plugin` with `--unstable-kv` | exit 0 |
| 3 | Scoped lint/format | wrapper-based CLI/plugin/plugin roots | exit 0 |
| 4 | Adapter tests | `deno test --allow-all packages/plugin/src/adapter` | exit 0 |
| 5 | CLI feature tests | `deno test --allow-all packages/cli/src/public/features/plugins` | exit 0 |
| 6 | Doctrine quality | `deno task quality:gate` | exit 0 or attributable pre-existing debt only |
| 7 | Black-box scaffold | no-samples E2E exact-path assertions | six paths absent; structural compile passes |
| 8 | Scaffold runtime | `deno task e2e:cli run scaffold.runtime` once | exit 0 with raw output retained |

## Dependencies

- Existing `@netscript/plugin/adapter` and CLI process dispatch protocol only; no dependency changes.

## Drift Watch

- Any caller whose intended samples value cannot be derived.
- Any structural resource besides the four barrels/runtime glue that references suppressed samples.
- Any need for plugin-kind branching in the CLI or adapter.
