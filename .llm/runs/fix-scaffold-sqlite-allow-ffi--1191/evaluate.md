# IMPL-EVAL — fix-scaffold-sqlite-allow-ffi--1191

**Phase:** IMPL-EVAL
**Evaluator:** OpenHands cloud (independent session)
**PR:** #1192
**Issue:** #1191
**Branch:** `fix/scaffold-sqlite-allow-ffi`
**Baseline:** `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` (`origin/main`)

## Verdict

**PASS**

All five Definition-of-Done boxes are supported by the diff and tracked evidence.

## Gate Results

### Box 1: Generator emits `--allow-ffi` for SQLite/libsql-backed service commands — PASS

**Evidence:** `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts`

- `withRequiredServicePermissions()` (lines 31–38) adds `--allow-ffi` only when
  `databaseEngine === 'Sqlite'` AND the permission is not already present (de-duplication).
- `generateRegisterServices()` (line 49) destructures `databaseEngine` from options.
- Both `entryPermissions` and `defaultPermissions` paths are covered (lines 59–64): explicit
  service-level permissions are augmented, and when no explicit permissions exist the defaults are
  augmented instead.
- The pipeline (`helpers-generator-pipeline.ts`, lines 95–97) correctly derives `databaseEngine`
  from `config.PrimaryDatabase` → `config.Databases[config.PrimaryDatabase]?.Engine`.
- `RegisterServicesOptions.databaseEngine` typed as `DatabaseEntry['Engine']` (optional) in
  `types.ts` — no API break.
- **No broadening:** The predicate is strictly `=== 'Sqlite'`. All other engine values
  (`undefined`, `'Postgres'`, `'Mysql'`, `'Mssql'`) pass through unchanged.

### Box 2: Real fresh scaffold RED/GREEN health evidence — PASS

**Evidence:** `proofs/red-runtime.json` and `proofs/green-runtime.json`

RED:
- `scaffold.kind: "local-source"`, `database: "sqlite"`, `service: "users"` ✓
- `state: "Finished"`, `exitCode: 1` ✓
- `healthStatus: "Unhealthy"`, `healthReportsPopulated: true` ✓
- `cause.error: "NotCapable"`, `cause.message` names `--allow-ffi` ✓
- Args array: missing `--allow-ffi` ✓

GREEN:
- `sameScaffoldAsRed: true` ✓
- `state: "Running"`, `healthStatus: "Healthy"` ✓
- `healthReportsPopulated: true`, populated `healthReports` object with `"Healthy"` status ✓
- Args array: includes `--allow-ffi` exactly once ✓
- HTTP health: `status: 200`, `bodyStatus: "healthy"` ✓
- OTEL: three records (`Service listening`, `HTTP request started`, `HTTP request completed`),
  `requestTraceId` present ✓
- Cleanup: all four booleans true ✓

**Note:** No additional AppHost was started; #1184 owns the serialized full runtime slot. The
evidence was captured during the implementation run's single serialized live session.

### Box 3: Semantic generated-output test covers permission set and demonstrates RED — PASS

**Evidence:** `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts`

- Test `'should emit FFI permission only for SQLite-backed service commands'` (lines 130–147):
  iterates `[undefined, 'Postgres', 'Mysql', 'Mssql', 'Sqlite']`, asserts exactly 1 FFI emission
  for SQLite and 0 for all others. This is a semantic output test — would fail without the source
  fix (zero FFI emissions for SQLite).
- Test `'should preserve explicit service permissions while requiring SQLite FFI once'` (lines
  149–163): verifies de-duplication when `--allow-ffi` is already in explicit permissions.
- **Independent validation:** Evaluator ran `deno test -A --unstable-kv` on the test file — 2 tests
  (32 steps), all passing.
- **RED without fix:** The worklog records the focused generated-output test exited 1 before the
  source fix (expected 1 FFI flag, observed 0). The test structure directly calls
  `generateRegisterServices()` and checks output regex matches — removing `withRequiredServicePermissions`
  would cause the SQLite assertion to fail.

### Box 4: Postgres, MySQL, MSSQL, and no-database service command permissions audited — PASS

**Evidence:** Same semantic test (Box 3) — the five-engine audit table.

- `undefined` (no database): 0 FFI emissions ✓
- `'Postgres'`: 0 FFI emissions ✓
- `'Mysql'`: 0 FFI emissions ✓
- `'Mssql'`: 0 FFI emissions ✓
- `'Sqlite'`: 1 FFI emission ✓

The predicate in `withRequiredServicePermissions()` is a strict equality check against `'Sqlite'`,
so all other engine values are provably unaffected.

### Box 5: P2-db.json and S4/S6 impact assessment — PASS with finding

**Evidence:** `../test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-db.json` (180,871 bytes)

- `operationCount: 6`, `compactUtf8Bytes: 32414`, `sha256` matches green-runtime.json ✓
- Six operations with full request/response/error views, limits, and violations ✓
- Numeric measurements substantiate the S4/S6 impact assessment ✓
- **Finding:** `scaffold: "no-db"` classifier field is stale — the scaffold is SQLite-backed.
  This is explicitly recorded in `drift.md` as a significant deferred finding (P2 script hardcodes
  no-DB classifier fields). The measurement payload remains valid; classifier metadata fix is
  deferred to orchestrator.

## Additional Checks

### Lock Hygiene — PASS
- `git diff origin/main...HEAD -- deno.lock` is empty. No lock churn.

### Leak Hygiene — PASS
- `leak-report.md`: four foreign containers, all correctly identified as `foreign` ownership
  (`ns005-sagas`, `wave4-deepseek-004`). None are slice-owned; all left untouched per protocol.

### Scoped Wrappers / Quality Gate / Doc-Lint / Publish Dry-Run — PASS (recorded)
- Helper suite: 18 tests / 164 steps passed (worklog; independent run confirmed 2 tests / 32 steps)
- Scoped check/lint/fmt: 22 files, zero findings
- `quality:gate`: passed
- CLI doc-lint: zero findings
- CLI publish dry-run: passed with existing dynamic-import warnings only

### Archetype 6 Boundary — PASS
- Changes are confined to CLI helper generator internals (no public API, no export surface change)
- No new spine abstracts, layer-2 abstractions, or feature catalog entries
- No new port; generator is pure and receives config through existing options

## Findings

| # | Severity | Finding |
|---|----------|---------|
| F1 | significant (deferred) | P2-db.json `scaffold: "no-db"` classifier is stale for the SQLite scaffold. Measurement payload is valid. Fix deferred to orchestrator per drift.md. |

No blocking findings. The single deferred finding (F1) is explicitly logged, does not affect the
five DoD boxes, and is owned by the epic orchestrator for disposition.

## Conclusion

The implementation correctly and narrowly fixes the SQLite/libsql service FFI permission emission
at the command-builder seam. The semantic test provides comprehensive five-engine coverage with
demonstrated RED without the fix. Real scaffold evidence proves the runtime behavior change from
exit-1/Unhealthy to Running/Healthy with populated health reports, HTTP 200, and OTEL traces. All
supporting gates pass. The PR satisfies its Definition of Done.

OPENHANDS_VERDICT: PASS
