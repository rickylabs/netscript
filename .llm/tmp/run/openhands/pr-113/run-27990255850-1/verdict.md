# IMPL-EVAL Verdict: PR #113 — alpha-1 deprecation-shim removal

**Verdict: `FAIL_DEBT`**  
**Evaluator**: OpenHands (run 27990255850)  
**Scope**: S1 (T1 shims) + S2 (T2 options) + S3a (saga legacy runtime)  
**S3b**: DEFERRED (workers `.schedule()`) — VERIFIED NOT TOUCHED

---

## Executive Summary

All independent gate re-runs pass. Consumer proofs clean. Test removal scope correct. One pre-existing E2E failure (database.init) is NOT caused by this PR. Two architectural debts recorded:

1. **Version-bump deviation**: plan.md required per-package minor bump; worklog deferred to JSR-prep. Acceptable given no published consumers.
2. **Pre-existing E2E failure**: `database.init` fails on base commit `47a7ccfb`. Environmental (Docker/Prisma), not PR-B regression.

**Merge-readiness**: Acceptable with documented debts. This PR is ready to land.

---

## Independent Verification Evidence

### 1. Gate Re-run (All PASS)

| Gate | Files | Result |
|------|-------|--------|
| `deno check` | 905 | 0 errors |
| `deno lint` | 339 | 0 errors |
| `deno fmt --check` | 342 | 0 errors |
| `deno doc --lint` (cli) | 1 | PASS |
| `deno doc --lint` (database) | 1 | PASS |
| `deno doc --lint` (telemetry) | 1 | PASS |
| `deno doc --lint` (fresh) | 1 | PASS |
| `deno doc --lint` (plugin-sagas-core) | 1 | PASS |
| `arch:check` | all | 0 FAIL (pre-existing WARN/INFO only) |
| `publish:dry-run` | all | exit 0 |

### 2. Per-Package Tests (All PASS)

| Package | Tests | Pass/Fail |
|---------|-------|-----------|
| packages/cli | 147 | 147 PASS |
| packages/database | 5 | 5 PASS |
| packages/telemetry | 12 | 12 PASS |
| packages/fresh | 141 | 141 PASS |
| packages/plugin-sagas-core | 28 | 28 PASS |
| plugins/sagas | 37 | 37 PASS |

### 3. E2E scaffold.runtime

```
Command: deno task e2e:cli run scaffold.runtime --cleanup --format pretty
Result: 10/11 gates PASSED, 1 FAILED
Failed gate: database.init (Initialize generated database)
Exit code: 1
```

**Critical finding**: Same failure observed on base commit `47a7ccfb` (pre-PR).  
**Conclusion**: Pre-existing environmental issue (Docker/Prisma setup in CI), NOT caused by PR-B.

### 4. Consumer/Grep Proofs (All Clean)

#### S1 — CLI Tier-1 Aliases
- `SERVY_CLI_PATH`, `WINDOWS_TARGET`, `WINDOWS_SERVICE_PREFIX`, `BUNDLE_EXTERNAL_PACKAGES`, `BUNDLE_EXTERNAL_IMPORTS`, `COMPILE_TIMEOUT_MS`, `BUNDLE_TIMEOUT_MS`, `V8_HEAP_MB`
- **Result**: 0 live consumers (only run-artifacts reference old names)
- `V8_HEAP_MB` fold to `DEFAULT_V8_HEAP_MB` correctly applied at `v8-profiles.ts:12,46,73`

#### S1 — Database Tier-1
- `buildConnectionString` → private adapter methods only (not deleted export)
- `mssqlJsonExtension` → 0 consumers
- **Result**: CLEAN

#### S1 — Telemetry Tier-1
- `packages/telemetry/src/context/job.ts` → 0 consumers
- **Result**: CLEAN

#### S2 — Fresh Tier-2 Options
- `trustedConnection` → 0 consumers (replaced by `authentication.type=ntlm`)
- `serveStaticFiles` → 0 consumers (replaced by `staticFiles`)
- `registerFsRoutes` → internal function only (not deleted option)
- **Result**: CLEAN

#### S3a — Saga Legacy Runtime
- `SagaBusLegacy`, `createSagaBusLegacy`, `saga-bus-legacy.ts`, `adapter: 'legacy'`
- **Result**: 0 consumers
- `docs/site/reference/sagas/index.md` updated to remove legacy references

#### S3b — Workers `.schedule()` (DEFERRED)
- **Git diff**: 0 files changed in `plugin-workers-core`, `plugin-triggers-core`, `cron`, `docs/site/capabilities/durable-sagas.md`, `docs/site/explanation/durability-model.md`
- `.schedule()` method and `@deprecated` tag intact
- **Result**: VERIFIED NOT TOUCHED

### 5. Test-Removal Scrutiny

**File**: `packages/plugin-sagas-core/tests/runtime/saga-idempotency_test.ts`

**Removed test** (1): Legacy-adapter test that constructed `SagaBusLegacy` (now deleted class)  
**Retained tests**: Native idempotency coverage (memory bus + native adapter)  
**Result**: PASS — only stale test removed, no regression

### 6. JSR Surface Integrity

- `deno doc --lint` PASS for all 5 touched packages
- `publish:dry-run` exit 0 (all JSR exports validate)
- **Result**: JSR surface intact

### 7. Hygiene (All PASS)

| Check | Result |
|-------|--------|
| New `as` casts | 0 (only 2 repo-accepted casts remain) |
| `deno.lock` churn | 0 changes |
| CRON-SUBSYSTEM-DUP arch-debt entry | Present, correctly scoped to `plugin-workers-core` + `plugin-triggers-core` |

---

## Architectural Debts

### DEBT-1: Version-Bump Deviation

**Violation**: plan.md §2 states:
> "Version policy: because this is alpha-1 pre-1.0 (0.x), breaking changes bump the **minor** per affected package (`0.Y.Z → 0.(Y+1).0`)"

**Actual**: All 5 touched packages remain at lockstep `0.0.1-alpha.0`.

**Worklog justification**: "Defer version bumps to JSR-publish prep; breaking documented in PR body."

**Ruling**: Acceptable as arch-debt because:
1. No published JSR consumers exist
2. Breaking changes documented in PR body under "BREAKING (alpha-1, zero-compat)"
3. Lockstep invariant maintained
4. Deferred to JSR-publish prep (documented in worklog)

**Recommendation**: Record as arch-debt; resolve at JSR-publish prep with single commit bumping all 5 packages to `0.1.0-alpha.0`.

### DEBT-2: Pre-Existing E2E Failure

**Failure**: `database.init` gate in `scaffold.runtime` suite  
**Scope**: Environmental (Docker/Prisma setup in CI)  
**Base commit**: Fails identically at `47a7ccfb`  
**Ruling**: Not PR-B regression; record as arch-debt for CI team.

---

## Findings Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Version-bump deviation | INFO | Recorded as arch-debt |
| 2 | Pre-existing E2E `database.init` failure | INFO | Not caused by PR-B |
| 3 | All static gates PASS | — | Green |
| 4 | All per-package tests PASS | — | Green |
| 5 | All consumer proofs CLEAN | — | Green |
| 6 | Test removal scope CORRECT | — | Green |
| 7 | S3b NOT touched | — | Green |
| 8 | JSR surface INTACT | — | Green |
| 9 | Hygiene PASS (casts, lock, debt) | — | Green |

---

## Verdict Rationale

PR-B meets all technical quality gates. The two `FAIL_DEBT` items are:

1. **Version-bump deviation** from plan.md — acceptable given no published consumers and breaking documented in PR body.
2. **Pre-existing E2E failure** — not caused by this PR's scope.

Neither blocks merge. This PR is **ready to land** with recorded debts.

---

## Post-Vendor Recommendation

1. **Land PR-B** as-is.
2. **Record DEBT-1** in arch-debt registry: "Alpha-1 version-bump deferred to JSR-publish prep."
3. **Resolve DEBT-1** at JSR-publish prep: single commit bumping `cli`, `database`, `telemetry`, `fresh`, `plugin-sagas-core` from `0.0.1-alpha.0` to `0.1.0-alpha.0`.
4. **Resolve DEBT-2** separately: fix `database.init` E2E gate in CI (Docker/Prisma env issue).

---

**Certifying authority**: OpenHands agent (run 27990255850)  
**Date**: 2026-06-23  
**Verdict**: `FAIL_DEBT` (conditional PASS with documented deviations)
