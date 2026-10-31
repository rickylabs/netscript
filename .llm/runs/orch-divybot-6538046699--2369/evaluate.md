**VERDICT: MERGE.** The pushed head is ready on source and evidence, with no implementation blockers. Not proven here: the owner-reserved `scaffold.runtime` gate and the required CI checks. Both remain separate merge conditions.

**Head check**
- The remote branch points at `125a5902df43d6e692d8b3b4e4ecaace1a1a8a40`, and that commit descends from baseline `204a71b`. It contains five commits: plan, S1 install, S1 CI fixture repair, S2 retention, S3 docs.
- During the review the local working tree moved to a detached checkout of a newer main (`2f426b9`), apparently from another process. I evaluated the pushed commit from git objects only. The three newer main commits don't touch any file this PR owns.

**Against the #2369 acceptance**
- **The contribution owns fresh installs.**
  - `NetScriptCommandOutbox` is in `plugins/sagas/database/sagas.prisma` and matches the fixture model exactly.
  - The real PostgreSQL fresh-install test has no copied model, so the table can only come from the installed contribution. It matches the fixture's columns, the `command_outbox_due` index and all CHECK definitions.
  - Adoption runs as its own real-Postgres case: an equivalent copied model is deduplicated and the constraint SQL is safely re-run. A conflicting copy keeps the existing collision error.
- **The constraints are installed and applied before deploy.**
  - `command-outbox.migration.sql` is declared through `withMigrations`, published by `deno.json`, integrity-checked on JSR fetch, and copied by the existing schema-copy path.
  - The migration runner finds pending sidecars, adds `--create-only`, appends them to the new migration (or creates a SQL-only one), then deploys and checks status.
  - Recorded contributions are immutable, with a line-ending-normalised hash, and the constraint SQL guards each constraint so re-running is safe.
- **Retention is bounded and safe under races.**
  - Both families page by primary key with a limit of 1–100 and a cursor that keeps progressing.
  - Outbox: a row is deleted only if it is published or terminal, strictly older than the window, and has neither lease field set; the DELETE re-checks all of this. Pending and leased rows (including expired leases) are kept.
  - Replay markers: expiry starts only from terminal `completedAt` (or terminal `updatedAt`), never from marker creation. Pending, running and compensating sagas, plus missing or malformed state, are kept.
  - Candidate parents are locked in order with `SKIP LOCKED`, fresh metadata and version are re-checked, and the DELETE matches exact envelope text.
  - Mixed group policies use a per-saga map with a seven-day default; the outbox window is the largest configured window unless set explicitly.
  - Nine real-PostgreSQL retention tests pass, and twelve guard-removal controls each failed their test as expected.
- **Production engine path untouched.** `saga-engine.ts` isn't in the diff, and there's no `deno.lock` churn.
- **No private information.** I scanned the added lines, including the run directory, and found no hostnames, operator paths, ports, session IDs or secrets. The test connection string uses a socket from an environment variable.
- **Docs.** The `plugin-sagas-core`, `database` and `service` references plus the READMEs and changelogs describe the schema contribution, the migration flow, the retention API, the group map, cursor persistence and canonical-state lifetime.
- **Gate evidence recorded in the run.** The local gates pass: structured check/lint/format, quality and architecture, JSR audits and dry runs, all 475 JSDoc examples, and the docs exports and freshness checks. Doc-lint is not fully green: the 7 saga-core and 30 saga-plugin findings are identical to those on an isolated main checkout and are recorded as inherited. Database doc-lint is clean.

**Still required, and not certified by me**
- The `scaffold.runtime` e2e-cli verdict. This PR changes plugin scaffold output, so READY must ask the coordinator to arm the `e2e-cli-gate` label. It must not be run locally or reported as proven.
- The required CI checks once the PR leaves draft, including `command-postgres` at this head.
- The committed-corpus regression that was still running at review time; record its result.

VERDICT: MERGE 125a5902df43d6e692d8b3b4e4ecaace1a1a8a40
