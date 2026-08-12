# Research — fix-1227-quickstart-restore-retry--impl

## Re-baseline

- Carried-in source: `.llm/runs/release-0.0.6-features--orchestration/slices/implement-1227.md`
- Re-derived against `origin/main` @ `7aa4aadfd` on 2026-08-12.
- The slice branch has one carried-brief commit (`afa53c603`) and no source changes.
- Current code is newer than the diagnosis detail that called `retry:` unused: `CommandGate` already
  executes the policy and `runtime.aspire-restore` is a consumer with focused tests.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `CommandGate` bounds configured retry attempts and records every `GateAttempt`. | `packages/cli/e2e/src/application/gates/command-gate.ts` |
| 2 | Runtime restore uses a 180,000 ms attempt timeout and `maxRetries: 2`. | `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` |
| 3 | Runtime restore has no explicit NuGet cache-seeding gate or command to mirror. | `rg -n "NUGET|nuget" packages/cli/e2e/src/application/gates` |
| 4 | Quickstart step 4 is a command gate around `aspire-walk.ts` but has no retry policy. | `packages/cli/e2e/suites/quickstart/quickstart-walk-suite.ts` |
| 5 | PGDATA verification reads its state file unconditionally, so an earlier setup abort cascades as `NotFound`. | `packages/cli/e2e/src/application/gates/quickstart/database-integrity-walk.ts` |
| 6 | Default `quality:scan` includes CLI source and nested E2E source, while `arch:check` doctrine-root discovery intentionally excludes nested `packages/cli/e2e`. | `deno.json`; doctrine F-19; verify during Gate phase with an explicit E2E scan |

## jsr-audit surface scan

- N/A: this slice changes the non-published nested CLI E2E harness only; no `mod.ts`, export map,
  JSDoc, package version, or dependency changes are planned.

## Open questions

- None. The issue brief locks mechanism, classes, attempt bound, teardown verdict, and validation.

