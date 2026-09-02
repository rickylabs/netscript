# Research — fix-readiness-fixture-app-identifier-collision--1898

## Re-baseline

- Carried-in source: issue #1898 and `implement.md`.
- Re-derived against `main` @ `7d18ef104824734932b5eac247637f4b9c770579` on 2026-09-01.
- The worktree matches the dispatched baseline. The only initial untracked files were the owner-staged
  run brief and Codex thread identity under this run directory.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `generateRegisterApps` names each block root `app_<position>` and derives `_workdir` and `_otel` bindings from it. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts` |
| 2 | `injectReadinessFixtureApps` generates fixture apps in isolation, slices their blocks, and inserts them into a separately generated host module. | `packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts` |
| 3 | Existing coverage uses an empty host, so it cannot expose a collision with the fixture generator's index-zero binding. | `packages/cli/e2e/tests/application/gates/prepare-readiness-fixture_test.ts` |
| 4 | The nested `packages/cli/e2e` workspace is the CLI-owned harness, not an independently published doctrine root. | Doctrine 06 Archetype 6; doctrine 09 F-19; doctrine 10 verdict denominator |

## jsr-audit surface scan

N/A. This slice changes no published entrypoint, export, JSDoc contract, dependency, or package
configuration; it is confined to the CLI E2E harness.

## Open questions

None. The fixture-specific namespace rewrite is locked; changing the positional generator is out of
scope and would require stopping the run.
