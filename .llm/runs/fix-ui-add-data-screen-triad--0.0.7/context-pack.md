# Context Pack: #1357 `ui:add` data-screen triad

## Run Metadata

| Field          | Value                                 |
| -------------- | ------------------------------------- |
| Run ID         | `fix-ui-add-data-screen-triad--0.0.7` |
| Branch         | `fix/ui-add-data-screen-triad`        |
| Current phase  | `implementation — S2A`                |
| Archetype      | `6 — CLI / Tooling`                   |
| Scope overlays | `frontend`                            |

## Current State

PLAN-EVAL cycle 2 returned terminal `PASS_PLAN` at `53e696b5` with verdict `886f0860`. S2A now has
an isolated red-before commit (`0d620b61`) plus the kernel planner/preflight implementation and a
canonical router fixture correction in locked path 6. Focused tests, whole CLI check/test, and the
whole nested E2E check/test are green; the explicit push and PR comment are the remaining handoff
actions after this product/harness commit lands.

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
- Proved focused green (8/0), whole CLI green (838/0, 541 steps), and nested E2E green (168/0).

## In Progress

- Push the separate S2A product/harness commit and its red-before parent by explicit refspec, then
  post the S2A evidence comment to PR #1781.

## Next Steps

1. Finish the S2A commit/push/comment trail.
2. Implement S2B public options/help/result reporting in locked paths 3–6, retaining the real-help
   versus independently emitted-role seam.
3. Implement S2C gate definition and explicit runtime-suite selection in locked paths 7–12 without
   executing `scaffold.runtime`.

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
| `.llm/runs/fix-ui-add-data-screen-triad--0.0.7/context-pack.md` | modified | Resumable S2A state and next steps.              |

## Gates

| Gate family | Current status                  | Evidence                                                                                                       |
| ----------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Static      | S2A PASS plus measured base-red tooling | CLI 838/0 and nested E2E 168/0; lint/fmt task-path defects remain baseline-only.                         |
| Fitness     | PASS at base                    | quality, doctrine, docs, JSR, publish checks exit 0.                                                           |
| Runtime     | REQUIRED / NOT_RUN              | supervisor-coordinated `scaffold.runtime`; author prohibited.                                                  |
| Consumer    | PASS except intentional NOT_RUN | No corpus member is touched: three read-only checks stay green; writing assets-barrel remains supervisor-only. |

## Open Questions

- No S2A question remains open. S2B must make the command's own real `--help` the only in-leaf
  documentation proof; deferred `cli-reference.md:104` remains knowingly stale.

## Drift and Debt

- Drift: citation/option reality, missing `rtk`, doctrine legacy mismatch, base-red lint/fmt
  tooling, owner PR/evaluator override, and the cycle-1 selector/corpus contradiction are recorded
  in `drift.md`. The how-to plus three known-stale public descriptions are explicitly deferred.
- Debt: no new debt proposed; existing CLI spine/layer-2 and task-path debt stays out of scope.

## Commits

- S1 terminal plan head: `53e696b5` (`PASS_PLAN` verdict `886f0860`).
- S2A red-before test-only commit: `0d620b61`.
- S2A product/harness commit: this commit; exact SHA is recorded in the PR comment and owner report.
