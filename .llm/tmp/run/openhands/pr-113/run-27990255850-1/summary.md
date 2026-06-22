# IMPL-EVAL Summary — PR #113 (alpha-1 deprecation-shim removal)

## Summary

Independent evaluator pass on PR #113 (branch `chore/alpha1-jsr-shim-removal` @ `11e946e3`, base `main` @ `47a7ccfb`). Evaluated three committed slices: S1 (Tier-1 shims: cli aliases, database `buildConnectionString`/`mssqlJsonExtension`, telemetry context/job), S2 (Tier-2 options: mssql `trustedConnection`, fresh `serveStaticFiles`/`registerFsRoutes`), and S3a (saga legacy runtime removal). S3b (workers `.schedule()`) was correctly deferred and confirmed untouched.

## Changes (verified in diff)

- **S1 `873cfd93`**: Removed 8 cli `windows.ts` aliases + 3-line `V8_HEAP_MB→DEFAULT_V8_HEAP_MB` fold at `v8-profiles.ts`. Removed `buildConnectionString` export and `mssqlJsonExtension` adapter. Removed `telemetry/context/job.ts` shim.
- **S2 `689d47b8`**: Removed `trustedConnection` option (mssql adapter). Removed `serveStaticFiles` and `registerFsRoutes` options (fresh package).
- **S3a `11e946e3`**: Deleted `saga-bus-legacy.ts` + legacy saga-runtime branches/barrels. Removed 1 legacy-adapter test that constructed the now-deleted `SagaBusLegacy`. Updated `docs/site/reference/sagas/index.md`. Appended arch-debt entry `CRON-SUBSYSTEM-DUP` (correctly scoped to `plugin-workers-core`+`plugin-triggers-core`).

## Validation (independent re-runs)

| Gate | Files | Result |
|------|-------|--------|
| `deno check` (repo) | 905 | 0 errors |
| `deno lint` (scoped) | 339 | 0 errors |
| `deno fmt --check` (scoped) | 342 | 0 errors |
| `deno doc --lint` × 5 touched packages | 5 | all PASS |
| `deno task --cwd cli test` | 147 | 147 PASS |
| `deno task --cwd database test` | 5 | 5 PASS |
| `deno task --cwd telemetry test` | 12 | 12 PASS |
| `deno task --cwd fresh test` | 141 | 141 PASS |
| `deno task --cwd plugin-sagas-core test` | 28 | 28 PASS |
| `deno task --cwd plugins/sagas test` | 37 | 37 PASS |
| `deno task arch:check` | all | 0 FAIL (pre-existing INFO/WARN only) |
| `deno task publish:dry-run` | all | exit 0 |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | 11 gates | 10 PASS / 1 FAIL (`database.init`) |

**E2E `database.init` FAIL**: Confirmed pre-existing — identical failure on base commit `47a7ccfb` (exit 1). Environmental Docker/Prisma setup, **not caused by PR-B**.

**Consumer/grep proofs**: zero live consumers for every removed symbol across `templates/`, `docs/`, scaffold assets, `packages/*/`, `plugins/*/`, and source tree. S3b NOT touched (`.schedule()` + `@deprecated` intact).

**Test-removal scrutiny**: `saga-idempotency_test.ts` — only the legacy-adapter test removed (constructed deleted `SagaBusLegacy`). Native idempotency coverage retained. **PASS**.

**Hygiene**: 0 new `as` casts, 0 `deno.lock` churn, `CRON-SUBSYSTEM-DUP` debt entry present & correctly scoped.

## Responses to review comments / issue comments

**Evaluator verdict**: **`FAIL_DEBT`** (conditional PASS with documented violations recorded as arch-debt).

All technical gates pass green. Two bounded violations recorded as arch-debt that do not block merge:

1. **DEBT-1: Version-bump deviation.** plan.md required per-package minor bump (`0.0.1-alpha.0` → `0.1.0-alpha.0`) for breaking changes. Worklog deferred this to JSR-publish prep. Acceptable because: no published JSR consumers exist, breaking changes documented in PR body ("BREAKING alpha-1, zero-compat"), lockstep invariant maintained, deferred with explicit follow-up commitment.
2. **DEBT-2: Pre-existing E2E `database.init` failure.** Identical on base commit `47a7ccfb`. Not caused by PR-B; record for CI team.

**Merge recommendation**: Land PR-B as-is. Resolve DEBT-1 at JSR-publish prep with single commit bumping `cli`, `database`, `telemetry`, `fresh`, `plugin-sagas-core` to `0.1.0-alpha.0`. Resolve DEBT-2 separately (CI environment).

## Remaining risks

- **Version timing**: If JSR-publish prep stalls, the undocumented breaking change could confuse downstream consumers (low probability — lockstep `0.0.1-alpha.0` has no published consumers yet).
- **E2E `database.init`**: Environmental regression could mask future PR breakages if unattended; recommend dedicated CI fix.
- **S3b deferred surface**: Workers `.schedule()` + triggers `defineScheduledTrigger` remain as two parallel cron subsystems (arch-debt `CRON-SUBSYSTEM-DUP`). This PR correctly does NOT touch it; unification is a separate plan.
