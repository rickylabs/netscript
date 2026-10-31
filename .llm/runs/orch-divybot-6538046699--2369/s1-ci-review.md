**VERDICT: PASS.** The `provider-fixture.ts` fix is correct and no fixture models are lost. The commit still waits on the real provider conformance rerun passing.

- **What is kept.** The command-store fixture declares, in order: generator, datasource, `Project`, `NetScriptCommandReceipt`, `NetScriptCommandAudit`, then `NetScriptCommandOutbox` last. Cutting the text at `model NetScriptCommandOutbox {` keeps everything before it and drops only the duplicate outbox model.
- **Why it's safe.** The outbox model now comes from the shipped `sagas.prisma`, and it is the same model as the fixture's. The generated Prisma client is unchanged, and the fixture database is still built from the fixture `migration.sql` through psql, so it keeps its CHECK constraints.
- **Nothing else has the problem.** No other test combines the fixture schema with `sagas.prisma`. `prisma-saga-store_integration_test.ts` and `prisma-saga-store_test.ts` use only the shipped fragment plus their own generator and datasource header. The install helper reads the fixture model only for adoption mode, which the S1 deduplication already covers.

One optional hardening, not a blocker: if the marker ever disappears from the fixture, `indexOf` returns -1 and `slice(0, -1)` silently cuts the last character. That would break the schema loudly, but an explicit "marker not found" error would make the cause obvious.

VERDICT: PASS
