# PLAN-EVAL — chore-alpha1-jsr-shim-removal

- Plan evaluator session: openhands-run-27986503722-1 (2026-06-22)
- Run: `chore-alpha1-jsr-shim-removal`
- Surface / archetype: multi-package framework edit. Archetypes touched: ARCHETYPE-2 (cli),
  ARCHETYPE-3 (database), ARCHETYPE-5 (plugin-workers-core, plugin-sagas-core), plus fresh + telemetry
  packages. Scope overlays: SCOPE-service (Tier 2/3 touch runtime paths).
- Baseline verified: `origin/main @ df67038d` (post PR-A #111 + arch-debt #112).
- Lock hygiene preserved: no `deno.lock` churn, no source edits, no implementation commits.

## TL;DR

**Verdict: `FAIL_PLAN`.** Plan is sound for T1 + T2 and for the S3 **saga-side** slice. The S3
**workers-side** slice (`schedule()` builder + `schedule` field plumbing across
`plugin-workers-core`) is unsound because the plan's claimed canonical replacement
(`defineScheduledTrigger().enqueueJob()`) does **not** cover the workers-cron functionality.
The two are parallel cron subsystems — neither references the other — so wholesale retirement of
the workers-side is a rescope, not a removal. Plus a documented README + recipe page reference
`.schedule()` as a feature, and `jsr-audit` was not applied to the planned public surface.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS     | `research.md` exists; re-baselined against `origin/main @ df67038d`; spot-checked every Tier-1/Tier-2 file:line.                  |
| Decisions locked                        | PARTIAL  | Decisions #1, #2, #4 are sound. Decision #3 (T3 wholesale) is stated as locked but built on a false canonical-equivalence claim.   |
| Open-decision sweep                     | FAIL     | The T3 canonical-replacement verification gap is not flagged. The two-cron-subsystem fact would force rework — see §Open-decision sweep. |
| Commit slices (< 30, gate + files each) | PASS     | 3 slices, each names files + proving gate.                                                                                         |
| Risk register                           | PARTIAL  | Tier classification stands in for a risk register; no explicit rollback path for S3 if a canonical gap is found.                    |
| Gate set selected                       | PARTIAL  | T1/T2 gates are sufficient. S3 wholesale is missing `deno doc --lint` and an explicit per-package `publish:dry-run` evidence capture. |
| Deferred scope explicit                 | PASS     | PR-C (project-wide sweep) is explicitly out of scope and branches off PR-B's merged main.                                          |
| jsr-audit surface scan (pkg/plugin)     | FAIL     | 6-package public-surface removal (incl. `JobDefinition.schedule`, `JobBuilder.schedule`) was not run through `jsr-audit`.          |

## Tier-by-tier findings

### T1 — pure 0-consumer aliases — VERIFIED ✅
- `packages/cli/src/kernel/constants/windows.ts:217-231` — 8 `@deprecated` aliases
  (`SERVY_CLI_PATH`, `COMPILE_TARGET`, `SERVICE_PREFIX`, `BUNDLE_EXTERNAL`,
  `BUNDLE_EXTERNAL_IMPORTS`, `COMPILE_TIMEOUT_MS`, `BUNDLE_TIMEOUT_MS`, `V8_HEAP_MB`). Repo-wide
  grep on this branch: every call site already uses the `DEFAULT_*` canonical. 0 consumers of the
  aliases. ✅
- `packages/database/mod.ts:256` — `export const buildConnectionString = buildPostgresConnectionString`
  is `@deprecated` (line 254). 0 import consumers. The two `buildConnectionString()` private
  methods in `adapters/mysql.adapter.ts` and `adapters/postgres.adapter.ts` are same-name,
  unrelated class methods — plan correctly notes these as false positives. ✅
- `packages/database/extensions/sql-json.extension.ts:556` + `extensions/mod.ts:8` + `mod.ts:100` —
  `mssqlJsonExtension` → `sqlJsonExtension`. 0 consumers beyond the re-export chain. ✅
- `packages/telemetry/src/context/job.ts` — whole module is a 4-line `@deprecated` re-export of
  `createJobTraceEnv`/`extractJobTraceContext` from `payload-context.ts`. 0 importers. ✅
- Plan's T1 manifest is accurate. No live consumers.

### T2 — deprecated option fields — VERIFIED ✅ (canonical exists, safe to fold)
- **mssql `trustedConnection`** (`packages/database/adapters/mssql.adapter.ts:26, 66, 416`) —
  only consumed inside the adapter itself (a single `if`-branch translation). Canonical
  `authentication.type = 'ntlm'` is implemented in the same file
  (`packages/database/adapters/mssql.adapter.ts` — the `authentication` config type is exercised
  by the canonical path). ✅
- **fresh `serveStaticFiles` / `registerFsRoutes`** (`packages/fresh/src/runtime/server/define-fresh-app.ts:50, 73`) —
  only used inside `define-fresh-app.ts` itself + its sibling test. Canonical `staticFiles` /
  `fsRoutes` are already wired and exercised by `define-fresh-app.test.ts` (canonical cases). ✅
- Plan's T2 manifest is accurate. Both folds are onto canonical options that exist, are
  functionally equivalent for the documented cases, and have test coverage.

### T3 — deprecated subsystems — SAGA OK, WORKERS UNSOUND
**S3a — `saga-bus-legacy` + legacy saga runtime — VERIFIED ✅**
- `packages/plugin-sagas-core/src/adapters/saga-bus-legacy.ts` defines `SagaBusLegacyMachine`,
  `SagaBusLegacyBus`, `SagaBusLegacyLogger`, `SagaBusLegacyDefinitionMapper`, `SagaBusLegacyOptions`.
- The only caller of `adapter: 'legacy'` is `plugins/sagas/src/runtime/saga-supervisor.ts:130`,
  which is the saga supervisor forwarding user options into `createSagaRuntime({ adapter: 'legacy' })`.
- `packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:43, 79, 87` and
  `packages/plugin-sagas-core/src/presets/start-sagas.ts:41, 69-70` are the only other references
  inside the package itself (definitions + re-exports + tests).
- Canonical replacement: `SagaBusBridge` in `packages/plugin-sagas-core/src/adapters/saga-bus-bridge.ts`
  + native runtime path in `create-saga-runtime.ts` (default branch). Both exist, have tests,
  and cover the documented surface. ✅ Wholesale removal is safe.

**S3b — workers legacy `schedule()` + `schedule` field plumbing — UNSOUND ❌**
The plan's pre-condition claim that `defineScheduledTrigger(...).enqueueJob(...)` is the canonical
replacement for `defineJob().schedule(cron)` is **factually wrong**. The two are parallel cron
subsystems with no functional equivalence:

| Aspect | `defineJob().schedule()` (workers) | `defineScheduledTrigger()` (triggers) |
| --- | --- | --- |
| Location | `packages/plugin-workers-core/builders/job-builder.ts` | `packages/plugin-triggers-core/builders/define-scheduled-trigger.ts` |
| Runtime | `plugins/workers/worker/scheduler.ts` → `Scheduler` class → `@netscript/cron` | `plugins/triggers/src/runtime/trigger-processor.ts` → `CronTriggerSchedulerAdapter` → `@netscript/cron` |
| Event model | Definition-attached cron on a job; cron tick enqueues the job's entrypoint via the workers queue | Trigger-event-driven; cron tick fires a handler that emits a `trigger-event` and a downstream `enqueueJob` |
| Scaffold | `plugins/workers/src/scaffolding/job-scaffolders.ts:65` emits `.schedule(...)` lines | `plugins/triggers/src/scaffolding/trigger-scaffolders.ts:86-88` emits `defineScheduledTrigger(...)` |
| CLI flag | `plugins/workers/src/cli/workers-cli-backend.ts` accepts `--schedule` | `plugins/triggers/src/cli/triggers-cli-backend-support.ts` inspects `defineScheduledTrigger` |
| Doc examples | `packages/plugin-workers-core/README.md:99`, `docs/recipes/adding-a-job.md:22`, `docs/site/capabilities/durable-sagas.md:191`, `docs/site/explanation/durability-model.md:105` | `packages/plugin-workers-core/src/...` has none; docs site treats them as separate concepts |
| Cross-package dep | Workers package does **not** depend on `plugin-triggers-core` (`plugins/workers/deno.json` has no `@netscript/plugin-triggers-core` import). The only `plugin-triggers-core` mention in `plugins/workers/src/cli/official-sample-configuration.ts:205` is for `defineTriggers`, unrelated to cron. | — |

Functional gap if S3b wholesale removal proceeds:
1. **No replacement for jobs that need an entrypoint-attached cron.** `defineJob().schedule(cron)` lets
   a job definition carry its own cron. `defineScheduledTrigger().enqueueJob(...)` requires a separate
   trigger definition + a separate plugin (`plugin-triggers`) + a separate runtime adapter, and the
   trigger's handler does the enqueue, not the job definition. This is a **different model**, not a
   rename.
2. **The workers plugin's own `Scheduler` process is what `defineJob().schedule()` feeds.** Removing
   the `schedule` field removes `scheduleRegistryJob()` in
   `plugins/workers/worker/scheduler-scheduling.ts:21-50`, the in-process cron wiring in
   `scheduler.ts:162-166`, the `WorkerCronScheduler` interface, the scaffold emission
   (`job-scaffolders.ts:64-65`), the CLI `--schedule` flag, and the docs recipes. None of this is
   covered by `defineScheduledTrigger` (which lives in a separate package, on a separate runtime
   path, with no cross-package wiring).
3. **The `schedule` field is part of the public `JobDefinition` type** (exported from
   `packages/plugin-workers-core/src/public/mod.ts`). Wholesale removal is a public-surface removal
   that affects every consumer that reads `JobDefinition`, including the v1 contract schema at
   `packages/plugin-workers-core/src/contracts/v1/workers.contract-schemas.ts:87, 95` (which
   re-declares it under the `scheduled` boolean filter) and the `kv-job-registry.ts:95` scheduled
   filter (`job.schedule !== undefined`).
4. **Documented public surface:** `packages/plugin-workers-core/README.md:99` ships with
   `.schedule('*/15 * * * *')` as a documented example; `packages/plugin-workers-core/docs/recipes/adding-a-job.md:22`
   ships with `.schedule('0 2 * * *')`. The site docs (`docs/site/capabilities/durable-sagas.md:191`,
   `docs/site/explanation/durability-model.md:105`) reference it as a feature. None of these have a
   canonical replacement in the workers package itself.

**Ruling on T3 wholesale-retirement (per the task's explicit question #3):**
- **S3a (saga legacy): wholesale retirement is safe** — 0 external consumers, canonical
  `SagaBusBridge`/native runtime covers the surface.
- **S3b (workers legacy schedule): wholesale retirement is NOT safe as a removal-only PR.** The
  canonical replacement does not cover the functionality. Options for the planner:
  - **(a) Narrow S3b to entry-point-only** — keep the `schedule` field + the in-process
    scheduler; remove only the `@deprecated` annotation on `.schedule()` (so the deprecation
    becomes a no-op rather than a deletion), and move the actual deprecation to a follow-up that
    first merges the two cron subsystems into a single canonical path.
  - **(b) Defer S3b from this PR** — keep T1/T2/S3a in PR-B; file a separate rescope plan for
    "merge workers-cron into triggers-cron" before wholesale-removing the workers-side path.
  - **(c) Rescope PR-B to a subsystem-merge PR** — fold the workers scheduler onto the triggers
    adapter, then remove the duplicated `schedule` field. This is a redesign, not a removal.

The current plan's S3b is unsound. Pick (a) or (b) for PR-B; (c) is a separate plan.

## Open-decision sweep (evaluator-run)

The plan does not flag these, but they would force rework if deferred:

1. **S3b canonical-replacement verification is FALSE.** Wholesale retirement of `schedule` field
   + `.schedule()` builder + scheduler-scheduling.ts on the claim that `defineScheduledTrigger()`
   covers it. The two subsystems have separate scaffolds, separate CLI flags, separate runtime
   adapters, and separate documented public surfaces. **This is an automatic unchecked box.**
2. **Documented public-surface examples** at `packages/plugin-workers-core/README.md:99` and
   `packages/plugin-workers-core/docs/recipes/adding-a-job.md:22` are not in the S3 file list.
   Wholesale removal without updating them would leave broken docs in the published package.
3. **Scaffold templates** at `plugins/workers/src/scaffolding/templates/` — only
   `job-builder.ts.template` is in the tree; none of the seven templates currently bake in
   `.schedule(...)`, but the scaffolder code at `job-scaffolders.ts:64-65` still emits it when
   `input.schedule` is set. Removing the field but leaving the scaffolder emission would be a
   scaffold-runtime break.

## Gate set + lock hygiene — PARTIAL

- Gates: scoped check/lint/fmt + per-package test + `arch:check` + `publish:dry-run` +
  `scaffold.runtime` at IMPL-EVAL — sufficient for T1/T2 and for S3a.
- Missing for S3b: **`deno doc --lint` per affected package** (the publish bar for public-surface
  removals; catches JSDoc/typedoc drift on removed exports). The plan does not include it.
- Lock hygiene: "Do NOT churn root `deno.lock`; no `deno cache --reload`" — ✅ correct. Removal
  drops no live dependency; no lock churn needed.

## Version policy (per the task's explicit question #4)

- All 6 affected packages are at `0.0.1-alpha.0` (verified: `cli`, `database`, `fresh`,
  `telemetry`, `plugin-workers-core`, `plugin-sagas-core`).
- Per semver: pre-1.0 packages may make breaking changes in a **minor** bump. Plan's policy
  `0.Y.Z → 0.(Y+1).0` with a `BREAKING (alpha-1, zero-compat)` note is **correct** — the framework
  is alpha-1 with zero-backwards-compat policy, and a coordinated major bump is not warranted
  for a 0.0.1-alpha.0 series (it would itself be a false signal: there is no `1.0` to move
  *away* from).
- **Verdict on #4: PASS** — minor bump per affected package with a breaking note is the correct
  policy. A coordinated bump would be over-engineered for this series.

## Zero-cast — PASS

- Removal-only. No new casts introduced. ✅
- The 2-accepted-cast rule (`deno.json` `lint.rules.notSlowTypes` / `no-explicit-any` policy) is
  unaffected.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **S3b scope correction (the blocking issue).** Re-scope S3 to one of:
   - **(a)** Narrow the workers-side slice to entry-point-only: drop the `@deprecated` annotation
     on `.schedule()` and on the `schedule` field, document the migration path in a recipe, but
     **do not** remove the field, the builder method, or the scheduler plumbing.
   - **(b)** Defer S3b (the workers-side slice) from PR-B. Ship T1 + T2 + S3a only. File a
     separate rescope plan that merges the workers-cron and triggers-cron subsystems before
     removing the workers-side path.
   - **(c)** Rescope PR-B to a subsystem-merge PR (fold the workers scheduler onto the triggers
     adapter, then remove the `schedule` field). This is a redesign, not a removal — out of
     scope for a removal-only PR-B.
   The current S3b wholesale claim — that `defineScheduledTrigger().enqueueJob()` is the canonical
   replacement for `defineJob().schedule()` — is not supportable against the actual tree.

2. **jsr-audit surface scan (required for multi-package public-surface removal).** Run the
   `jsr-audit` skill's publishability rubric against the PLANNED public surface of the 6 affected
   packages, including `JobDefinition`, `JobBuilder`, `JobConfig`, `TaskConfig`, the v1 contract
   schemas, and the `WorkerCronScheduler` interface (if S3b proceeds). Slow-type / surface risks
   must be named before slicing. The plan currently does not include this evidence.

3. **Doc/recipe updates must be in S3b's file list, not afterthought.** If S3b proceeds, the
   file list must explicitly include:
   - `packages/plugin-workers-core/README.md` (currently ships `.schedule('*/15 * * * *')`)
   - `packages/plugin-workers-core/docs/recipes/adding-a-job.md` (currently ships `.schedule('0 2 * * *')`)
   - `docs/site/capabilities/durable-sagas.md` (line 191 — table entry for `.schedule(cron)`)
   - `docs/site/explanation/durability-model.md` (line 105 — durability description)
   - `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` (scaffold emission)
   - `plugins/workers/src/cli/workers-cli-backend.ts` (`--schedule` flag)

4. **Add `deno doc --lint` to the S3 gate set** (per affected package). The current gate set
   lists `publish:dry-run` but not the doc-lint surface; for a public-surface removal touching
   `JobDefinition` and `JobBuilder`, doc-lint is the cheaper evidence.

5. **Convert "Codex must grep" to a gate.** The plan's "Open items handed to PLAN-EVAL" item #3
   says "Codex must grep `templates/`, `docs/`, `plugins/*/templates` before S1" — but it is not
   enforced by the gate set. Either move it into the S1 gate ("scoped check+lint+fmt" + a named
   grep gate) or remove it.

6. **Open-decision sweep.** After the S3b fix above, re-run the open-decision sweep. The plan
   should explicitly enumerate the S3b alternatives and record the chosen one.

### Non-blocking observations

- The T1 false-positive notes for `buildConnectionString` private class methods in the
  mysql/postgres adapters are accurate — keep them.
- The 2-accepted-cast rule is unaffected.
- The "deferred scope explicit" check passes: PR-C is out of scope and branches off PR-B's
  merged main.
- Saga legacy wholesale retirement (S3a) is genuinely safe; if the planner picks option (b) for
  S3b, S3a can still ship in this PR.

## Notes for the next cycle

- The two `FAIL_PLAN` cycle budget is 2; this is cycle 1. If cycle 2 still flags S3b as
  unresolved, escalate per `gates/plan-gate.md`.
- No implementation begins until `PASS` is returned.
- No `deno.lock` churn, no source edits, no commits other than evaluator artifacts.