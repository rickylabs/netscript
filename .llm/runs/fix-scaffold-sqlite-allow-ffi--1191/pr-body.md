## Summary

Fix generated SQLite/libsql service commands so their Deno runtime receives the required FFI
permission, with semantic generator coverage, real scaffold RED/GREEN health evidence, a
cross-database permission audit, and the unblocked P2 DB measurement.

Do not merge until the composed milestone evaluation and final pre-merge gate are complete.

## Scope

- Archetype / area: Archetype 6 CLI scaffold emission; database-backed generated services
- SQLite/libsql service commands gain the runtime FFI permission at generation time; other database
  engines retain their existing permission sets.

Closes #1191

## Slices

- [x] S1 Lock research/design and open the draft review surface
- [x] S2 Capture RED; add semantic test; emit SQLite-only FFI
- [x] S3 Capture GREEN; append P2 evidence; finish gates and hygiene

## Validation

- Plan-Gate: composed per milestone-run.md (orchestrator waiver)
- Generated-output RED: SQLite expected one FFI flag and observed zero before the source fix; the
  same test passes after the fix.
- Helper generator suite: 18 tests / 164 steps passed.
- Scoped check, lint, and format: 22 helper files; zero findings.
- `quality:gate`: passed. CLI doc-lint: zero findings. CLI publish dry-run: passed with existing
  dynamic-import warnings only.
- Real scaffold RED: generated `users` resource Finished with exit code 1, populated Unhealthy
  `healthReports`, and libsql `NotCapable` evidence naming `--allow-ffi`.
- Same-scaffold GREEN: generated argv contains exactly one `--allow-ffi`; `users` is Running +
  Healthy with populated Healthy `healthReports`; `/health` returns HTTP 200; structured OTEL logs
  include the request trace.
- Resource hygiene: exact AppHost stop and leak-check passed with no slice-owned survivors; foreign
  containers were left untouched.
- Full `scaffold.runtime` was not started because the serialized milestone slot belongs to #1184;
  this PR completed its focused live scaffold/AppHost proof without overlap.

## Harness

- Run dir: `.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/`
- Phase: implementation complete; composed milestone evaluation pending

## Drift / Debt

- Authorized milestone PLAN-EVAL composition waiver recorded in `drift.md`.
- The mandated P2 script produced valid DB measurements but retained hardcoded no-DB classifier
  fields; the measurement and S4/S6 impact were reported without changing OMB contracts.

## Definition of Done

- [x] Generator emits `--allow-ffi` for SQLite/libsql-backed service commands at the command-builder seam.
- [x] A real fresh scaffold records exit-1/unhealthy RED before the fix and Running + Healthy GREEN with populated `healthReports` after it.
- [x] A generated-output test semantically covers the emitted permission set and demonstrates RED without the fix.
- [x] Postgres, MySQL, MSSQL, and no-database service command permissions are audited as unaffected or fixed, with evidence recorded here.
- [x] The fixed DB scaffold produces `P2-db.json`, and the OMB S4/S6 impact assessment is recorded on the owning epic.

```acceptance-evidence
issue: 1191
entries:
  - box-index: 1
    evidence: "packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts and focused generated-output test"
  - box-index: 2
    evidence: ".llm/runs/fix-scaffold-sqlite-allow-ffi--1191/proofs/red-runtime.json and green-runtime.json"
  - box-index: 3
    evidence: "packages/cli/src/kernel/templates/aspire/helpers/tests/generators-service-plugin_test.ts; RED exit 1 before fix, GREEN helper suite 18 tests / 164 steps"
  - box-index: 4
    evidence: "generated-output table proves none/Postgres/MySQL/MSSQL emit zero FFI and SQLite emits exactly one"
  - box-index: 5
    evidence: ".llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/P2-db.json and https://github.com/rickylabs/netscript/issues/1126#issuecomment-5172565198"
```
