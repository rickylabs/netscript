# Context pack — chore-alpha1-jsr-shim-removal

PR-B (#113) alpha-1 JSR-readiness deprecation-shim removal, scoped by
`.llm/tmp/run/chore-alpha1-jsr-shim-removal/{plan.md,research.md,drift.md}` and PLAN-EVAL cycle 2
PASS (`openhands-run-27988081250-1`).

Implemented scope is S1 + S2 + S3a only:

- S1 Tier 1 aliases: CLI Windows constants aliases, database `buildConnectionString` /
  `mssqlJsonExtension`, and telemetry `context/job` shim removed. Pushed commit `873cfd93`.
- S2 Tier 2 options: MSSQL `trustedConnection` and Fresh `serveStaticFiles` / `registerFsRoutes`
  options removed in favor of canonical fields. Pushed commit `689d47b8`.
- S3a saga legacy: `SagaBusLegacy` adapter file, legacy runtime/preset option branches, plugin
  legacy runner/supervisor branches, legacy re-exports, stale docs, and the legacy adapter test were
  removed. The deferred cron architecture debt entry was appended to
  `.llm/harness/debt/arch-debt.md`.

Explicitly deferred / untouched:

- S3b workers `.schedule()` / `JobBuilder.schedule()` / `JobDefinition.schedule` /
  Scheduler plumbing / workers scaffold / `--schedule` CLI / `.schedule(...)` docs. The cron
  subsystem deferral is recorded as `CRON-SUBSYSTEM-DUP` in `.llm/harness/debt/arch-debt.md`.
- Root `deno.lock`; no `deno cache --reload`.
- Version files and changelogs. The repo remains lockstep `0.0.1-alpha.0`; drift notes record the
  tension with the plan's minor-bump language.

Gate evidence is recorded per slice in `worklog.md`. PR comments:

- S1: GitHub comment `4773861557`.
- S2: GitHub comment `4773909990`.
- S3a: pending until the final S3a push/comment.
