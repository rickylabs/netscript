# Plan: custom workers job registry generation (#1234)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-generate-plugins-custom-job-registry--1234` |
| Branch | `fix/generate-plugins-custom-job-registry` |
| Phase | `plan` |
| Target | `plugins/workers`, `packages/cli`, and generator documentation |
| Archetype | `5 - Plugin Package` + `6 - CLI and Tooling` composite |
| Scope overlays | `docs` |

## Archetype

Archetype 5 governs the published workers plugin manifest and its runtime registry contribution.
Archetype 6 governs the public `generate plugins` consumer path and the CLI E2E fixture. The slice is
composite because the manifest contract is only proven through the installed-plugin CLI boundary.

## Current Doctrine Verdict

`plugins/workers` is in the doctrine's refactor category, with existing debt around plugin
verification and worker/jobs organization. `packages/cli` has historical restructure debt but this
slice changes no production CLI layering. The plan does not deepen either debt area.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The published manifest is the contract; change it before relying on new behavior. |
| A2 | Replacing a sample with a user job must work through the ordinary public command. |
| A8 | The regression test must model the custom-only consumer state, not another sample. |
| A9 | Plugin and CLI archetype gates both apply to this cross-boundary slice. |
| A11 | The open extension axis is project-authored jobs; a scaffold sample allow-list cannot close it. |
| A14 | Static, fitness, runtime, consumer, and publication evidence are all required. |

## Goal

Make `netscript generate plugins` structurally discover project-authored workers jobs even when all
official samples are removed, and migrate the runtime E2E fixture from registry mutation to public
regeneration.

## Scope

- Replace the sample-based integration test with a custom-only workers job reproduction.
- Remove the workers scaffold profile's closed filename filters while retaining `--profile
  scaffold` for optional official sample configuration.
- Regenerate the Flow B registry through `netscript generate plugins` and stop writing generated
  registry source in the fixture.
- Document structural job discovery, explicit exclusions, and sample independence.
- Capture targeted, package, publication, full scaffold-runtime, and composed-evaluation evidence.

## Non-Scope

- No new job metadata or sidecar configuration contract; Flow B's E2E-only imports belong in its
  generated-project test config.
- No recursive job discovery; the existing public manifest declares a top-level `workers/jobs`
  directory and this issue does not request subdirectory semantics.
- No change to generic profile overlay semantics used by other plugins.
- No redesign of workers core contracts, runtime execution, or plugin loading.
- No `deno.lock` update or cache reload.

## Hidden Scope

- The E2E fixture must pass the local or published CLI entrypoint into its subprocess so the
  regeneration proves the same public command in both source modes.
- Flow B's custom imports must move into `deno.json` before its registry stops carrying an
  E2E-specific `importMapUrl`.
- The manifest is a published surface even though no TypeScript export changes; JSR audit and
  publish dry-run are therefore required.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Keep `runtimeRegistryGenerator.args = ["--profile", "scaffold"]`, but remove the workers target's entire `profiles.scaffold` include overlay. | Removing only `include` leaves `includeWhenPresent` as a filter; removing the profile flag also disables official sample configuration. With no overlay, the existing explicit manifest contract structurally discovers all eligible project jobs. |
| D2 | Preserve explicit exclusions (`_registry.ts`, `job-tools.ts`, `mod.ts`, `types.ts`) and deterministic sorting. | Helpers are not jobs; explicit manifest exclusions avoid filename magic in implementation code and keep generated output stable. |
| D3 | Turn the installed workers integration into a custom-only test and assert both registration and helper exclusion. | It fails on the current manifest and proves acceptance through the installed-plugin public boundary. |
| D4 | Have Flow B merge its test-only imports into project `deno.json`, invoke the selected public CLI's `generate plugins`, then read/assert rather than write the generated registry. | This kills the workaround without expanding production job metadata scope and validates both local-source and published E2E modes. |
| D5 | Update the command reference and ERP tutorial where generator behavior is described. | Users need an explicit public promise that sample removal does not suppress custom jobs and generated registries are never hand-edited. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Widen current profile vs add a new profile | resolved now | D1 widens the existing default public path; a new opt-in profile would leave ordinary scaffolds broken. |
| Structural discovery vs content introspection | resolved now | Existing extension contract is structural with import-time validation; content parsing is unnecessary and would create a second definition of a job. |
| Empty job directory behavior | safe to defer | This issue requires at least one custom job. The current declared-artifact failure for a truly empty directory is not changed. |
| Recursive discovery | safe to defer | Existing manifest contract and tests are top-level; adding recursion would broaden public semantics. |
| General job metadata contract | safe to defer | Flow B can use project config; no acceptance criterion requires production metadata customization. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Helper modules become registrable | Retain and test explicit exclusions. |
| Official cross-plugin samples disappear | Structural discovery includes them whenever present, independent of profile allow-lists. |
| Flow B loses dependency resolution | Merge its local/published aliases into `deno.json` before regeneration and retain graph pre-warm. |
| E2E accidentally invokes the wrong CLI source | Pass the runner-selected local absolute entrypoint or published JSR specifier into the fixture. |
| Unrelated lock churn enters the PR | Stage explicit paths only and verify raw diff against baseline before each push. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 | existing risk | Make discovery explicit in the published manifest; do not add implicit source inspection magic. |
| AP-18 | existing | Replace sample-shaped coverage with semantic custom-only generated-output assertions. |
| AP-25 | risk | Keep subprocess and filesystem access at the existing E2E/plugin CLI edges; no new framework side effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| A5 universal gates including F-1, F-3, F-5–F-19 as applicable | yes | `quality:gate`, `arch:check`, scoped check/lint/fmt, audit, and manual diff review |
| A6 universal + F-CLI-1…F-CLI-31 | yes | `quality:gate`, `arch:check`, scoped wrappers; untouched production CLI structure recorded as manual evidence |
| Docs overlay | yes | source-alignment review plus repository doc-lint/link gates |
| PLAN-EVAL | composed per milestone-run.md (orchestrator waiver) | `plan-eval.md` checklist and explicit D6 record |
| IMPL-EVAL | composed per milestone-run.md (orchestrator waiver) | draft-to-ready/pre-merge composed verdict |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| Existing workers plugin verification and jobs-organization debt | none | This slice changes only manifest discovery behavior and does not claim the plugin is doctrine-complete. |
| Existing CLI restructure debt | none | No production CLI layer or public command signature changes. |
| New debt | none expected | Any broader empty-directory, recursive discovery, or metadata request remains ordinary future scope rather than hidden debt in this fix. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | RED | targeted installed runtime registry integration test after changing it to `custom-claim-job.ts`, before manifest fix | Fails because the declared workers registry is absent. |
| 2 | Targeted GREEN | same targeted integration test after D1 | Custom job registered; helper excluded. |
| 3 | Plugin tests | focused workers generator/manifest tests and CLI generate tests | Pass. |
| 4 | Scoped static | `.llm/tools/run-deno-check.ts`, `run-deno-lint.ts`, and `run-deno-fmt.ts` for touched TypeScript roots | Pass with `--unstable-kv` where applicable and no new ignores. |
| 5 | Architecture/quality | `deno task quality:gate` and `deno task arch:check` | Pass or only explicitly pre-existing unrelated baseline findings. |
| 6 | Docs/publish | repository doc-lint, JSR audit for workers/CLI surfaces, and `deno task publish:dry-run` | Pass; published manifest is included. |
| 7 | Consumer runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | Full one-pass suite passes with Flow B regenerating the custom registry publicly. |
| 8 | Hygiene | raw `git diff`, ignore scan, and lock comparison | No new lint ignores, unsafe casts, or committed `deno.lock` churn. |
| 9 | Evaluation | composed draft-to-ready/pre-merge review per milestone-run D6 | PASS with acceptance evidence mapped in the PR. |

## Risks

- The full runtime smoke is expensive; run it once after targeted and static gates are green.
- Published-mode Flow B may expose import-resolution assumptions not covered locally; retain both
  config generation and pre-warm, and use the full suite's configured source mode as evidence.

## Dependencies

- Live issue #1234 and milestone 0.0.5.
- Existing workers runtime registry generator and installed-plugin manifest resolver.
- CLI E2E scaffold runtime suite and its local/published entrypoint selection.

## Drift Watch

- Log if the manifest cannot be widened without changing generic profile semantics.
- Log if Flow B still requires generated-registry metadata after imports move to `deno.json`.
- Log any baseline gate failure, lockfile mutation, or source-mode discrepancy before rescoping.
