# Worklog — #1310

## Progress

| Date | Slice | Evidence |
| --- | --- | --- |
| 2026-08-05 | Research | live issue first; main mechanism and Aspire explicit-start surface verified |
| 2026-08-05 | Plan | D1–D6 locked; plan gate composed per milestone-run.md (orchestrator waiver) |

## Gates

Pending RED-first implementation.
## 2026-08-05 implementation

- Preserved the focused RED: the operation-runner test proved `aspire start` was still invoked for
  `db migrate`, violating resident ownership.
- Generated one explicit-start `netscript-db-<config>` executable per database in the resident
  AppHost and changed the CLI runner to start/observe/stop that resource.
- Removed generation and command-time materialization of the nested `aspire/db-operation` project.
- Reordered the scaffold runtime suite so connection-requiring DB gates follow resident startup.
- Strengthened quickstart step 5 to hold the resident PGDATA container identity constant through
  init/generate/seed and run read-only `pg_controldata` after teardown.
- Focused tests, scoped check/lint/fmt, quality:gate, CLI doc-lint, and CLI publish dry-run are green.
  The filter-wide test invocation exposed a pre-existing package-CWD failure in
  `quickstart-command-drift_test.ts`; the same test passes from repository root. One stale generator
  assertion was updated and its focused rerun is green.
