# Context Pack: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7` |
| Branch         | `fix/ui-add-data-screen-triad`        |
| Current phase  | `implementation — S2B`                |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Current State

PLAN-EVAL cycle 2 returned terminal `PASS_PLAN` at `53e696b5` with verdict `886f0860`. The owner
independently reproduced and accepted S2A at `e5d820b3f`. S2B now has isolated test-only red commit
`22e737fc3` and green public command changes: real help/role coupling, dry-run/force threading, and
per-role path reporting. Focused and whole CLI gates are green; the S2B product/harness commit,
explicit push, and PR comment remain.

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
- Captured S2B focused red-before (2/4) and whole-package red-before (1,380/4) at `22e737fc3`.
- Made real command help advertise the four planned roles and route-tree island convention; the
  test parses that rendered help and compares it with an independently planned result set.
- Threaded public `--dry-run` and `--force` into page/island scaffolds and report every role/path.
- Proved S2B focused 6/0 and whole structured CLI 1,384/0.

## In Progress

- Commit the S2B product/harness changes separately from `22e737fc3`, push by explicit refspec, and
  post the single S2B evidence comment to PR #1781.

## Next Steps

1. Finish the S2B commit/push/comment trail.
2. Implement S2C gate definition and explicit runtime-suite selection in locked paths 7–12 without
   executing `scaffold.runtime`.
3. Run S2D static/fitness/read-only cascade evidence and prepare separate-session IMPL-EVAL.

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

## Files Changed

| Path                                                            | Status   | Notes                                         |
| --------------------------------------------------------------- | -------- | --------------------------------------------- |
| `packages/cli/src/kernel/application/ui/web-scaffold.ts`        | modified | S2A planner, binding, emission, preflight.      |
| `packages/cli/src/kernel/application/ui/web-scaffold_test.ts`   | committed | Red-before semantic goldens at `0d620b61`.      |
| `packages/cli/src/public/features/ui/ui-app-root-command_test.ts` | modified | Canonical router fixture for composed tests.  |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/worklog.md`      | modified | S2A evidence and corrected 10-file count.       |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/drift.md`        | modified | Records in-ceiling fixture ordering drift.      |
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/context-pack.md` | modified | Resumable S2B state and next steps.              |
| `packages/cli/src/public/features/ui/add/add-ui-command.ts`     | modified | S2B real help, option threading, role reporting. |
| `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | committed | S2B red-before seam at `22e737fc3`.             |
| `packages/cli/src/public/features/ui/add/add-ui-input.ts`       | modified | Adds the optional `dryRun` public input.          |
| `packages/cli/src/public/features/ui/ui-app-root-command_test.ts` | modified | Covers the accepted `dryRun` input field.       |

## Gates

| Gate family | Current status                  | Evidence                                                                                                       |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Static      | S2B PASS plus configured N/A lint/fmt | CLI 1,384/0; `packages/cli` is excluded from root lint/fmt and declares no package scope.                |
| Fitness     | PASS at base                    | quality, doctrine, docs, JSR, publish checks exit 0.                                                           |
| Runtime     | REQUIRED / NOT_RUN              | supervisor-coordinated `scaffold.runtime`; author prohibited.                                                  |
| Consumer    | PASS except intentional NOT_RUN | No corpus member is touched: three read-only checks stay green; writing assets-barrel remains supervisor-only. |

## Open Questions

- No S2B question remains open. Command-owned real `--help` is the only in-leaf documentation
  proof; deferred `cli-reference.md:104` remains knowingly stale.

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
- S2B product/harness commit: this commit; exact SHA is recorded in the PR comment and owner report.
