# Context Pack: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7` |
| Branch         | `fix/ui-add-data-screen-triad`        |
| Current phase  | `implementation complete — handoff`   |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Current State

PLAN-EVAL cycle 2 returned terminal `PASS_PLAN` at `53e696b5` with verdict `886f0860`. The owner
independently reproduced and accepted S2A at `e5d820b3f` and S2B at `0cc9b7ad7`. S2C has isolated
test-only red commit `7ed5b94c6` and accepted green implementation head `dbb62c065`. S2D static,
fitness, JSR, publish, emitted-sample, and three read-only derivative checks are green. Product
implementation is complete and awaits supervisor Tier-A runtime evidence plus separate-session
IMPL-EVAL.

## Completed

- Verified issue #1357 citations and live dependency issues #1354/#1355/#1356/#1360.
- Completed doctrine/archetype/frontend checkpoint and public `deno doc` inspection.
- Answered all six owner questions and locked product boundary/compatibility semantics.
- Measured base gates, including red-at-base lint/fmt commands and deliberate NOT_RUN gates.
- Derived shared-carrier impact from all four named checks.
- Incorporated the cycle-1 selector/corpus correction without revisiting the design areas the
  evaluator passed.
- Recorded all deferred known-stale docs and corrected the optional `initialDataUpdatedAt` wording.
- Captured detached focused red-before evidence at exact `0d620b61`: exit 1, 1 passed/7 failed.
- Implemented the four-role data-screen plan, full no-write preflight, force/dry-run kernel
  semantics, appRoutes registration, and one route-tree island convention.
- Restored the in-ceiling app-root consumer fixture with a canonical `router.ts` after whole-package
  composition exposed three deterministic failures.
- Proved focused green (8/0), whole structured CLI green (1,379/0), and nested E2E green (168/0).
- Recorded lint/fmt as N/A by repository configuration for `packages/cli`, not as a false green.
- Captured owner-reproduced S2B focused red-before (17/4) and green (21/0) at `22e737fc3` and
  `0cc9b7ad7`; whole-package green is 1,384/0.
- Made real command help advertise the four planned roles and route-tree island convention; the
  test parses that rendered help and compares it with an independently planned result set.
- Threaded public `--dry-run` and `--force` into page/island scaffolds and report every role/path.
- Added the generated data-screen consumer gate and registered it with the scaffold capability set.
- Explicitly selected the gate into `RUNTIME_GATES` after init and before generated-workspace check.
- Proved S2C focused red 18/3 and green 21/0, nested E2E 170/0, and whole CLI 1,386/0.
- Recorded the owner-reproduced whole E2E red at `7ed5b94c6`: exit 1, 167/3.
- Proved S2D quality, architecture, CLI doc lint, JSR audit, CLI publish dry-run, emitted samples,
  JSR specifiers, agent-docs prose, publish assets, and MCP export corpus at exit 0.
- Kept the writing assets-barrel check and runtime gate `NOT_RUN`; lint/fmt remain N/A by config.
- Corrected the two stale plan gate rows from 9 to 10 existing ceiling TS files.

## In Progress

- Commit/push the S2D run-artifact evidence and post the single S2D handoff comment to PR #1781.

## Next Steps

1. Supervisor acquires the singleton runtime lease and runs the required Tier-A
   `scaffold.runtime --cleanup` gate.
2. Dispatch separate-session IMPL-EVAL after the S2D artifact head is available.

## Key Decisions

| Decision                                   | Source       | Notes                                                                                                      |
| ------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Prioritized one conventional query binding | plan D2–D4   | One explicit client wins; otherwise one init example; peer ambiguity/unsupported/zero fails before writes. |
| #1360 not landing dependency               | plan D10–D12 | API exists; showcase/migration remain #1360.                                                               |
| Route-tree `(_islands)` convention         | plan D8–D9   | Existing files untouched; future standalone output moves.                                                  |
| Semantic role contract                     | plan D13–D14 | Couples help and planned files.                                                                            |
| Runtime author NOT_RUN                     | plan D16     | Required supervisor lease/host.                                                                            |
| Final 12-path ceiling                      | plan ceiling | Adds `capability-suites.ts`; removes the generated-corpus how-to.                                          |
| No docs/carrier mutation                   | plan D17     | Four cascade checks stay stable because this leaf writes no corpus member; docs are deferred.              |
| Real help-surface assertion                | plan D13     | Render real Cliffy help and compare it independently with planned emission roles.                          |
| Plain page registration                    | plan D7      | Non-island pages use `router.ts`/`appRoutes` but do not require a data binding.                            |

## S2C Files Changed

| Ceiling | Path                                                                          | Notes                                  |
| ------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| 7       | `packages/cli/e2e/src/domain/cli-surface.ts`                                  | Stable data-screen gate id.            |
| 8       | `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts`     | Generated-consumer command definition. |
| 9       | `packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts` | Capability registration.               |
| 10      | `packages/cli/e2e/tests/application/gates/scaffold/ui-data-screen-gates_test.ts` | Command/registration contract.         |
| 11      | `packages/cli/e2e/tests/presentation/suite-registry_test.ts`                  | Resolved-suite membership/order proof. |
| 12      | `packages/cli/e2e/suites/scaffold/capability-suites.ts`                       | Explicit `RUNTIME_GATES` selection.     |

## Gates

| Gate family | Current status                  | Evidence                                                                                                       |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Static      | PASS plus configured N/A lint/fmt | CLI 1,386/0; E2E 170/0; package checks and S2D static gates exit 0.                                           |
| Fitness     | PASS                              | Quality, architecture, doc lint, JSR audit, publish, samples, and specifier gates exit 0.                      |
| Runtime     | REQUIRED / NOT_RUN                | Supervisor Tier-A; queued on singleton lease. D-42/D-43 topology is resolved.                                  |
| Consumer    | PASS except intentional NOT_RUN   | Three read-only cascade checks exit 0; writing assets-barrel remains prohibited.                              |

## Open Questions

- No implementation question remains open. Runtime execution and IMPL-EVAL remain required
  supervisor/separate-session handoffs. The
  command-owned real `--help` is the only in-leaf documentation proof; deferred
  `cli-reference.md:104` remains knowingly stale.

## Drift and Debt

- Drift: citation/option reality, missing `rtk`, doctrine legacy mismatch, base-red lint/fmt
  tooling, owner PR/evaluator override, and the cycle-1 selector/corpus contradiction are recorded
  in `drift.md`. The how-to plus three known-stale public descriptions are explicitly deferred.
- Debt: no new debt proposed; existing CLI spine/layer-2 and task-path debt stays out of scope.

## Commits

- S1 terminal plan head: `53e696b5` (`PASS_PLAN` verdict `886f0860`).
- S2A red-before test-only commit: `0d620b61`.
- S2A product/harness commit: `e5d820b3f` (accepted).
- S2B red-before test-only commit: `22e737fc3`.
- S2B product/harness commit: `0cc9b7ad7` (accepted).
- S2C red-before test-only commit: `7ed5b94c6`.
- S2C product/harness commit: `dbb62c065` (accepted).
