# Drift — chore-alpha1-jsr-shim-removal

(append-only)

## 2026-06-22 — PLAN-EVAL cycle 1 (openhands-run-27986503722-1)

- **Plan premise drift:** S3 wholesale retirement claims
  `defineScheduledTrigger().enqueueJob(...)` is the canonical replacement for
  `defineJob().schedule(cron)`. Verified false against the tree:
  - `plugins/workers/deno.json` does not depend on `@netscript/plugin-triggers-core`.
  - The two cron subsystems run through separate runtime adapters (workers `Scheduler` →
    `@netscript/cron` vs triggers `CronTriggerSchedulerAdapter` → `@netscript/cron`) and have
    separate scaffolds (`job-scaffolders.ts:64-65` vs `trigger-scaffolders.ts:86-88`) and
    separate CLI flags (`workers-cli-backend.ts` `--schedule` vs `triggers-cli-backend-support.ts`
    `defineScheduledTrigger` inspection).
  - S3b (workers-side) wholesale removal would orphan the public `JobDefinition.schedule`
    field (re-exported via `packages/plugin-workers-core/src/public/mod.ts`), the
    `JobBuilder.schedule()` method, the in-process `Scheduler` class, the scaffold emission,
    and the documented `.schedule(...)` examples in
    `packages/plugin-workers-core/README.md:99` + `docs/recipes/adding-a-job.md:22`.
- **Documented public-surface gap:** `.schedule(cron)` referenced in
  `docs/site/capabilities/durable-sagas.md:191` and
  `docs/site/explanation/durability-model.md:105`; not in S3 file list.
- **No implementation drift** — no source edits performed during this cycle.
- **Lock hygiene preserved** — no `deno.lock` churn.
- Verdict artifact: `.llm/tmp/run/chore-alpha1-jsr-shim-removal/plan-eval.md`.
