# Research — Wave 2c Messaging (queue · cron)

Run ID: `feat-package-quality-wave2-adapters-2c--messaging`
Base: `55f6108` (umbrella = track + 2a + 2b)
Date: 2026-06-07

## Re-baseline: MEASURE-FIRST

### Publish dry-run (0 slow types — confirmed)

| Unit | Result |
|------|--------|
| queue | ✅ Success, 0 slow types |
| cron  | ✅ Success, 0 slow types |

### Full export-sweep `deno doc --lint`

**queue** — 18 entrypoints swept (every `exports` key in `deno.json` + every `.ts` file that exports symbols):

| Entrypoint | Errors | Categories |
|-----------|--------|------------|
| `./mod.ts` | 0 | — |
| `./interfaces/mod.ts` | 0 | — |
| `./interfaces/errors.ts` | 0 | — |
| `./interfaces/message-queue.ts` | 0 | — |
| `./interfaces/options.ts` | 0 | — |
| `./utils/mod.ts` | 0 | — |
| `./adapters/mod.ts` | 0 | — |
| `./adapters/deno-kv.adapter.ts` | **21** | missing-jsdoc (14) + private-type-ref (7) |
| `./adapters/redis.adapter.ts` | 0 | npm type warnings only (non-actionable) |
| `./adapters/amqp.adapter.ts` | 0 | npm type warnings only (non-actionable) |
| `./adapters/kv-polling.adapter.ts` | **6** | missing-jsdoc (1) + private-type-ref (5) |
| `./factory/create-queue.ts` | **2** | private-type-ref (2) |
| `./factory/create-typed-queue.ts` | **4** | private-type-ref (4) |
| `./factory/create-parallel-queue.ts` | **2** | private-type-ref (2) |
| `./factory/mod.ts` | 0 | — |
| `./internal/mod.ts` | 0 | — |
| `./internal/distributed-queue.ts` | 0 | — |
| `./internal/parallel-queue.ts` | 0 | — |
| **queue TOTAL** | **35** | |

**cron** — 7 entrypoints swept:

| Entrypoint | Errors | Categories |
|-----------|--------|------------|
| `./mod.ts` | 0 | — |
| `./adapters/mod.ts` | 0 | — |
| `./interfaces/mod.ts` | **5** | missing-jsdoc (4) + private-type-ref (1) |
| `./interfaces/types.ts` | **4** | missing-jsdoc (4) |
| `./interfaces/scheduler.ts` | **7** | private-type-ref (7) |
| `./adapters/deno.adapter.ts` | 0 | — |
| `./adapters/memory.adapter.ts` | 0 | — |
| `./adapters/_shared.ts` | 0 | — |
| **cron TOTAL** | **16** | |

**Key finding:** The carried-in counts (queue 19+, cron 5) measured at `ca4d9c4` were **stale and under-counted**. The real numbers at `55f6108` are **queue 35**, **cron 16**. The delta is driven by:
- queue: `deno-kv.adapter.ts` has 21 errors (was not counted in the partial sweep)
- cron: `scheduler.ts` has 7 private-type-ref errors (was not counted)

Both packages have **zero slow types** and **pass `deno check --unstable-kv`**.

### Consumer impact scan

| Import pattern | Consumers |
|---------------|-----------|
| `@netscript/queue` (root) | `plugins/triggers`, `plugins/workers`, `packages/telemetry` |
| `@netscript/queue/types` | **Zero** |
| `@netscript/queue/validation` | **Zero** |
| `@netscript/cron` (root) | `plugins/triggers`, `plugins/workers` |
| `@netscript/cron/types` | **Zero** |

Root-only consumption means the `./types` → `./ports` subpath rename has **zero breaking impact** on known consumers.

### Cron `./testing` decision — reuse, don't duplicate

The existing `adapters/memory.adapter.ts` (`MemoryCronAdapter`) already provides:
- Full `CronScheduler` implementation
- Testing helpers: `triggerAll()`, `waitForExecutions()`, `getExecutionCount()`, `resetExecutionCount()`, `setTickInterval()`
- No external dependencies

**Decision:** `./testing` entrypoint for cron will **re-export `MemoryCronAdapter`** (and needed types) from `adapters/memory.adapter.ts`, not create a duplicate in-memory scheduler. This avoids duplication and keeps F-16 folder cardinality clean.

### Queue `./testing` — new in-memory adapter required

Queue has no in-memory adapter today. A new `MemoryQueueAdapter<T>` implementing `MessageQueue<T>` must be created for the `./testing` entrypoint. It should support `enqueue`, `listen`, `stop`, and a `drain()` helper for tests.

### Underscore-private files

- `packages/queue/adapters/_envelope.ts` — not exported from any barrel
- `packages/cron/adapters/_shared.ts` — not exported from any barrel

These are internal implementation detail. No JSDoc/doc-lint obligation.

## Open questions resolved

| Question | Resolution |
|----------|------------|
| Cron `./testing`: reuse or duplicate? | **Reuse** `MemoryCronAdapter` via re-export |
| Real doc-lint counts at `55f6108`? | queue **35**, cron **16** |
| `_envelope.ts` / `_shared.ts` doc obligation? | **No** — not in public surface |
| F-16 folder cardinality post-rename? | queue ports/ = 4, cron ports/ = 3 ✅ |

## Risk register (updated)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| private-type-ref cascade during doc-lint fix | Medium | Medium | Fix by re-exporting port types from `./ports` barrel; adapters import from `./ports` not `./interfaces` |
| Consumer `deno check` fails after rename | Low | High | Consumer gate (slice 16) runs `deno check` on CLI + plugins; root-only imports mean low risk |
| Redis adapter npm type warnings block doc-lint | Low | Low | Warnings are non-actionable (upstream `@types/node` resolution); errors are zero |
| e2e:cli fails on unrelated Wave-0/1 drift | Medium | Medium | Log in drift.md, escalate — do not block 2c merge |
