## Summary

Fix generated SQLite/libsql service commands so their Deno runtime receives the required FFI
permission, with semantic generator coverage, real scaffold RED/GREEN health evidence, a
cross-database permission audit, and the unblocked P2 DB measurement.

Do not merge until the composed milestone evaluation and final pre-merge gate are complete.

## Scope

- Archetype / area: Archetype 6 CLI scaffold emission; database-backed generated services
- The closing keyword is intentionally withheld until every Definition of Done box is truthfully
  complete and evidenced.

## Slices

- [x] S1 Lock research/design and open the draft review surface
- [ ] S2 Capture RED; add semantic test; emit SQLite-only FFI
- [ ] S3 Capture GREEN; append P2 evidence; finish gates and hygiene

## Validation

- Plan-Gate: composed per milestone-run.md (orchestrator waiver)
- Focused/static/runtime/publish gates: pending implementation slices

## Harness

- Run dir: `.llm/runs/fix-scaffold-sqlite-allow-ffi--1191/`
- Phase: plan-eval — composed per milestone-run.md; implementation follows in this run

## Drift / Debt

- Authorized milestone PLAN-EVAL composition waiver recorded in `drift.md`.
- No new architecture debt planned.

## Definition of Done

- [ ] Generator emits `--allow-ffi` for SQLite/libsql-backed service commands at the command-builder seam.
- [ ] A real fresh scaffold records exit-1/unhealthy RED before the fix and Running + Healthy GREEN with populated `healthReports` after it.
- [ ] A generated-output test semantically covers the emitted permission set and demonstrates RED without the fix.
- [ ] Postgres, MySQL, MSSQL, and no-database service command permissions are audited as unaffected or fixed, with evidence recorded here.
- [ ] The fixed DB scaffold produces `P2-db.json`, and the OMB S4/S6 impact assessment is recorded on the owning epic.

```acceptance-evidence
issue: 1191
entries:
  - box-index: 1
    evidence: "pending S2"
  - box-index: 2
    evidence: "pending S2/S3 live scaffold evidence"
  - box-index: 3
    evidence: "pending S2 generated-output RED/GREEN test"
  - box-index: 4
    evidence: "pending S2 cross-engine permission audit"
  - box-index: 5
    evidence: "pending S3 P2-db.json and epic impact comment"
```
