# Independent S1 implementation review — round 2

Requested/observed model: claude-opus-5-5, high effort, same independent Anthropic session, read-only tools and stdin closed. Exact pushed-head final verdict follows in the PR timeline and excluded final publication handoff so recording it does not change the reviewed commit.

**IMPL-EVAL round 2 for #2382 (S1 code review): VERDICT: PASS. You can commit and push this slice.**

**Round 1 blocker: fixed**
- **Table definition:** `postgres-conformance.ts.template:138` now creates `saga_instances` with `status varchar(20) NOT NULL DEFAULT 'running'`. That matches the Prisma client built from the current `sagas.prisma` (`provider-fixture.ts:81`), so the projection upsert and `findUniqueOrThrow` no longer hit a missing column.
- **New assertions:** `row.status` and `next.status` are checked against `'running'` (lines 159 and 184), next to the existing versioned-JSON checks. That ties the column the writer sets to the status inside the JSON on a real PostgreSQL write path.
- **Scope:** the template is on the allowed write list (`supervisor.md:32`) and the change is test-only.
- **No other affected fixtures:** a repo-wide search finds no other hand-made `saga_instances` table. Other fakes are unaffected: `runner-prisma-client.ts` takes any upsert arguments, and the zod schema in `instance-read_test.ts` silently drops extra keys.

**Regex concern from round 1: fixed**
- `saga-status-upgrade.ts:66-68,105` now checks `information_schema` before and after the upgrade. The column must be missing before the migration and present after it. If the old-schema regexes in `saga-command-postgres_test.ts:71-73` stop matching, the test now fails instead of quietly passing a SQL-only migration.

**S1 sign-off**
- Status is written on both create and update.
- List and count filter only on the status column.
- When the column is present it wins, and old flat rows without it still read correctly.
- The migration file backfills in the agreed order, leaves business JSON, ids, versions and timestamps untouched, and installs its constraint conditionally.
- It is declared in the manifest, and the real-PostgreSQL upgrade test runs in the `command-postgres` CI job this PR triggers.
- The regression tests and negative controls cover the parity, old-row and backfill failure cases.
- The scope and the run records match the approved plan.

**Still outstanding (not code blockers)**
- The scoped check/lint/fmt results for this repair are not recorded yet. Record them in `validation-summary.json` before committing. If any of them fails, this sign-off no longer applies.
- The 3 PostgreSQL cases are skipped locally, and `SAGA_STATUS_NEGATIVE_CONTROL` has not been run. All of these remain unproven until the native `command-postgres` CI job is seen green.
- The `scaffold.runtime` E2E verdict from coordinator CI is still required before merge.

This sign-off covers the S1 code before commit. It is not permission to merge. The final review of the exact pushed commit happens after the PR is marked ready.

VERDICT: PASS
