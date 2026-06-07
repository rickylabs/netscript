# Drift Log — feat-package-quality-wave2-adapters-2c--messaging

> Record every deviation from the locked combined `plan.md` (§ Sub-wave 2c),
> every subpath/folder rename, and every re-baseline finding here.

## Re-baseline drift (seed)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | Carried-in queue/cron doc-lint counts are stale | 2b drift measured queue 19+ / cron 5 doc-lint at base `ca4d9c4` on a partial sweep. 2a telemetry showed root-only (2) vs full-export sweep (168) divergence. | **RESOLVED**: Full export sweep at `55f6108` yields **queue 35**, **cron 16**. See `research.md` § MEASURE-FIRST for per-entrypoint breakdown. |
| 2026-06-07 | note | @db/redis migration is OUT OF SCOPE for 2c | 2b assessment recommended a dedicated future migration track (NOT Wave 2), gated behind a spike (kv → queue → sagas Streams). | queue keeps `npm:ioredis@^5` in `adapters/redis.adapter.ts`. No migration in 2c. Recorded as forward-looking opportunity only. |

## Carried-in decisions (from 2b drift "Decisions / renames")

| Item | Decision | Consumer impact |
|------|----------|-----------------|
| queue `interfaces/` → `ports/` | Rename now (alpha, no back-compat) | Zero external consumers of `@netscript/queue/types` |
| queue `utils/` → `validation/` | Rename folder (AP-16); `./validation` subpath name unchanged | None |
| queue `./types` subpath | Rename `./types` → `./ports` | Zero external consumers |
| cron `interfaces/` → `ports/` | Rename now (alpha, no back-compat) | Zero external consumers of `@netscript/cron/types` |
| cron `./types` subpath | Rename `./types` → `./ports` | plugins/triggers + plugins/workers import cron ROOT only — unaffected |
| `./testing` entrypoint | Required for queue + cron (multi-adapter units) | None — new entrypoints |

## Implementation drift — Sub-wave 2c

(append during plan + implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | Slice 1 rename split creates a planned transient static-check failure | The locked slice order separates queue folder renames (S1), export/task retargeting (S2), and internal import retargeting (S3). After S1 alone, `deno.json`, package imports, and tests still reference `interfaces/` and `utils/`. | Kept S1 scoped to `git mv` plus AP-16 debt closure. Static package checks are deferred to S2/S3 where the locked plan resolves the references; final gate must be green. |
| 2026-06-07 | note | queue folder vocabulary remediated | `packages/queue/interfaces/` moved to `packages/queue/ports/`; `packages/queue/utils/` moved to `packages/queue/validation/`. `ports/` contains 4 files and `validation/` contains 2 files. | AP-16 closed in `.llm/harness/debt/arch-debt.md` with `internal/` retained as F-11-allowed. |
| 2026-06-07 | note | Slice 4 full-export sweep found additional adapter JSDoc gaps | Hotspot runs matched the plan, but the combined full-export sweep also reported missing JSDoc on `redis.adapter.ts` and `amqp.adapter.ts` class members. | Treated as in-scope F-7 cleanup in S4; both adapters now document public and Deno-reported private class members. |
| 2026-06-07 | note | Slice 9 queue verification completed without code changes | `deno task publish:dry-run` reported `Success Dry run complete` with 0 slow types; full-export `deno doc --lint` sweep checked 20 queue entrypoints with no doc-lint errors. The doc command still emitted upstream npm/Fedify/@types resolution warnings. | Recorded as non-actionable upstream warnings because the command exited 0 and F-6/F-7 gates were clean. |
| 2026-06-07 | note | cron folder vocabulary remediated and AP-17 registry corrected | `packages/cron/interfaces/` moved to `packages/cron/ports/`; `ports/` contains exactly 3 files. `.llm/harness/debt/arch-debt.md` previously marked AP-17 closed on 2026-05-01 with unrelated CLI-permissions evidence while `interfaces/` still existed. | Corrected AP-17 status text to the real 2026-06-07 interfaces-to-ports remediation, replaced the public `./types` export with `./ports`, and retargeted cron imports/tests. |
| 2026-06-07 | note | Slice 10 cron lint surfaced a pre-existing banned `{}` type after the rename | `deno lint --config packages/cron/deno.json packages/cron` reported `ban-types` for `CronProvider = KnownCronProvider | (string & {})` in the renamed `ports/types.ts`. | Fixed in S10 as a gate-local cleanup by changing the branded custom-provider type to `string & Record<never, never>`. |
| 2026-06-07 | note | Slice 11 doc-lint count lower after S10 rename/lint cleanup | Locked research measured 16 cron doc-lint errors before S10. After the S10 rename and public-barrel retargeting, the full cron sweep reported 4 remaining missing-JSDoc errors, all on `SchedulerEventMap` fields. | S11 still fulfilled the locked F-7 goal by running the full root/adapters/ports sweep and reducing cron doc-lint to 0. |

## Decisions / renames

| Item | Decision | Rationale |
|------|----------|-----------|
| Cron `./testing` reuse vs duplicate | **Reuse** `MemoryCronAdapter` via `./testing` re-export barrel | Existing `adapters/memory.adapter.ts` already provides full `CronScheduler` + test helpers (`triggerAll`, `waitForExecutions`, etc.). Duplicating would violate DRY and inflate F-16 cardinality. |
| Queue `./testing` | **New** `MemoryQueueAdapter<T>` | No in-memory queue adapter exists today. Required for multi-adapter A2 archetype `./testing` port-contract entrypoint. |
| `_envelope.ts` / `_shared.ts` JSDoc obligation | **None** | Not exported from any barrel; underscore-private by convention. |

## PLAN-EVAL refinements (applied during evaluator session)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | Export/task enumeration completeness | queue `deno.json` also exports `./errors` → `./interfaces/errors.ts` and a `./validation` subpath → `./utils/mod.ts`; both `tasks.check` (queue + cron) reference renamed paths. Slice 2 originally named only `./types`→`./ports`. | Slice 2 expanded to retarget `./errors`→`./ports/errors.ts`, `./validation`→`./validation/mod.ts`, and `tasks.check`; cron slice 10 expanded to retarget `tasks.check` and point `./types`→`./ports/mod.ts` barrel. Caught by F-5/F-6/static gates regardless; no rework risk. |
| 2026-06-07 | note | Debt closure precision (AP-16) | F-11 allow-list permits `internal/` (`09-anti-patterns…md` §F-11; `05-folder-structure.md:29`), conflicting with handoff table `10-…:30` ("lift internal/ and utils/"). | Plan "Debt implications" updated: AP-16 closure scoped to `utils/`(+`interfaces/`); `internal/` retained as doctrine-allowed; doctrine-doc tension recorded. |
| 2026-06-07 | note | Debt registry error (AP-17 cron) | `arch-debt.md:82` marks cron AP-17 `closed 2026-05-01` with a CLI-permissions closure note, yet `packages/cron/interfaces/` still exists (rename never done). | Plan "Debt implications" updated: slice 10 must correct the erroneous closure, not close an already-closed entry. |

## Re-baseline drift (post-Research)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | Real doc-lint counts: queue 35, cron 16 | Full export sweep at `55f6108` (see `research.md`). Carried-in counts (19+/5) were under-counted because partial sweep missed `deno-kv.adapter.ts` (21 errors) and `scheduler.ts` (7 errors). | Plan slices 4 and 11 adjusted to real counts. No material rescope required — doc-lint fixes are mechanical (JSDoc + private-type-ref re-exports). |
