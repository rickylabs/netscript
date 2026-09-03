# Plan: desktop fixture oRPC contract dependency

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `desktop-orpc-contract-dep--impl`         |
| Branch         | `fix/desktop-fixture-orpc-contract-dep`   |
| Phase          | `plan`                                    |
| Target         | `packages/cli/e2e` desktop-native fixture |
| Archetype      | `6 — CLI / Tooling` (owned harness)       |
| Scope overlays | none                                      |

## Archetype

Archetype 6 applies because the touched surface is the CLI's user-run native packaging harness. The
nested E2E workspace is explicitly an owned harness rather than an independently published doctrine
unit, so public-package/JSDoc/JSR gates are not expanded into this bounded repair.

## Current Doctrine Verdict

`packages/cli` is **Keep**: preserve the Archetype-6 kernel/surface split. This change stays inside
the existing native-desktop adapter and fixture seams and introduces no production abstraction.

## Axioms in Play

| Axiom | Why it matters                                                                            |
| ----- | ----------------------------------------------------------------------------------------- |
| A2    | Keep the repair to explicit fixture dependency declarations.                              |
| A8    | Reuse the existing preparation/contract-driver seam instead of adding a parallel harness. |
| A14   | Make the prepared fixture import graph an ordinary-PR fitness check.                      |

## Goal

Restore `desktop-native-linux` for heads containing #1889 and make future missing imports in the
prepared fixture's relative SDK graph fail in the ordinary root check lane.

## Scope

- Add `@orpc/contract` at `npm:@orpc/contract@^1.15.0` to the checked-in and prepared fixture maps.
- Extend the existing fixture contract driver with a structured prepared-workspace check-only mode.
- Add that check as a dependency of the ordinary root `check` task.
- Prove the guard fails without the dependency, then restore and run scoped/static/contract/runtime
  gates.

## Non-Scope

- No SDK transport-policy rollback, deferral, or refactor.
- No desktop packaging architecture refactor.
- No unrelated `@orpc/*` dependency sweep.
- No lock-file regeneration.

## Hidden Scope

- `prepareDesktopFixture()` replaces the checked-in import map, so both declarations must be fixed.
- The guard must inspect the prepared copy; checking source paths from repository root uses the
  wrong resolution root and is vacuous for this defect class.

## Locked Decisions

| ID | Decision                                                                                        | Rationale                                                                                                                      |
| -- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| D1 | Check the prepared fixture using `.llm/tools/run-deno-check.ts` with the temp fixture as `cwd`. | It validates the exact manifest used by packaging and retains structured evidence.                                             |
| D2 | Wire the guard through a dependency of root `deno task check`.                                  | Ordinary PR CI already runs this required lane; developers get the same failure locally.                                       |
| D3 | Keep the prepared import-map rewrite and add the missing declaration there.                     | The task forbids a packaging refactor; this is the smallest runtime-effective repair.                                          |
| D4 | Record PLAN-EVAL as N/A.                                                                        | The issue and verified tree fully specify the contract, scope, gates, and dependency pin; no material design decision remains. |

## Open-Decision Sweep

| Decision                                                | Status        | Notes                                                                                                                                     |
| ------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Whether to run full `desktop-native` on every main push | safe to defer | Recommend a scheduled/main smoke, while this cheap graph guard runs on every ordinary PR. Release policy changes are outside this repair. |

## Risk Register

| Risk                                        | Mitigation                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Guard checks the wrong import map           | Prepare the fixture first and run with the temp root as `cwd`; demonstrate failure after removing the new entry.   |
| Root check becomes host-specific            | The guard only runs Deno graph checking; native `.deb`, Aspire, and Docker work remains in `desktop-native-linux`. |
| Lock churn                                  | Snapshot `deno.lock` diff before/after; do not run reload or regenerate wholesale.                                 |
| False issue closure before runtime evidence | Draft body uses `Refs #1926`; add a closing keyword only after every acceptance item is actually evidenced.        |

## Anti-Patterns to Resolve or Avoid

| AP    | Status  | Plan                                                                               |
| ----- | ------- | ---------------------------------------------------------------------------------- |
| AP-18 | risk    | Assert command exit/import resolution, not a giant output snapshot.                |
| AP-25 | avoided | Keep process/temp-workspace effects in the existing native-desktop adapter driver. |

## Fitness Gates

| Gate               | Required | Expected evidence                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------------- |
| F-19               | yes      | Scoped structured check/lint/fmt wrappers.                                   |
| A14 consumer graph | yes      | Prepared fixture check fails without and passes with `@orpc/contract`.       |
| Quality/doctrine   | yes      | `deno task quality:scan` and `deno task arch:check`; no new production debt. |

## Arch-Debt Implications

| Entry                            | Action | Notes                                                                      |
| -------------------------------- | ------ | -------------------------------------------------------------------------- |
| `packages/cli/e2e` existing debt | none   | This slice does not deepen the scaffold-runtime registry/cardinality debt. |

## Validation Plan

| Order | Gate               | Command or check                                                                                                                                    | Expected result                                 |
| ----- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1     | dependency         | `deno task deps:latest --filter @orpc/contract`                                                                                                     | 0 behind; SDK pin remains `^1.15.0`.            |
| 2     | non-vacuous guard  | temporarily remove both new entries; `deno task check:desktop-native-fixture`                                                                       | non-zero with missing `@orpc/contract`.         |
| 3     | prepared graph     | `deno task check:desktop-native-fixture`                                                                                                            | PASS.                                           |
| 4     | scoped check       | `run-deno-check.ts --root packages/cli/e2e/fixtures/desktop-native --ext ts` plus prepared-cwd guard                                                | PASS.                                           |
| 5     | contract           | `run-deno-test.ts -- --allow-all packages/cli/e2e/fixtures/desktop-native/tests/fixture-contract.ts` from prepared fixture path via existing driver | PASS.                                           |
| 6     | lint/fmt           | structured wrappers over touched TypeScript roots                                                                                                   | PASS.                                           |
| 7     | doctrine           | `deno task quality:scan`; `deno task arch:check`                                                                                                    | PASS or baseline-only findings recorded.        |
| 8     | local native suite | `deno task e2e:cli run deploy.desktop-native --cleanup --format pretty`                                                                             | Run as far as host allows; report exact limits. |
| 9     | CI runtime         | ready, `ci:full` PR `desktop-native-linux`                                                                                                          | green on main-facing branch carrying #1889.     |

## Drift Watch

- Any change requiring SDK source, packaging architecture, or broader dependency versions is a
  rescope.
