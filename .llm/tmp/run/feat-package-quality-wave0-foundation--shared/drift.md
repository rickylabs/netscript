# Drift Log: S1 / Wave 0 Foundation (@netscript/shared)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine,
or current-state documentation.

## 2026-06-05 — Doctrine file path mismatch

- **What:** The `netscript-doctrine` skill points to `.llm/research/architecture-doctrine-docs-v2/doctrine/`, but this worktree stores the required doctrine files under `docs/architecture/doctrine/`.
- **Source:** Failed `Get-Content .llm/research/...`; successful listing of `docs/architecture/doctrine/01..10`.
- **Expected:** Skill path would match the in-repo doctrine location.
- **Actual:** The required reading path from the user is the valid one in this worktree.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `docs/architecture/doctrine/{01..10}.md`.

## 2026-06-05 — Release readiness detail layout differs from stale references

- **What:** `release-readiness.ts --out ./audit --include-plugins` generated `./audit/_summary.md`, but the listed JSON detail files were not present after the run.
- **Source:** `Get-ChildItem audit -Recurse -File` after the baseline command.
- **Expected:** Stale docs reference `audit/readiness/{jsr,doctrine,standards}/packages__shared.json` and the current summary lists `./audit/{jsr,doctrine,standards}/packages__shared.json`.
- **Actual:** Only `./audit/_summary.md` exists in this worktree after the baseline run.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `./audit/_summary.md`.

## 2026-06-05 — Current package metadata differs from stale package facts

- **What:** The stale `evaluate_shared.md` says `@netscript/shared` is version `1.0.0`; current `packages/shared/deno.json` is already `0.0.1-alpha.0`.
- **Source:** `packages/shared/deno.json`.
- **Expected:** Stale facts might show version drift requiring a pin.
- **Actual:** Version is already pinned to the alpha lockstep value.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `packages/shared/deno.json`.

## 2026-06-05 — Physical `utils/` deletion is blocked by later-wave consumers

- **What:** `plugins/sagas` and `plugins/workers` still map `@shared/utils` to `../../packages/shared/utils/mod.ts`; deleting `packages/shared/utils/` in Wave 0 would require plugin edits outside the allowed surface and break the final workspace check.
- **Source:** Consumer scan over `packages/` and `plugins/`; plugin `deno.json` import maps.
- **Expected:** `plan_shared.md` proposes migrating the `utils/` grab-bag into doctrine role folders and deleting generic folder vocabulary.
- **Actual:** Published `./utils` can be removed from `@netscript/shared`, but physical deletion must wait for later-wave consumer migration or an explicit rescope.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `plugins/sagas/deno.json`, `plugins/workers/deno.json`, imports of `notFound` from `@shared/utils`.

## 2026-06-05 — Exact root standards command is broader than Wave 0 package scope

- **What:** `deno run --allow-read tools/fitness/check-netscript-standards.ts` without `--root packages/shared` checks the repository root and fails on root `deno.json` package metadata plus unrelated whole-tree warnings.
- **Source:** Final gate run after package implementation.
- **Expected:** The Wave 0 gate describes README, `/docs`, `mod.ts`, and export-map readiness for `packages/shared`.
- **Actual:** The package-scoped command exits 0 for `packages/shared`; the root command fails on non-package root metadata outside the Wave 0 surface.
- **Severity:** significant
- **Action:** accept
- **Evidence:** package-scoped command: `FAIL=0`; root command: `FAIL=4` for root `deno.json` license, description, publish include, and root export map.
## 2026-06-05 — Temporal stable refactor and date/time migration registry

- **What:** Temporal is now stable for the target Deno runtime, so the unpublished `packages/shared/utils/datetime.ts` anti-helper was deleted instead of preserved behind another compatibility wrapper.
- **Source:** PR feedback from @rickylabs plus doctrine A6/A7 and `docs/architecture/doctrine/04-modules-and-helpers.md` naming `shared/utils/datetime.ts` as the canonical anti-helper.
- **Expected:** Shared should not publish or retain a generic date/time wrapper that duplicates Temporal, Date, Intl, or `@std/datetime`.
- **Actual:** `packages/shared/utils/mod.ts` no longer exports datetime helpers, and `packages/shared/utils/datetime.ts` plus its script-style test were removed. No replacement `@netscript/shared` datetime utility is introduced; packages should use Temporal directly or define package-owned clock/scheduler ports where time is an architectural seam.
- **Severity:** significant
- **Action:** fixed for `@netscript/shared`; defer consumer package migrations to their owning waves.
- **Evidence:** `packages/shared/utils/mod.ts`, deleted `packages/shared/utils/datetime.ts`, deleted `packages/shared/utils/datetime.test.ts`.

### Broad date/time migration registry

| File | Hits | Lines | Migration guidance |
| ---- | ---- | ----- | ------------------ |
| `packages/cli/e2e/src/adapters/commands/deno-command-adapter.ts` | clearTimeout=1, setTimeout=1 | 14, 64 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/adapters/http/fetch-http-adapter.ts` | clearTimeout=1, setTimeout=1 | 7, 19 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/adapters/time/system-clock.ts` | new Date=1 | 6 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/application/builders/workspace/suite-builder-options.ts` | new Date=1 | 6 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts` | new Date=1, setTimeout=1, toISOString=1 | 25, 74 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/application/runner/suite-runner.ts` | toISOString=1 | 106 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/src/create-default-runner.ts` | new Date=1 | 19 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` | new Date=1 | 171 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/cli/src/kernel/adapters/database/operation-runner.ts` | Date.now=2, setTimeout=1 | 51, 192, 194 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/cli/src/kernel/adapters/deploy/upgrade-steps.ts` | setTimeout=1 | 207 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/cli/src/kernel/adapters/loggers/json-logger.ts` | new Date=1, toISOString=1 | 10 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/kernel/adapters/runtime/clock/system-clock.ts` | new Date=1 | 11 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/kernel/adapters/windows/compile/compile-bundler.ts` | clearTimeout=2, setTimeout=1 | 97, 110, 176 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/cli/src/kernel/adapters/windows/compile/compile-runner.ts` | clearTimeout=2, setTimeout=1 | 183, 196, 226 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts` | new Date=1, toISOString=1 | 52 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/kernel/adapters/windows/manifest/manifest.ts` | new Date=1, toISOString=1 | 70 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/kernel/adapters/windows/runtime/runtime-config-writer.ts` | new Date=1, toISOString=1 | 152 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/public/features/deploy/build/build-windows-runtime.ts` | new Date=1, toISOString=1 | 205 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/public/features/deploy/logs/logs-deploy-command.ts` | new Date=2, setTimeout=2, toISOString=1 | 77, 80, 97, 204, 253 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cli/src/public/features/deploy/start/start-deploy-command.ts` | Date.now=3, clearTimeout=1, setTimeout=3 | 203, 207, 216, 218, 225, 237, 243 | Review during owning package wave; no shared datetime import recommended. |
| `packages/contracts/helpers/transform.ts` | toISOString=2 | 58, 137 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cron/adapters/_shared.ts` | getTime=2, new Date=2 | 60, 130, 137, 146 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cron/adapters/deno.adapter.ts` | new Date=2 | 261, 270 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/cron/adapters/memory.adapter.ts` | Date.now=2, getTime=1, new Date=2 | 307, 310, 412, 413 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/cron/mod.ts` | Temporal=2 | 122, 124 | Review during owning package wave; no shared datetime import recommended. |
| `packages/database/adapters/mssql.adapter.ts` | new Date=1 | 416 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/database/adapters/mysql.adapter.ts` | new Date=1 | 368 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/database/adapters/postgres.adapter.ts` | new Date=1 | 94 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/fresh/config/vite.test.ts` | setTimeout=1 | 179 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/fresh/config/vite.ts` | clearTimeout=1, setTimeout=1 | 243, 246 | Review during owning package wave; no shared datetime import recommended. |
| `packages/fresh/error/handler.ts` | Date.now=1, new Date=1, toISOString=1 | 140, 259 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/fresh/server/sse.ts` | new Date=8, toISOString=8 | 177, 207, 301, 307, 321, 379, 385, 399 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/fresh-ui/runtime/tooltip/use-tooltip.ts` | clearTimeout=2, setTimeout=2 | 45, 50, 74, 85 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/kv/adapters/deno-kv.adapter.ts` | Date.now=3, clearTimeout=1, new Date=8, setTimeout=1 | 269, 328, 335, 361, 365, 414, 430, 447, 498, 513, 545, 577… | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/kv/adapters/memory.adapter.ts` | Date.now=4, clearTimeout=2, new Date=2, setTimeout=2 | 83, 107, 159, 320, 324, 374, 406, 410, 470, 504 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/kv/adapters/redis.adapter.ts` | Date.now=1, new Date=5, setTimeout=1 | 588, 614, 663, 694, 739, 754, 798 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/kv/core/keys.ts` | Date.now=1 | 39 | Review during owning package wave; no shared datetime import recommended. |
| `packages/plugin-sagas-core/src/integration/workers/trigger-job.ts` | getTime=1 | 43 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/integration/workers/trigger-task.ts` | getTime=1 | 43 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/middleware/sse-events-middleware.ts` | getTime=2, new Date=1, toISOString=1 | 86, 89, 91, 143 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/public/messages.ts` | Date.now=2, new Date=2 | 110, 131 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/runtime/saga-engine.ts` | new Date=1 | 212 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/runtime/saga-idempotency.ts` | getTime=1, new Date=2 | 46, 62 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/runtime/saga-scheduler.ts` | getTime=2, toISOString=1 | 100, 190 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/telemetry/instrumentation.ts` | toISOString=1 | 160 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/testing/test-saga-clock.ts` | getTime=1, new Date=5 | 9, 11, 15, 28, 33 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-sagas-core/src/transports/list-transport-delayed.ts` | getTime=2, new Date=1 | 47, 69, 79 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/transports/list-transport-subscription.ts` | new Date=1, toISOString=1 | 141, 157 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/transports/list-transport.ts` | getTime=2, new Date=1, setTimeout=1 | 314, 348, 434, 452 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/transports/redis-transport-delayed.ts` | getTime=2, new Date=1 | 46, 68, 78 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/transports/redis-transport-subscription.ts` | new Date=1, toISOString=1 | 102, 117 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/src/transports/redis-transport.ts` | new Date=1, setTimeout=1 | 466, 479 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-sagas-core/tests/runtime/saga-idempotency_test.ts` | new Date=3 | 16, 27, 200 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-sagas-core/tests/runtime/saga-scheduler_test.ts` | new Date=2 | 66, 115 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-sagas-core/tests/testing/testing-helpers_test.ts` | new Date=3, toISOString=1 | 27, 28, 53, 58 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/runtime/create-trigger-ingress.ts` | new Date=1, toISOString=2 | 75, 101, 132 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-triggers-core/src/runtime/create-trigger-ingress_test.ts` | new Date=1, toISOString=1 | 205, 279 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/runtime/trigger-processor.ts` | getTime=2, new Date=1, setTimeout=1, toISOString=1 | 79, 180, 232, 251, 315 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/plugin-triggers-core/src/runtime/trigger-processor_test.ts` | new Date=1, toISOString=2 | 209, 210, 216 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/inline-trigger-processor.ts` | new Date=1 | 15 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/kv-trigger-event-store.ts` | new Date=1, toISOString=1 | 19, 46 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/memory-file-watcher-adapter.ts` | new Date=1, toISOString=1 | 26, 102 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/memory-trigger-event-store.ts` | new Date=1, toISOString=1 | 11, 36 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/memory-trigger-idempotency-store.ts` | getTime=2, new Date=1 | 16, 31, 46 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/memory-trigger-scheduler-adapter.ts` | new Date=1, toISOString=2 | 20, 32, 85 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/testing_test.ts` | new Date=1, toISOString=4 | 60, 108, 125, 126, 133 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-triggers-core/src/testing/trigger-test-clock.ts` | getTime=1, new Date=5 | 9, 11, 15, 28, 33 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts` | Date.now=2, new Date=3, toISOString=2 | 28, 139, 162, 166, 167 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/plugin-workers-core/src/executor/adapters/runtime-adapter-base.ts` | Date.now=2, new Date=2, toISOString=2 | 54, 62, 66, 67 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/plugin-workers-core/src/runtime/composition-root.ts` | new Date=1 | 60 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-workers-core/src/shutdown/shutdown-manager.ts` | setTimeout=1 | 104 | Review during owning package wave; no shared datetime import recommended. |
| `packages/plugin-workers-core/src/state/execution-state.ts` | getTime=1, new Date=4, toISOString=3 | 59, 93, 104, 105, 108, 109 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-workers-core/src/testing/job-fixtures.ts` | new Date=2, toISOString=1 | 62, 92 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/plugin-workers-core/src/workflow/workflow-executor.ts` | getTime=1, new Date=2, toISOString=2 | 31, 106, 137, 141 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/plugin-workers-core/src/workflow/workflow-step-runner.ts` | getTime=3, new Date=1, setTimeout=1, toISOString=2 | 34, 35, 39, 44, 45, 52, 53 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/plugin-workers-core/tests/executor/multi-runtime-task-executor_test.ts` | new Date=2, toISOString=2 | 67, 68 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/prisma-adapter-mysql/src/conversion.ts` | new Date=2, toISOString=2 | 182, 238, 242 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/queue/adapters/_envelope.ts` | new Date=1, toISOString=1 | 41 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/queue/adapters/amqp.adapter.ts` | Temporal=1, new Date=2, setTimeout=1 | 64, 125, 130, 163 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/queue/adapters/deno-kv.adapter.ts` | Temporal=1, new Date=2, setTimeout=1 | 114, 178, 183, 215 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/queue/adapters/kv-polling.adapter.ts` | Date.now=2, getTime=4, new Date=14, toISOString=12 | 284, 294, 304, 310, 316, 317, 370, 371, 376, 378, 411, 419… | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/queue/adapters/redis.adapter.ts` | Temporal=1, new Date=2, setTimeout=1 | 70, 133, 138, 171 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `packages/queue/internal/parallel-queue.ts` | new Date=1 | 96 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/queue/tests/envelope_test.ts` | new Date=1, toISOString=1 | 31, 50 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/runtime-config/mod.ts` | clearTimeout=1, setTimeout=1 | 364, 366 | Review during owning package wave; no shared datetime import recommended. |
| `packages/sdk/core/cache-query.ts` | Date.now=4 | 73, 116, 140, 225 | Review during owning package wave; no shared datetime import recommended. |
| `packages/sdk/interfaces/cache-entry.ts` | Date.now=1 | 63 | Review during owning package wave; no shared datetime import recommended. |
| `packages/service/presets/define-service.ts` | setTimeout=3 | 273, 297, 337 | Review during owning package wave; no shared datetime import recommended. |
| `packages/service/primitives/health.ts` | clearTimeout=1, new Date=1, setTimeout=1, toISOString=1 | 108, 166, 171 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/shared/utils/zod/codecs.ts` | getTime=2, new Date=6, toISOString=1 | 109, 113, 114, 126, 130, 131, 143, 147, 148 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/telemetry/src/instrumentation/scheduler.ts` | new Date=1, toISOString=3 | 135, 157, 192, 271 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/telemetry/src/instrumentation/sse.ts` | Date.now=1, getTime=1, new Date=1 | 119, 222 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/telemetry/src/instrumentation/worker.ts` | Date.now=3 | 213, 222, 248 | Review during owning package wave; no shared datetime import recommended. |
| `packages/telemetry/src/orpc/error-plugin.ts` | new Date=1, toISOString=1 | 372 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/watchers/filters/dedup.ts` | Date.now=2 | 83, 99 | Review during owning package wave; no shared datetime import recommended. |
| `packages/watchers/filters/dedup_test.ts` | new Date=4 | 49, 50, 54, 83 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/watchers/filters/glob_test.ts` | new Date=1 | 11 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/watchers/filters/stability.ts` | new Date=1 | 74 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/watchers/filters/stability_test.ts` | new Date=4, setTimeout=1 | 12, 13, 17, 52, 92 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `packages/watchers/strategies/native.ts` | new Date=1 | 101 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `packages/watchers/strategies/polling.ts` | getTime=2, new Date=1 | 126, 192, 216 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/sagas/services/src/routers/health.ts` | Date.now=4, new Date=3, toISOString=3 | 84, 96, 110, 115, 125, 130, 156 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/sagas/services/src/routers/v1.ts` | Date.now=2, new Date=6, toISOString=7 | 197, 202, 204, 514, 521, 552, 557, 643, 668, 680 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/sagas/services/src/saga-registry.ts` | new Date=1, toISOString=1 | 24, 27 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/sagas/src/runtime/saga-publisher.ts` | new Date=1, toISOString=1 | 210, 255 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/sagas/src/scaffolding/saga-scaffolders.ts` | toISOString=2 | 45, 51 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/sagas/streams/producer.ts` | Date.now=1, new Date=1, toISOString=1 | 170 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/streams/services/src/main.ts` | clearTimeout=1, setTimeout=1 | 54, 61 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/triggers/jobs/file-import.ts` | new Date=1, toISOString=1 | 164 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/jobs/file-relay.ts` | new Date=3, toISOString=3 | 120, 135, 149 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/jobs/staged-cleanup.ts` | new Date=1, toISOString=1 | 48 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/services/src/routers/health.ts` | Date.now=1, getTime=1, new Date=4, toISOString=3 | 11, 18, 19, 26, 32 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/triggers/src/cli/triggers-cli-backend-support.ts` | new Date=6, toISOString=3 | 123, 141, 146, 197, 206, 218 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/src/cli/triggers-cli-backend.ts` | new Date=1, toISOString=1 | 135, 160 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/src/runtime/cron-trigger-scheduler-adapter.ts` | setTimeout=1, toISOString=3 | 163, 164, 191, 207 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts` | getTime=1, new Date=3, toISOString=3 | 39, 66, 109, 120, 131, 213 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | new Date=1, toISOString=1 | 109 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/src/runtime/watchers-file-watcher-adapter.ts` | new Date=1, toISOString=3 | 45, 171, 181, 186 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/triggers/test-webhooks-e2e.ts` | new Date=4, setTimeout=1, toISOString=4 | 164, 190, 299, 367, 369 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `plugins/workers/jobs/health-check.ts` | Date.now=1, new Date=3, toISOString=2 | 143, 144, 152, 204 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/services/src/routers/admin.ts` | Date.now=1, new Date=1 | 21, 30 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/workers/services/src/routers/health.ts` | Date.now=2, new Date=2, toISOString=2 | 11, 49, 50, 60 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/workers/services/src/routers/jobs.ts` | new Date=1, toISOString=1 | 100 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/services/src/routers/runs.ts` | Date.now=1, getTime=3, new Date=3 | 79, 82, 83, 108 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/workers/services/src/routers/subscribe.ts` | Date.now=2, new Date=7, toISOString=7 | 26, 40, 53, 71, 79, 106, 112, 117, 118 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |
| `plugins/workers/services/src/routers/tasks.ts` | new Date=1, toISOString=1 | 51 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/test-api.ts` | Date.now=1, clearTimeout=2, setTimeout=1 | 86, 227, 234, 240 | Keep local/test seam; migrate only if the owning package introduces a clock/test-time port. |
| `plugins/workers/worker/job-dispatcher.ts` | new Date=1 | 78 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/worker/job-execution.ts` | new Date=1, toISOString=1 | 42 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/worker/queue-consumer.ts` | new Date=1, toISOString=1 | 119 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/worker/scheduler.ts` | new Date=1, toISOString=1 | 308 | Prefer Temporal.Instant/ZonedDateTime directly; keep local Date only at storage/API compatibility boundaries. |
| `plugins/workers/worker/worker.ts` | Date.now=2 | 263, 266 | Introduce package-owned Clock/Scheduler port; use Temporal.Instant/Duration in the implementation, not @netscript/shared. |

## 2026-06-05 — Post-evaluator package name rescope

- **What:** The unit began as `@netscript/shared`, but final JSR audit and user review selected
  `@netscript/contracts` as the public package name.
- **Source:** User-approved package layout: root contracts vocabulary plus `/crud`, `/query`, and
  `/transform` subexports.
- **Expected:** Earlier Wave 0 plan and run artifacts target `packages/shared`.
- **Actual:** `packages/shared` was removed after consumers and CLI import generators were migrated
  to `@netscript/contracts`.
- **Severity:** significant
- **Action:** accept
- **Evidence:** `packages/contracts/deno.json`, `packages/contracts/mod.ts`,
  `packages/contracts/{crud,query,transform}.ts`, plugin `deno.json` import maps, CLI scaffold
  resolvers.

## 2026-06-05 — Tracked workspace lockfile expansion

- **What:** The evaluator baseline introduced a tracked root `deno.lock`; the post-rebase
  `deno task check` expanded it with the current workspace graph.
- **Source:** Full branch validation after migrating `@netscript/shared` consumers to
  `@netscript/contracts`.
- **Expected:** Original Wave 0 package plan did not account for a tracked root lockfile.
- **Actual:** `deno.lock` must be refreshed with the migrated workspace graph to keep validation
  reproducible from a clean checkout.
- **Severity:** low
- **Action:** accept
- **Evidence:** `deno task check` passed after lockfile refresh.

## 2026-06-05 — CLI E2E merge-readiness fixes after contracts migration

- **What:** The full CLI E2E suite exposed post-migration integration blockers outside the original
  package-only Wave 0 plan.
- **Source:** `deno task e2e:cli run scaffold.service`, `scaffold.infrastructure`, and
  `scaffold.runtime` after the `@netscript/shared` to `@netscript/contracts` consolidation.
- **Expected:** Package migration plus earlier gates would leave generated scaffold workspaces ready.
- **Actual:** Maintainer scaffold package copying still referenced the removed `packages/shared`;
  Prisma 7 refused to generate into the seeded non-client `schema/.generated` placeholder; and the
  runtime E2E capability suite started Aspire without first scaffolding the plugin workspace it
  depends on.
- **Severity:** significant
- **Action:** fixed
- **Evidence:** Full final pass exited 0 for `scaffold.service`, `scaffold.contracts`,
  `scaffold.infrastructure`, `scaffold.plugins`, and `scaffold.runtime`; focused CLI tests and
  `deno task check` also passed.

## 2026-06-05 — Prior Claude knowledge pack migrated into agent docs

- **What:** The current worktree had `.agents/skills` and `.agents/rules`, but was missing the
  prior repo's `.claude` knowledge-base documents and Aspire operational skill.
- **Source:** Ancestor folder `C:\Dev\repos\netscript\output\test-app\worktrees\repo-genesis\.claude`.
- **Expected:** Production agent context should live under `.agents`, not under a Claude-specific
  folder outside this worktree.
- **Actual:** Migrated the reusable markdown knowledge pack into `.agents/knowledge-base`, added
  `.agents/skills/aspire`, and rewrote stale `.claude`, old doctrine-path, and pre-contracts-package
  references during migration.
- **Severity:** significant
- **Action:** fixed
- **Evidence:** `.agents/knowledge-base/README.md`, `.agents/knowledge-base/01..12*.md`,
  `.agents/skills/aspire/SKILL.md`, and corrected `.agents/skills/netscript-*` paths.
