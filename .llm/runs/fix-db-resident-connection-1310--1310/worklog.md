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

## Merge-readiness validation

- Full `scaffold.runtime` RED after the first implementation exposed invalid permission flags after
  `deno eval`; the generated dispatcher argv was corrected and its generator test now locks the
  accepted form.
- The next two full runtime runs proved the p0 sequence GREEN: a single resident AppHost started,
  then `database.init`, `database.generate`, and `database.seed` all passed. The suite subsequently
  failed at the unrelated `runtime.wait.workers-api` health gate after 120 seconds; cleanup passed.
- A same-shell live probe showed `db init` receiving the resident Postgres connection string and
  completing successfully through `netscript-db-postgres`, with no nested AppHost generation.
- `deno.lock` remains pre-existing, modified, and unstaged.

## Hosted merge gates

- Hosted SQLite runtime initially exposed that generated SQLite consumers entered the server-only
  Aspire `withReference` branch once the full resident graph was no longer short-circuited. Commit
  `91c4bae7b` makes services, plugin services, and background processors bind SQLite by file URL
  before considering the server-database reference branch; focused generator tests lock the order.
- On `91c4bae7b`, hosted quality, check-test, deps-report, static scaffold, PostgreSQL runtime, and
  SQLite runtime all passed. The acceptance mirror and review-thread gate passed, so the PR's final
  Definition-of-Done box was earned and checked before the close-gate retrigger push.
