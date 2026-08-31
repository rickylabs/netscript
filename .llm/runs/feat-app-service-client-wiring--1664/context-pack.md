# Context Pack: explicit UI scaffold query-client selection

## Run Metadata

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Run ID        | `feat-app-service-client-wiring--1664`     |
| Branch        | `feat/app-service-client-wiring`           |
| Current phase | `handoff`                                  |
| Baseline      | `270c31d4d6e9bab24597ac8fe077227d5e98dcc7` |
| Archetype     | `6 - CLI / Tooling`                        |
| Scope overlay | `frontend`                                 |

## Current State

The bounded implementation and local validation are complete. Data-bound page/island scaffolds now
accept an optional `--client <service>` selector matched against the module-declared service
identity. No-selector single-client discovery follows the existing path; genuine ambiguity remains
fail-closed and now reports available services and the remedy. The data-screen gate supplies
`--client users` in its existing position.

## Completed

- Required harness, CLI, doctrine, tools, and Archetype-6 references read.
- Current resolver, CLI input/flag mapping, unit tests, and E2E fixture sequence inspected.
- Lock baseline recorded: `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- Design checkpoint recorded in `worklog.md`; `PLAN-EVAL: N/A` justified there.
- Selector implementation and distinct error coverage completed within the six approved TypeScript
  files.
- Focused tests, CLI package tests, structured static gates, fitness gates, diff hygiene, and lock
  integrity all passed; exact evidence is recorded in `worklog.md`.

## In Progress

- Create and push the one slice commit, then post its evidence to PR 1664.

## Next Steps

1. Confirm the remote branch still points at the recorded baseline.
2. Create one commit containing the six approved TypeScript files and these two run artifacts.
3. Push through an explicit refspec and post the slice evidence to PR 1664.

## Key Decisions

| Decision                               | Source             | Notes                                                                            |
| -------------------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| Keep fail-closed ambiguity             | Coordinator ruling | No auto-pick with multiple candidates                                            |
| Match module-declared service identity | Coordinator ruling | Filenames are deliberately ignored                                               |
| Preserve one-candidate discovery       | Coordinator ruling | Existing default path remains unchanged                                          |
| Pass `users` in the E2E gate           | Fixture evidence   | Init and browser behavior use `users`; `payments` proves the second-service case |

## Files Changed

| Path                                                             | Status | Notes                      |
| ---------------------------------------------------------------- | ------ | -------------------------- |
| `.llm/runs/feat-app-service-client-wiring--1664/worklog.md`      | new    | Design and evidence ledger |
| `.llm/runs/feat-app-service-client-wiring--1664/context-pack.md` | new    | Resumable state            |
| `packages/cli/src/kernel/application/ui/web-scaffold.ts` | modified | Service-identity selection and errors |
| `packages/cli/src/kernel/application/ui/web-scaffold_test.ts` | modified | Resolver behavior coverage |
| `packages/cli/src/public/features/ui/add/add-ui-input.ts` | modified | Optional client input |
| `packages/cli/src/public/features/ui/add/add-ui-command.ts` | modified | CLI flag and forwarding |
| `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | modified | Command-surface coverage |
| `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts` | modified | Explicit `users` selection |

## Gates

| Gate family            | Current status | Evidence                                    |
| ---------------------- | -------------- | ------------------------------------------- |
| Focused tests          | passed | 20 passed, 0 failed |
| Scoped static wrappers | passed | check/lint/fmt stdout bytes: 303/349/298 |
| Package tests          | passed | 1,208 passed, 0 failed, 0 ignored |
| Fitness                | passed | `quality:gate` exited 0 |
| Consumer               | bounded update complete | `--client users` added; order unchanged; full runtime suite not run |

## Open Questions

None. Any need to touch a file outside the coordinator-approved ceiling is a rescope stop.

## Drift and Debt

- Drift: none.
- Debt: no new or deepened doctrine debt identified.

## Commits

- See the PR commit list and the per-slice evidence comment after push.
