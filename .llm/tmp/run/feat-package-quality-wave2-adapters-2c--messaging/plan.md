# Plan — Wave 2c Messaging (queue · cron)

Run ID: `feat-package-quality-wave2-adapters-2c--messaging`
Branch: `feat/package-quality-wave2-adapters-2c`
Base: `feat/package-quality-wave2-adapters` @ `55f6108`
PR target: `feat/package-quality-wave2-adapters` (umbrella, draft PR #13)

## Authority

This plan is a **refinement** of the locked combined Wave 2 plan (`…/feat-package-quality-wave2-adapters--adapters/plan.md`, § "Sub-wave 2c — messaging"). The combined plan is PLAN-EVAL PASS (Option A). Only the MEASURE-FIRST re-baseline numbers and per-slice detail are updated here; OQ-1..OQ-7 decisions remain locked.

## Archetype & Scope

- **Archetype:** A2 — Integration (external systems: Deno KV, Redis, RabbitMQ, cron backends)
- **Scope overlay:** None (pure package/plugin quality)
- **Doctrine verdict:** Refactor (AP-16, AP-17 debt entries to close)
- **Required gates:** F-1..F-12, F-14..F-18 (F-13 n/a). Static gates per slice. Consumer gate for renames.

## Locked decisions (carried in, do not re-litigate)

| ID | Decision | Rationale |
|----|----------|-----------|
| OQ-1 | Sub-wave split: 2a (observability), 2b (data), 2c (messaging) | Already executed; 2a+2b merged into umbrella |
| OQ-3 | `interfaces/` → `ports/` rename for queue and cron | AP-17; alpha = no back-compat shims |
| OQ-4 | queue `utils/` → `validation/` rename | AP-16; `./validation` subpath name unchanged |
| OQ-5 | `./testing` port-contract entrypoint required | A2 archetype for multi-adapter units |
| OQ-6 | Publish hygiene: 0 slow types, doc-lint clean | JSR alpha readiness |
| OQ-7 | No `skipLibCheck` hacks | Already clean; maintain |

## Re-baseline findings (Research step 1)

- **Publish dry-run:** queue ✅ 0 slow types; cron ✅ 0 slow types
- **Full `deno doc --lint` sweep:** queue **35 errors**, cron **16 errors**
  - queue: `deno-kv.adapter.ts` 21 (missing-jsdoc 14 + private-type-ref 7), `kv-polling.adapter.ts` 6, factories 8
  - cron: `interfaces/mod.ts` 5, `interfaces/types.ts` 4, `interfaces/scheduler.ts` 7
- **Consumer impact:** Zero external consumers of `@netscript/queue/types`, `@netscript/queue/validation`, or `@netscript/cron/types`. Root-only imports in `plugins/triggers`, `plugins/workers`, `packages/telemetry`.
- **F-16 folder cardinality post-rename:** queue `ports/` = 4 files, cron `ports/` = 3 files ✅

## Open-decision sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Cron `./testing`: reuse `MemoryCronAdapter` vs new file | **Locked — reuse** | Re-export barrel at `./testing/mod.ts` pointing to `../adapters/memory.adapter.ts` |
| Queue `./testing`: new `MemoryQueueAdapter` | **Locked — new** | No in-memory adapter exists; implement `MessageQueue<T>` with `enqueue`, `listen`, `stop`, `drain` |
| Doc-lint fix strategy for private-type-ref | **Locked — re-export** | Port types (`MessageQueue`, `EnqueueOptions`, `ListenOptions`, `MessageContext`, `SchedulerEventMap`, etc.) must be publicly exported from `./ports` barrel so adapters/factories can reference them without private-type-ref errors |
| Defensive I/O test scope | **Locked** | kv-polling timers, amqp timers, redis blocking client (`brpoplpush`) abort/cleanup |

All open decisions are **safe to defer** — none force rework if deferred.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| private-type-ref cascade during doc-lint fix | Medium | Medium | Fix by re-exporting port types from `./ports` barrel; adapters/factories import from `./ports` |
| Consumer `deno check` fails after rename | Low | High | Consumer gate (slice 16); root-only imports mean low risk |
| Redis adapter npm type warnings | Low | Low | Non-actionable upstream; zero errors |
| e2e:cli fails on unrelated Wave-0/1 drift | Medium | Medium | Log in drift.md, escalate — do not block 2c merge |

## Commit slices (17 slices — refined from carried-in ~14–16)

### queue

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 1 | queue: rename `interfaces/` → `ports/`, `utils/` → `validation/` | F-3, F-11, F-16 | `packages/queue/interfaces/*` → `packages/queue/ports/*`, `packages/queue/utils/*` → `packages/queue/validation/*` |
| 2 | queue: update subpath exports (`./types` → `./ports`, `./validation` stays) | F-5, consumer | `packages/queue/deno.json` |
| 3 | queue: update all internal imports after rename | F-3, static | `packages/queue/**/*.ts` |
| 4 | queue: fix doc-lint errors (JSDoc + private-type-ref) | F-7 | `packages/queue/ports/*.ts`, `packages/queue/adapters/*.ts`, `packages/queue/factory/*.ts` |
| 5 | queue: add `./testing` entrypoint with `MemoryQueueAdapter` | F-5, F-3 | `packages/queue/testing/mod.ts`, `packages/queue/testing/memory-queue.ts` |
| 6 | queue: add defensive I/O tests (abort/cleanup for kv-polling + amqp timers + redis blocking) | F-10 | `packages/queue/tests/abort-cleanup_test.ts` |
| 7 | queue: add `lint`, `fmt`, `publish:dry-run` tasks | F-6, static | `packages/queue/deno.json` |
| 8 | queue: add `tests/_fixtures/docs-examples_test.ts` doctest | F-10, F-7 | `packages/queue/tests/_fixtures/docs-examples_test.ts` |
| 9 | queue: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |

### cron

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 10 | cron: rename `interfaces/` → `ports/`, update subpath (`./types` → `./ports`) | F-3, F-11, F-16, consumer | `packages/cron/interfaces/*` → `packages/cron/ports/*`, `packages/cron/deno.json` |
| 11 | cron: fix doc-lint errors (JSDoc + `CronProviderRegistry` visibility + private-type-ref) | F-7 | `packages/cron/ports/*.ts`, `packages/cron/mod.ts` |
| 12 | cron: add `./testing` entrypoint re-exporting `MemoryCronAdapter` | F-5, F-3 | `packages/cron/testing/mod.ts` |
| 13 | cron: add defensive I/O tests (abort/cleanup for scheduler timers) | F-10 | `packages/cron/tests/abort-cleanup_test.ts` |
| 14 | cron: add `lint`, `fmt`, `publish:dry-run` tasks; scaffold `/docs` | F-6, F-7, static | `packages/cron/deno.json`, `packages/cron/docs/**/*.md` |
| 15 | cron: verify `publish:dry-run` 0 slow types + `deno doc --lint` clean | F-6, static | — |

### cross-cutting

| # | Slice | Gate | Files |
|---|-------|------|-------|
| 16 | 2c: consumer gate — `deno check` on CLI + plugins | Consumer | — |
| 17 | **Merge-readiness: `deno task e2e:cli`** | Runtime/merge | — |

## Debt implications

**Closing:**

| Debt entry | Closing slice | How |
|------------|---------------|-----|
| `packages/queue — AP-16 / doctrine verdict Refactor` | Slice 1 | `utils/` → `validation/`, `interfaces/` → `ports/` |
| `packages/cron — AP-17 / doctrine verdict Refactor` | Slice 10 | `interfaces/` → `ports/` rename |

**Remaining open:**

| Debt entry | Status |
|------------|--------|
| `packages/kv — AP-1 / doctrine verdict Refactor` | OPEN — bridge_test.ts god file not touched |
| `packages/telemetry — doctrine verdict Refactor` | OPEN — instrumentation extraction deferred |
| `telemetry-plugin-instrumentation-extraction` | OPEN — deferred per plan |

## Deferred scope

- `@db/redis` migration (npm:ioredis → jsr:@db/redis): **future track**, NOT Wave 2
- S2/S3 CI, versioning, publishing, OIDC: out of scope
- Umbrella → track merge: out of scope

## jsr-audit surface scan

| Unit | Meta | README ≥150 | `/docs` | 0 slow types | doc-lint clean | `./testing` |
|------|------|-------------|---------|--------------|----------------|-------------|
| queue | ✓ | ✓ 251 | Planned | ✓ | **35 → 0** (slice 4) | Planned (slice 5) |
| cron | ✓ | ✓ 175 | Planned | ✓ | **16 → 0** (slice 11) | Planned (slice 12) |
