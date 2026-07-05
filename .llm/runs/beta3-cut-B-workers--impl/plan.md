# Plan: workers health entrypoint #376

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta3-cut-B-workers--impl` |
| Branch | `fix/workers-health-entrypoint-376` |
| Phase | `implement` |
| Target | `plugins/workers` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `none` |

## Archetype

ARCHETYPE-5 applies because this is a first-party package under `plugins/*`. The thinness law is in play: the plugin should wire core-owned worker primitives and publish its own runtime job module without forcing consuming apps to copy plugin source.

## Current Doctrine Verdict

`plugins/workers` is listed as `Refactor` with the headline "Confirm verify-plugin.ts exists; review worker/ vs jobs/ split." This slice does not restructure the plugin; it fixes a runtime false-done in the existing thin-plugin model.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A1 | The stored job definition is the contract the worker process consumes. |
| A2 | Consumers should not need hidden source-copy behavior to run a built-in plugin job. |
| A7 | Use Deno/JSR module specifiers directly instead of inventing asset vendoring. |
| A8 | Keep the plugin job file in the plugin package's `jobs/` contribution axis. |
| A14 | Add tests and gate coverage that prove execution, not just registration. |

## Goal

Make `workers-plugin-health-check` resolvable and executable in consuming apps without hand-copying `plugins/workers/jobs/health-check.ts`.

## Scope

- Register the built-in health-check job with a URL-shaped package `sourceUrl` that consuming app import maps resolve through an exact `jsr:` key.
- Preserve compatibility with existing registry records by re-registering stale jobs when `sourceUrl` differs.
- Add tests for registration metadata and dynamic import source selection.
- Strengthen scaffold runtime E2E behavior so it verifies a completed built-in health-check execution.

## Non-Scope

- No plugin source vendoring at scaffold/generate time.
- No inline/embedded handler registration.
- No broad worker folder restructuring or public export expansion.
- No repeated full `scaffold.runtime` runs beyond the single FAIL_FIX response smoke requested by the supervisor.

## Hidden Scope

- Existing persisted registry rows may still contain the stale project-local entrypoint, so update detection must include `sourceUrl`.
- The runtime gate must catch asynchronous worker execution failure after the trigger endpoint returns.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | Use option 1 with an exact import-map override: store `sourceUrl: "jsr:@netscript/plugin-workers/jobs/health-check.ts"` for the built-in job and generate an exact root import-map key for that specifier. | `sourceUrl` is schema-validated as URL-shaped, so a bare package key would broaden the core registry contract. An exact `jsr:` import-map key lets local scaffolds map the job to `plugins/workers/jobs/health-check.ts`, while prod scaffolds map the unpinned self-reference to the pinned JSR package subpath. This keeps the plugin thin and avoids vendoring or embedded handler duplication. |
| D2 | Retain `entrypoint: "./jobs/health-check.ts"` as a plugin-package relative fallback/display value. | The core dispatcher prefers `sourceUrl`, while keeping `entrypoint` avoids a no-entrypoint dynamic import error and preserves a human-readable package-local path. |
| D3 | Extend the runtime E2E execution validator instead of adding another trigger-only HTTP gate. | The defect class occurs when the worker actually imports the module, after enqueue/trigger succeeds. |
| D4 | Add an exact root import-map entry for `jsr:@netscript/plugin-workers/jobs/health-check.ts` when the workers plugin is installed. | Deno import-map bare package mappings do not cover the `jsr:` scheme and do not guarantee subpath drift detection. An exact key ties the registry row, scaffold import map, and JSR export key together. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Fix option | resolved | D1 selects package `sourceUrl` plus exact scaffold import-map override; options 2 and 3 are rejected as fat-plugin duplication and scaffold-source coupling. |
| Full runtime smoke | required after FAIL_FIX | Supervisor merge-readiness found local-source dynamic import failure; this implementation lane must run `scaffold.runtime` once after the fix. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Published package module path is not included in JSR package | `plugins/workers/deno.json` includes explicit `./jobs/health-check.ts` export; validation includes export-map regression, `deno doc --lint`, and publish dry-run evidence. |
| Local-source scaffold resolves to previous registry publish | Use an exact generated `jsr:` import-map key so local mode resolves to the workspace file. |
| Existing stale registry rows are not corrected | Include `sourceUrl` in changed-field detection and re-registration. |
| Gate only observes enqueue | Poll executions for the specific health-check job and require a completed status. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 | risk | Keep registration explicit; no implicit discovery. |
| AP-14 | avoided | Do not redefine worker core contracts. |
| AP-23 | existing risk | Keep explicit module reference rather than inline service handler body. |
| AP-25 | avoided | No new non-edge side effects. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-3 | yes | Scoped check and existing import layering. |
| F-5 | yes | No public export change; `deno doc` scan recorded. |
| F-6 | yes | JSR publish include/path scan; dry-run if time permits. |
| F-10 | yes | Targeted Deno tests. |
| F-19 | yes | Scoped wrapper check/lint/fmt on touched roots. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `plugins/workers` refactor verdict | none | This slice does not deepen folder-shape debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | targeted tests | `deno test --unstable-kv --allow-all plugins/workers/services/src/init_test.ts packages/plugin-workers-core/tests/runtime/job-dispatcher_test.ts packages/cli/src/kernel/adapters/scaffold/tests/import-resolver_test.ts packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` | pass |
| 2 | workers check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | pass |
| 3 | core check if touched | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin-workers-core --ext ts,tsx` | pass if core test/source touched |
| 4 | CLI check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | pass |
| 5 | lint | scoped lint wrappers on touched roots | pass |
| 6 | fmt | scoped fmt wrapper on touched roots | pass |
| 7 | runtime smoke | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | pass |

## Drift Watch

- Record if tests require changing core dispatcher behavior rather than only plugin metadata.
- Record that PLAN-EVAL was externally waived by implementation-lane launch.
