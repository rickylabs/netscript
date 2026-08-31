# Context Pack: explicit UI scaffold query-client selection

## Run Metadata

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| Run ID        | `feat-app-service-client-wiring--1664`     |
| Branch        | `feat/app-service-client-wiring`           |
| Current phase | `bounded follow-up handoff`                 |
| Baseline      | `270c31d4d6e9bab24597ac8fe077227d5e98dcc7` |
| Archetype     | `6 - CLI / Tooling`                        |
| Scope overlay | `frontend`                                 |

## Current State

The earlier selector work and stale-expectation follow-up are complete. The current bounded slice
instruments the hosted browser probe at both the initial-row and optimistic-row assertions. It adds a
timeout-only structured JSON payload for DOM state, hydration/interactivity, browser QueryClient
state, cache events, and in-browser `onMutate` proof. No template, carrier, `packages/fresh`, or
`packages/sdk` file has changed; the hosted result must name the measured cause before any fix is
considered.

## Completed

- Required harness, CLI, doctrine, tools, and Archetype-6 references read.
- Current resolver, CLI input/flag mapping, unit tests, and E2E fixture sequence inspected.
- Lock baseline recorded: `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- Design checkpoint recorded in `worklog.md`; `PLAN-EVAL: N/A` justified there.
- Selector implementation and distinct error coverage completed within the six approved TypeScript
  files.
- Focused tests, CLI package tests, structured static gates, fitness gates, diff hygiene, and lock
  integrity all passed; exact evidence is recorded in `worklog.md`.
- Follow-up named tests pass independently: 1 passed / 0 failed each.
- Follow-up repo-wide test result is 4,513 passed / 2 failed / 19 ignored; both failures are the
  expected sandbox-only browser executable spawn permission cases.
- Follow-up scoped receipts are non-empty: check/lint/fmt `stdout.bytes=303/349/298`.

## In Progress

- Create and push the one instrumentation commit, then read the hosted `scaffold-runtime` evidence.

## Next Steps

1. Create one commit containing the browser probe and these two run artifacts.
2. Push `HEAD:refs/heads/feat/app-service-client-wiring` explicitly.
3. Read the hosted `e2e-cli` / `scaffold-runtime` failure payload and post the measured cause to the
   PR.
4. Change the two showcase island templates, optimistic helper, and regenerated carrier only if the
   measurement identifies one of those files; otherwise stop at the Fresh/provider rescope boundary.

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

### Current bounded follow-up

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | modified | Exact rendered `--client` option-line contract |
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | modified | Corrected service-suite gate expectation |
| `.llm/runs/feat-app-service-client-wiring--1664/{worklog.md,context-pack.md}` | modified | Follow-up evidence and handoff |
| `.llm/runs/feat-app-service-client-wiring--1664/receipts/{check,lint,fmt-check,test}.json` | refreshed | Durable scoped and repo-wide evidence |

### Hosted optimistic-render instrumentation

| Path | Status | Notes |
| --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts` | modified | Timeout-only bounded CDP/QueryCache evidence |
| `.llm/runs/feat-app-service-client-wiring--1664/{worklog.md,context-pack.md}` | modified | Design, gates, and hosted handoff |

## Gates

| Gate family            | Current status | Evidence                                    |
| ---------------------- | -------------- | ------------------------------------------- |
| Focused tests          | passed | 20 passed, 0 failed |
| Scoped static wrappers | passed | check/lint/fmt stdout bytes: 303/349/298 |
| Package tests          | passed | 1,208 passed, 0 failed, 0 ignored |
| Fitness                | passed | `quality:gate` exited 0 |
| Consumer               | bounded update complete | `--client users` added; order unchanged; full runtime suite not run |

### Follow-up gate delta

| Gate | Result |
| --- | --- |
| Named stale tests | PASS — 1/0 each |
| Repo-wide tests | EXPECTED SANDBOX RED — 4,513 passed / 2 failed / 19 ignored; only the two browser-spawn permission cases remain |
| Scoped check/lint/fmt | PASS — non-empty `stdout.bytes=303/349/298` |
| Lock integrity | PASS — SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

Hosted attempt 1 ran the PostgreSQL suite to 71 passed / 1 failed but timed out on the initial Rename
row before the first instrumentation placement, so it emitted no structured marker. The one commit
is being amended to install immediately after page load and diagnose both row assertions.

### Instrumentation gate delta

| Gate | Result |
| --- | --- |
| Focused source-contract test | PASS — 1 passed / 0 failed |
| Full focused module test | EXPECTED SANDBOX RED — 23 passed / 2 failed; only the known executable permission cases |
| Scoped check/lint/fmt | PASS — non-empty `stdout.bytes=303/349/298` |
| Quality/architecture | PASS — `quality:gate` exited 0 |
| Lock integrity | PASS — SHA-256 remains `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` |

## Open Questions

The hosted payload must decide the cause. Any result pointing at Fresh island hydration or the query
provider is a rescope stop; inferred causes are not accepted.

## Drift and Debt

- Drift: the named help test was already green at the follow-up baseline because it loosely checked
  the flag and description separately; the expectation was tightened to the complete rendered
  option line as requested. No scope expansion resulted.
- Debt: no new or deepened doctrine debt identified.

## Commits

- See the PR commit list and the per-slice evidence comment after push.
