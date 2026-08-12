
# GlideMQ — Exhaustive Technical Dossier for NetScript Integration Evaluation

---

## 1. What GlideMQ Is: Core Value Proposition & Backend Requirements

### 1.1 Overview

**GlideMQ** (`npm: glide-mq`) is a Node.js job/task-queue library purpose-built to replace BullMQ. Its defining architectural choice is the elimination of per-job round-trips: every "complete current job + fetch next" operation is collapsed into a **single FCALL** to a persistent Valkey function library, yielding 1 RTT per job cycle instead of BullMQ's 2–3.

> *Source: `avifenesh/glide-mq:README.md` — "complete + fetch next in a single server-side function call (1 RTT per job)"*

The other defining choice is its Rust-native client: the library communicates with Valkey/Redis through **`@glidemq/speedkey`**, a fork of [`valkey-glide`](https://github.com/valkey-io/valkey-glide) that uses **NAPI bindings** (i.e., a compiled Rust `.node` binary loaded by Node.js), bypassing the JavaScript RESP parser entirely.

> *Source: `avifenesh/speedkey:README.md` — "Valkey/Redis client with direct NAPI bindings based on valkey-glide core. No IPC socket - Rust talks directly to Node.js via NAPI."*

### 1.2 Differentiation from BullMQ and BeeQueue

| Aspect | glide-mq | BullMQ | BeeQueue |
|---|---|---|---|
| Network per job | **1 RTT** (FCALL completes + fetches next) | 2–3 RTTs (separate complete, acknowledge, fetch) | 1–2 RTTs |
| Server logic | **44 named Valkey Functions** (FUNCTION LOAD / FCALL — persistent, named) | 53 ephemeral EVAL/EVALSHA scripts (NOSCRIPT errors possible) | Lua EVAL |
| Client layer | **Rust NAPI** (no JS protocol parsing) | ioredis (JS) | ioredis (JS) |
| Cluster | **Native hash-tags `{queueName}` zero-config** | Requires explicit slot management | Standalone only |
| AI-native primitives | 7 first-class (see §4) | None | None |

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:109` — "BullMQ uses 53 EVAL scripts. We use a single function library."*

### 1.3 Backend Server Requirements — **Critical for NetScript**

GlideMQ has a hard dependency on **Valkey Functions** (`FUNCTION LOAD` / `FCALL`). This is **not** optional — all 44 server-side operations go through `FCALL`, and the library is loaded on every Queue/Worker construction:

```
1. Check: FUNCTION LIST LIBRARYNAME glidemq
2. If missing or version mismatch: FUNCTION LOAD [source] REPLACE
3. In cluster: route to 'allPrimaries'
```

> *Source: `avifenesh/glide-mq:src/connection.ts` — `ensureFunctionLibrary()` called on every client init*

Consequences by backend:

| Backend | Support | Notes |
|---|---|---|
| **Valkey 7.0+** | ✅ Full | First-class target; tested in CI with Valkey 9.1.0 |
| **Redis OSS 7.0+** | ✅ Supported | Valkey Functions were introduced in Redis 7.0 |
| **Garnet** (Microsoft) | ❌ **Blocker** | Garnet does **not** implement `FUNCTION LOAD`/`FCALL`. XAUTOCLAIM and Streams consumer groups also unverified. GlideMQ cannot be used with Garnet without fundamental rewriting. |
| **Dragonfly** | ⚠️ Uncertain | Dragonfly has partial Lua/EVAL support but `FUNCTION LOAD` support is incomplete as of mid-2025. **Unverified.** |
| **Upstash** | ❌ Blocker | Upstash Redis does not support `FUNCTION LOAD`. |
| **ElastiCache Valkey** | ✅ Supported | Benchmarks run on ElastiCache Valkey 8.2 (TLS, r7g.large) |
| **AWS MemoryDB** | ✅ Supported | IAM auth (`IamCredentials` with `ServiceType.MemoryDB`) built in |

> *Source: `avifenesh/glide-mq:src/connection.ts:4` — `import { GlideClient, GlideClusterClient, ServiceType } from '@glidemq/speedkey'`; connection.ts lines 18–25 show IAM service type mapping*

Also: GlideMQ also requires **Redis Streams** (`XREADGROUP`, `XADD`, `XAUTOCLAIM`) and **Sorted Sets**. Garnet's Streams support is incomplete (consumer groups are partial).

### 1.4 @glidemq/speedkey vs valkey-glide

`@glidemq/speedkey` is a **personal fork** maintained by `avifenesh` (not a release from the upstream AWS/valkey-io team). The README explicitly states it is a bridge until the official `valkey-glide` ships NAPI support:

> *"speedkey will be replaced by valkey-glide when glide completes its migration to NAPI. The API surface is designed to align with valkey-glide to minimize migration effort."*  
> *Source: `avifenesh/speedkey:README.md`*

The `speedkey` repository includes `glide-core/` as a subdirectory (a copy of the valkey-glide Rust core), meaning the Rust binary is compiled from a vendored snapshot of `valkey-io/valkey-glide`. This has significant maintenance implications (see §7).

---

## 2. Full API Surface

### 2.1 Queue

```typescript
class Queue<D = any, R = any> extends EventEmitter {
  // Core
  add(name: string, data: D, opts?: JobOptions): Promise<Job<D, R> | null>
  addAndWait(name: string, data: D, opts?: AddAndWaitOptions): Promise<R>  // RPC pattern
  addBulk(jobs: { name, data, opts? }[]): Promise<Job<D, R>[]>
  getJob(id: string): Promise<Job<D, R> | null>
  getJobs(type, start?, end?, opts?): Promise<Job<D, R>[]>
  getJobCounts(): Promise<JobCounts>  // { waiting, active, delayed, completed, failed }
  count(): Promise<number>
  pause() / resume() / isPaused()
  revoke(jobId): Promise<string>
  obliterate(opts?: { force: boolean }): Promise<void>
  close(): Promise<void>
  // Bulk operations
  clean(grace, limit, type): Promise<string[]>
  drain(delayed?: boolean): Promise<void>
  retryJobs(opts?): Promise<number>
  // Rate limiting
  setGlobalConcurrency(n): Promise<void>
  setGlobalRateLimit(config): Promise<void>
  // Schedulers
  upsertJobScheduler(name, schedule, template?): Promise<void>
  getRepeatableJobs(): Promise<...>
  removeJobScheduler(name): Promise<void>
  // Observability
  getMetrics(type, opts?): Promise<Metrics>
  getJobLogs(id, start?, end?): Promise<{ logs: string[], count: number }>
  getDeadLetterJobs(): Promise<Job[]>
  searchJobs(opts): Promise<Job[]>
  getWorkers(): Promise<WorkerInfo[]>
  // AI primitives
  getFlowUsage(parentJobId): Promise<FlowUsage>
  getFlowBudget(flowId): Promise<FlowBudget | null>
  readStream(jobId, opts?): Promise<StreamEntry[]>
  signal(jobId, name, data?): Promise<boolean>
  getSuspendInfo(jobId): Promise<SuspendInfo | null>
  getUsageSummary(opts?): Promise<UsageSummary>
  rateLimitGroup(groupKey, duration, opts?): Promise<void>
  // Vector search
  createJobIndex(opts?): Promise<void>
  vectorSearch(embedding, opts?): Promise<VectorSearchResult[]>
}
```

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:227–288`*

### 2.2 Worker

```typescript
class Worker<D = any, R = any> extends EventEmitter {
  constructor(
    name: string,
    processor: Processor<D, R> | string,  // string = file path for sandbox mode
    opts: WorkerOptions
  )
}

interface WorkerOptions {
  concurrency?: number           // per-worker, default 1
  globalConcurrency?: number     // cross-worker via Valkey
  prefetch?: number              // XREADGROUP COUNT
  blockTimeout?: number          // XREADGROUP BLOCK ms
  lockDuration?: number          // stall detection window (per-job override in JobOptions)
  stalledInterval?: number       // XAUTOCLAIM frequency
  maxStalledCount?: number       // max reclaims before fail
  promotionInterval?: number     // delayed job promotion interval
  limiter?: { max: number; duration: number }            // RPM sliding window
  tokenLimiter?: { maxTokens: number; duration: number; scope?: 'queue' | 'worker' | 'both' }  // TPM
  backoffStrategies?: Record<string, (attemptsMade: number, err: Error) => number>
  sandbox?: SandboxOptions       // run in child process
  batch?: { size: number; timeout?: number }             // bulk batch mode
  events?: boolean               // disable XADD event emission (for throughput)
  metrics?: boolean              // disable HINCRBY metrics (for throughput)
}
```

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:312–328`*

### 2.3 JobOptions

```typescript
interface JobOptions {
  jobId?: string                   // custom ID
  delay?: number                   // ms before eligible
  priority?: number                // 0 = highest; max 2^21
  lifo?: boolean                   // LIFO list instead of stream
  ordering?: {
    key: string                    // per-key ordering + group concurrency
    concurrency?: number
    rateLimit?: RateLimitConfig    // sliding window per group key
    tokenBucket?: TokenBucketConfig
  }
  cost?: number                    // token cost for token-bucket rate limiting
  attempts?: number                // retry attempts
  backoff?: {
    type: 'fixed' | 'exponential' | string   // 'string' = custom strategy name
    delay: number
    jitter?: number
  }
  timeout?: number                 // per-job timeout (throws on breach)
  lockDuration?: number            // override worker-level stall window for this job
  removeOnComplete?: boolean | number | { age: number; count: number }
  removeOnFail?: boolean | number | { age: number; count: number }
  deduplication?: {
    id: string
    ttl?: number
    mode?: 'simple' | 'throttle' | 'debounce'
  }
  parent?: { queue: string; id: string }      // single-parent (tree flow)
  parents?: Array<{ queue: string; id: string }> // multi-parent (DAG)
  ttl?: number                     // job time-to-live
  fallbacks?: Array<{              // AI: model fallback chain
    model: string
    provider?: string
    metadata?: Record<string, unknown>
  }>
}
```

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:403–426`*

### 2.4 Flows / DAG / Workflows

**FlowProducer** — parent/child trees where a parent only becomes runnable after all children succeed. Atomically enqueued via `glidemq_addFlow`.

```typescript
const flow = new FlowProducer({ connection });
await flow.add({
  name: 'aggregate', queueName: 'reports', data: {},
  children: [
    { name: 'fetch-sales', queueName: 'data', data: { region: 'eu' } },
    { name: 'fetch-returns', queueName: 'data', data: { region: 'eu' } },
  ],
});
```

**DAG** — multi-parent dependency graphs. Jobs are submitted level-by-level (reverse topological order). Cycle detection via `CycleError`.

```typescript
import { dag } from 'glide-mq';
await dag([
  { name: 'A', queueName: 'tasks', data: {} },
  { name: 'B', queueName: 'tasks', data: {}, deps: ['A'] },
  { name: 'C', queueName: 'tasks', data: {}, deps: ['A'] },
  { name: 'D', queueName: 'tasks', data: {}, deps: ['B', 'C'] },  // diamond
], connection);
```

**Workflow helpers**: `chain(name, jobs, connection)`, `group(name, jobs, connection)`, `chord(name, groupJobs, callbackJob, connection)`

**Dynamic children**: `job.moveToWaitingChildren()` — parent pauses itself until dynamically-spawned children complete; processor re-runs from top on re-entry.

> *Source: `avifenesh/glide-mq:docs/WORKFLOWS.md`*

### 2.5 Schedulers (Repeatable Jobs)

5-field cron + timezone + fixed-interval, bounded schedulers:

```typescript
await queue.upsertJobScheduler('daily-report', {
  cron: '0 0 * * *',
  tz: 'America/New_York',
  // OR: every: 60000,  // ms
  // limit: 10,         // bounded
});
```

> *Source: `avifenesh/glide-mq:src/scheduler.ts`*

### 2.6 Events

```typescript
const events = new QueueEvents('tasks', { connection });
events.on('completed', ({ jobId, returnvalue }) => { ... });
events.on('failed', ({ jobId, failedReason }) => { ... });
events.on('progress', ({ jobId, data }) => { ... });
events.on('added' | 'stalled' | 'paused' | 'resumed', handler);
// AI events (via SSE proxy):  'usage', 'suspended', 'budget-exceeded'
```

`QueueEvents` internally uses `XREAD BLOCK` on the `glide:{queueName}:events` stream.

### 2.7 Deduplication Modes

Three modes:
- **simple** — block duplicate jobId for `ttl` ms; second add returns `null`
- **throttle** — accept first, block subsequent within window
- **debounce** — accept last, delay previous within window

All enforced by `glidemq_dedup` Lua function atomically.

### 2.8 Request-Reply (RPC)

`queue.addAndWait(name, data, opts)` adds a job and polls until it completes/fails, returning the result. SSE-based variant available over HTTP proxy.

### 2.9 Broadcast / Pub-Sub

`Broadcast` + `BroadcastWorker` — NATS-style subject filtering, independent per-subscriber retries. Uses a dedicated stream per broadcast channel. Every subscriber receives every message. Not dependency-linked.

---

## 3. Architecture Internals

### 3.1 Data Structures

The complete Redis/Valkey key schema (all hash-tagged to `{queueName}`):

```
glide:{queueName}:id             String     — auto-increment job ID counter
glide:{queueName}:stream         Stream     — ready jobs, consumed via XREADGROUP
glide:{queueName}:scheduled      ZSet       — delayed + priority staging (score = priority*2^42 + ts)
glide:{queueName}:job:{id}       Hash       — job data, opts, state, timestamps, return value, cost, usage:*
glide:{queueName}:completed      ZSet       — score = completed timestamp
glide:{queueName}:failed         ZSet       — score = failed timestamp
glide:{queueName}:events         Stream     — lifecycle events (XREAD BLOCK for QueueEvents)
glide:{queueName}:meta           Hash       — paused, concurrency, rate limiter state
glide:{queueName}:deps:{id}      Set        — child job IDs for parent (flow tracking)
glide:{queueName}:parents:{id}   Set        — parent refs for DAG multi-parent
glide:{queueName}:parent:{id}    Hash       — parent queue + job ID reference
glide:{queueName}:dedup          Hash       — deduplication entries
glide:{queueName}:rate           Hash       — global rate limiter counters
glide:{queueName}:schedulers     Hash       — scheduler entries (name → next_run_ts)
glide:{queueName}:ordering       Hash       — per-key sequence counters
glide:{queueName}:group:{key}    Hash       — group state (active count, TB tokens, etc.)
glide:{queueName}:groupq:{key}   ZSet       — group-limited job wait list
glide:{queueName}:lifo           List       — LIFO jobs (RPUSH/RPOP)
glide:{queueName}:jstream:{id}   Stream     — per-job LLM token output stream
glide:{queueName}:signals:{id}   List       — signals to suspended job
glide:{queueName}:suspended      ZSet       — suspended jobs (score = timeout deadline)
glide:{queueName}:budget:{flowId} Hash      — flow-level budget state
glide:{queueName}:tpm            Hash       — token-per-minute limiter state
glide:{queueName}:ratelimited    ZSet       — rate-limited jobs waiting for window reset
```

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:11–42`*

### 3.2 Atomicity Mechanism — Valkey Functions, NOT EVAL

**Critical design detail:** GlideMQ uses **`FUNCTION LOAD` + `FCALL`**, not per-call `EVAL`/`EVALSHA`. The entire Lua library (44 functions, ~42KB source in `src/functions/glidemq.lua`) is loaded once to the server and persists across restarts (stored in RDB/AOF). This is fundamentally different from BullMQ which uses 53 ephemeral EVAL scripts subject to NOSCRIPT errors.

```lua
#!lua name=glidemq
-- glidemq.lua — loaded once via FUNCTION LOAD
redis.register_function('glidemq_addJob', function(keys, args) ... end)
redis.register_function('glidemq_completeAndFetchNext', function(keys, args) ... end)
-- ... 42 more functions
```

> *Source: `avifenesh/glide-mq:src/functions/glidemq.lua:1–5`*

The key functions and what they do atomically:

| Function | Keys | What it does |
|---|---|---|
| `glidemq_addJob` | 4 | INCR id, HSET job hash, XADD stream or ZADD scheduled, XADD event |
| `glidemq_completeAndFetchNext` | 5 | **1 RTT core**: XACK + ZADD completed + HSET + XADD event + XREADGROUP next |
| `glidemq_fail` | 6 | XACK + ZADD failed or ZADD scheduled (retry w/ backoff) + HSET + XADD event |
| `glidemq_reclaimStalled` | 2 | XAUTOCLAIM on stream, HSET stalledCount, move to failed if limit exceeded |
| `glidemq_addFlow` | N | Atomic parent+children creation + dep wiring |
| `glidemq_completeChild` | 4 | SREM from deps set, if empty → re-queue parent |
| `glidemq_dedup` | 5 | Check dedup hash, skip or add based on mode |
| `glidemq_suspend` | 4 | Move active → suspended ZSet, release group slot |
| `glidemq_signal` | 5 | Deliver signal to suspended job, re-queue it |
| `glidemq_recordUsageAndCheckBudget` | 1 | Increment usage counters, check budget limits |

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:133–178`*

### 3.3 Blocking Reads

The `Worker` uses two separate client connections:
- **`commandClient`** (non-blocking) — XACK, HSET, FCALL for complete/fail/promote
- **`blockingClient`** (blocking-only, dedicated) — `XREADGROUP BLOCK {timeout}` — never shared with other commands

```
Worker
  ├── commandClient  (XACK, HSET, FCALL, scheduler loop)
  ├── blockingClient (XREADGROUP BLOCK only)
  └── schedulerLoop  (uses commandClient — promote delayed, reclaim stalled)
```

Consumer group: `glide:{queueName}:workers`; each Worker instance = consumer `worker-{uuid}`.

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:196–211`*

### 3.4 Stalled-Job Recovery

Uses **`XAUTOCLAIM`** (Redis 6.2+ / Valkey), not lock-renewal polling. The `schedulerLoop` calls `glidemq_reclaimStalled` periodically at `stalledInterval` ms:

1. `XAUTOCLAIM` retrieves PEL entries older than `lockDuration`
2. `stalledCount` is incremented on the job hash
3. If `stalledCount <= maxStalledCount` (default 1) → redispatch to stream
4. If exceeded → `glidemq_fail` → moves to failed ZSet

This design means one crash = one retry; chronic crashes = clean `failed` state.

> *Source: `avifenesh/glide-mq:docs/DURABILITY.md`*

### 3.5 Priority Encoding

Score in scheduled ZSet: `(priority * 2^42) + timestamp_ms`

Priority 0 (highest) always sorts before priority 1 regardless of timestamp. Non-delayed priority jobs get `timestamp = 0` so they promote immediately. Max priority: `2^21` (matches BullMQ range).

> *Source: `avifenesh/glide-mq:docs/ARCHITECTURE.md:89–96`*

---

## 4. AI-Native Features

GlideMQ declares 7 "AI-native primitives" built directly into the core API. These are not an external plugin — they live in the `Job`, `Worker`, and `FlowProducer` classes:

### 4.1 Cost Tracking (Usage Reporting)

```typescript
await job.reportUsage({
  model: 'gpt-5.4',
  provider: 'openai',
  tokens: { input: 50, output: 200 },
  totalTokens: 250,
  costs: { total: 0.003 },
  totalCost: 0.003,
  costUnit: 'usd',
  latencyMs: 1200,
  cached: false,
});
```

Usage is stored in the job hash as `usage:model`, `usage:tokens` (JSON), `usage:totalCost`, etc. Also updates per-minute rolling buckets for `getUsageSummary()`.

Flow-level aggregation: `queue.getFlowUsage(parentJobId)` traverses the job tree and aggregates tokens/costs/models across all jobs in the flow.

Cross-queue rolling summary (without scanning job hashes): `queue.getUsageSummary({ queues: ['llm-tasks'], windowMs: 3_600_000 })`.

> *Source: `avifenesh/glide-mq:docs/OBSERVABILITY.md` — AI Usage Telemetry section*

### 4.2 Token Streaming (LLM output in real time)

```typescript
// Inside processor:
await job.stream({ type: 'token', content: 'Hello' });
await job.streamChunk('token', 'world');  // thin wrapper

// External consumer (long-poll):
const chunks = await queue.readStream(jobId, { block: 5000 });
```

Chunks stored in `glide:{queueName}:jstream:{id}` (a dedicated Stream). SSE endpoint at `/queues/:name/jobs/:id/stream` in the HTTP proxy for browser consumption.

### 4.3 Suspend / Resume (Human-in-the-Loop)

```typescript
// Inside processor:
await job.suspend({ timeout: 86400000, onResume: async (signals) => { ... } });
// throws SuspendError — worker catches it, sets job state to 'suspended'

// From outside (webhook, approval, etc.):
await queue.signal(jobId, 'approve', { reviewedBy: 'alice' });
// moves job back to stream, processor re-runs with job.signals populated
```

Suspended jobs stored in `glide:{queueName}:suspended` ZSet (score = timeout deadline). `glidemq_sweepSuspended` Lua function fails timed-out suspended jobs.

### 4.4 Fallback Chains (Model Failover)

```typescript
await queue.add('inference', { prompt: '...' }, {
  fallbacks: [
    { model: 'gpt-5.4-mini', provider: 'openai' },
    { model: 'claude-3-opus', provider: 'anthropic' },
  ],
  attempts: 3,
});

// In worker:
const model = job.currentFallback?.model ?? 'gpt-5.4';  // advances on each retry
```

`job.currentFallback` is computed from `job.fallbackIndex` (persisted in job hash) and `job.opts.fallbacks`.

### 4.5 TPM Rate Limiting (Tokens Per Minute)

```typescript
const worker = new Worker('ai', handler, {
  connection,
  tokenLimiter: { maxTokens: 100_000, duration: 60_000, scope: 'both' },
  limiter: { max: 100, duration: 60_000 },  // RPM (combine for dual-axis)
});
```

Token consumption tracked via `job.reportTokens(n)`. State stored in `glide:{queueName}:tpm` (Valkey-side) and/or in-memory based on `scope`.

### 4.6 Budget Caps

```typescript
const flow = new FlowProducer({ connection });
await flow.add(flowJob, {
  budget: {
    maxTotalTokens: 500_000,
    maxTotalCost: 5.00,
    costUnit: 'usd',
    onExceeded: 'fail',  // or 'pause'
  },
});
```

Budget state in `glide:{queueName}:budget:{flowId}`. `glidemq_recordUsageAndCheckBudget` atomically increments and checks. When exceeded, subsequent jobs in the flow fail or pause (configurable).

### 4.7 Per-Job Lock Duration

```typescript
await queue.add('inference', { prompt: '...' }, { lockDuration: 120_000 });  // 2-min lock
```

Overrides `WorkerOptions.lockDuration` per job, allowing short locks for classifiers and long locks for multi-minute LLM calls.

### 4.8 Vector Search

Via `@glidemq/speedkey`'s `GlideFt` module (requires `valkey/valkey-bundle` with Valkey Search 1.1+):

```typescript
await queue.createJobIndex({ /* FT.CREATE schema */ });
await job.storeVector('embedding', float32Array);
const results = await queue.vectorSearch(queryEmbedding, { topK: 5 });
```

> *Source: `avifenesh/speedkey:README.md` — GlideFt section*

---

## 5. Observability

### 5.1 Job Logs

```typescript
await job.log('Step 1 done');  // appended to job hash (list field)
const { logs, count } = await queue.getJobLogs(jobId, 0, 49);  // paginated
```

### 5.2 Metrics

`queue.getMetrics('completed' | 'failed', opts?)` returns per-minute time-series with `{ count, avgDuration }` data points. Buckets retained 24 hours, auto-trimmed server-side with zero extra RTTs.

### 5.3 OpenTelemetry Integration — Details

OTel is a **zero-code-change optional integration** via `@opentelemetry/api` peer dep. The library detects it at runtime via `require('@opentelemetry/api')` in a try/catch:

```typescript
// src/telemetry.ts — runtime detection
let otelApi: OTelApi | null = null;
try {
  otelApi = require('@opentelemetry/api') as OTelApi;
} catch { /* no-op tracing */ }
```

**Install and it works** — no code changes needed. Or provide your own tracer:

```typescript
import { setTracer } from 'glide-mq';
setTracer(trace.getTracer('my-service', '1.0.0'));
```

**Instrumented operations and span attributes:**

| Operation | Span name | Key attributes |
|---|---|---|
| `queue.add()` | `glide-mq.queue.add` | `glide-mq.queue`, `glide-mq.job.name`, `glide-mq.job.id`, `glide-mq.job.delay`, `glide-mq.job.priority` |
| `flowProducer.add()` | `glide-mq.flow.add` | `glide-mq.queue`, `glide-mq.flow.name`, `glide-mq.flow.childCount` |

> *Source: `avifenesh/glide-mq:docs/OBSERVABILITY.md` — OpenTelemetry Integration section*  
> *Source: `avifenesh/glide-mq:src/telemetry.ts`*

**⚠️ Notable gaps:**
- **Only 2 span types** are currently instrumented (queue.add and flow.add). Worker processing, job completion, and failure do not emit spans.
- **No W3C Trace Context propagation** in job data — there is no mechanism to propagate `traceparent` from the producer to the worker across the queue boundary. Spans are purely local to each client process.
- Span types: `startSpan` → `setAttribute` → `setStatus({ code: OK|ERROR })` → `recordException` → `end()`. No `startActiveSpan` / context propagation.
- `isTracingEnabled()` is exported for conditionally initializing the tracer.

### 5.4 AI Usage Telemetry

Per-minute usage buckets in `glide:{queueName}:metrics:*` keys updated atomically via `glidemq_recordUsageAndCheckBudget`. `getUsageSummary()` aggregates across queues without scanning job hashes. SSE events include `usage`, `suspended`, `budget-exceeded` event types.

> *Source: `avifenesh/glide-mq:docs/OBSERVABILITY.md` — AI Usage Telemetry section*

### 5.5 Dashboard (`@glidemq/dashboard`)

- **Package**: `@glidemq/dashboard` v0.4.1, `avifenesh/glidemq-dashboard`
- **Tech stack**: Express middleware, single self-contained HTML SPA (`src/dashboard-ui.html`, 81KB), SSE for live updates
- **How it works**: `createDashboard(queues, opts?) → Express Router` — drop-in mount, no frontend build required
- **Features**: queue counts/states, job details (with AI fields), pause/resume/drain/retry/obliterate, SSE real-time events, per-action authorization callbacks
- **AI endpoints exposed**: `/api/queues/:name/flows/:id/usage`, `/api/queues/:name/flows/:id/budget`, `/api/usage/summary`, `/api/queues/:name/jobs/:id/stream`
- **SSE events**: `added | completed | failed | progress | stalled | heartbeat | usage | suspended | budget-exceeded`

```typescript
import express from 'express';
import { createDashboard } from '@glidemq/dashboard';
app.use('/dashboard', createDashboard([queue], {
  readOnly: false,
  authorize: (req, action) => action !== 'queue:obliterate' || isAdmin(req),
}));
```

> *Source: `avifenesh/glidemq-dashboard:README.md`*

**⚠️ Limitations:**
- **Express-only** — no Hono, Fastify, or Koa adapter. Cannot be mounted on a Deno-native HTTP server.
- Middleware only, not a standalone server — requires an existing Express app.
- Does not connect to Valkey/Redis directly — requires live `Queue` instances passed in.

---

## 6. Runtime Compatibility — Deno / NAPI Analysis

### 6.1 Node.js Version Requirement

`engines.node: ">=20"` — Node.js 20+ required.

> *Source: `avifenesh/glide-mq:package.json:10`*

### 6.2 Module Format

`"type": "commonjs"` in package.json. The published package is **CJS only** (`dist/index.js`, `dist/testing.js`, `dist/proxy/index.js`). There is no `"exports"` ESM entry point.

> *Source: `avifenesh/glide-mq:package.json:5`*

### 6.3 Deno Compatibility — ⚠️ UNCERTAIN, Likely Problematic

The README explicitly mentions Deno as a supported target:

> *"The Rust NAPI client requires a server-side runtime (Node.js 20+, Bun, or **Deno with NAPI support**)."*  
> *Source: `avifenesh/glide-mq:README.md`*

However, the internal HANDOVER.md (a developer-facing file) states explicitly:

> **"Bun/Deno NAPI compatibility testing: still pending from 0.14.0 handover."**  
> *Source: `avifenesh/glide-mq:HANDOVER.md` — Open Threads section*

The current version is 0.15.4. This means Deno/Bun NAPI testing has been **deferred across the entire 0.15.x release series**. Deno compatibility is stated as a goal but is **not verified** by the author.

**Technical obstacles for Deno:**

1. **NAPI `.node` binary**: `@glidemq/speedkey` ships a platform-specific compiled Rust `.node` binary. Deno supports `npm:` specifiers and NAPI, but NAPI modules must expose the correct binary path in their `package.json` `"node"` / platform-specific fields. Deno's NAPI support works for many packages but has edge cases with complex native module loading.

2. **CJS-only output**: `glide-mq` itself is CommonJS. Deno can import CJS modules via `npm:glide-mq`, but the import path semantics differ and sub-path exports (`glide-mq/testing`, `glide-mq/proxy`) must be correctly resolved.

3. **`require('@opentelemetry/api')` in telemetry.ts**: Uses Node.js `require()` dynamically. This works under Deno's Node.js compat layer, but is less robust than ESM dynamic import.

4. **Process signal handling**: `process.on('SIGTERM', ...)` in examples — standard Node.js pattern, supported in Deno's Node compat.

5. **Worker sandbox mode** (`src/sandbox/`) uses `child_process` or `worker_threads` — Deno supports these via Node compat but with restrictions.

**Recommendation for NetScript**: Do **not** assume Deno compatibility. The NAPI binary for `@glidemq/speedkey` is the primary risk. Even if Deno's NAPI layer works, testing is needed. This is a **significant integration blocker** until verified.

### 6.4 ESM / CJS

The library is CJS. The hono-api example (`examples/hono-api/package.json`) uses `"type": "module"` (ESM) and imports `glide-mq` without issues under tsx/Node.js, so the CJS-as-dependency-in-ESM pattern works normally in Node.

---

## 7. License, Maturity, Release Cadence, Bus Factor, Ecosystem

### 7.1 License

**Apache-2.0** — permissive, patent grant included, compatible with commercial use.

> *Source: `avifenesh/glide-mq:package.json`, `avifenesh/glidemq-dashboard:package.json`*

### 7.2 Version History & Release Cadence

From CHANGELOG:

| Version | Date | Highlights |
|---|---|---|
| 0.15.4 | 2026-06-04 | Interval scheduler drift fix, CI correctness, Valkey 9.1.0 CI images |
| 0.15.3 | ~2026-05 | DAG fixes, long-running job heartbeats, broadcast retry isolation, CVE deps |
| 0.15.2 | ~2026-05 | Batch priority/LIFO, `lockDuration`-aware stall reclaim (LIBRARY_VERSION 84) |
| 0.15.1 | ~2026-04 | Debounce+ordering deadlock fix (LIBRARY_VERSION 81) |
| 0.15.0 | ~2026-03 | HTTP proxy parity expansion, flow HTTP API, getUsageSummary |

The 0.15.x series is recent (April–June 2026). The library is young and iterating rapidly — 5 minor versions in ~3 months.

> *Source: `avifenesh/glide-mq:HANDOVER.md`*

### 7.3 Maturity

- **Early-stage commercial product** — described as "replacing BullMQ" but no evidence of production adoption at scale outside the author's own infrastructure
- 2,414 tests in the non-fuzzer test suite (as of 0.15.4)
- CI: green on main with Vitest
- No external contributors visible in the commit history fetched (single-author commits: `avifenesh / aviarchi1994@gmail.com`)
- Stars: Not directly queryable via these tools, but the `glidemq-hono` repo has 13 stars, other repos 2–5 stars → small ecosystem, very early discovery phase

### 7.4 Bus Factor — ⚠️ HIGH RISK

**Bus factor: 1.** All code, documentation, commit activity, and the critical `@glidemq/speedkey` NAPI bridge are maintained by a single developer. There is no org, no co-maintainer, no corporate backing visible. The HANDOVER.md file itself is consistent with a solo developer self-documenting for continuity.

`@glidemq/speedkey` is especially concerning: it is a **personal fork** of the valkey-glide Rust core with a custom NAPI binding layer. If the author becomes unavailable, both the queue library and its Rust transport layer would be unmaintained.

> *Source: `avifenesh/speedkey:README.md` — "speedkey will be replaced by valkey-glide when..."*

### 7.5 Ecosystem Packages (All by avifenesh)

| Package | Repo | Stars | Purpose |
|---|---|---|---|
| `glide-mq` | `avifenesh/glide-mq` | — | Core library (v0.15.4) |
| `@glidemq/speedkey` | `avifenesh/speedkey` | — | Rust NAPI client (valkey-glide fork) |
| `@glidemq/dashboard` | `avifenesh/glidemq-dashboard` | 3 | Express web UI |
| `@glidemq/hono` | `avifenesh/glidemq-hono` | 13 | Hono middleware + REST API + SSE |
| `@glidemq/fastify` | `avifenesh/glidemq-fastify` | 3 | Fastify plugin |
| `@glidemq/hapi` | `avifenesh/glidemq-hapi` | 3 | Hapi plugin |
| `@glidemq/nestjs` | `avifenesh/glidemq-nestjs` | 5 | NestJS decorators/DI module |

There is no `@glidemq/deno` package. No JSR package.

> *Source: `avifenesh/glidemq-dashboard:README.md` — links section; `github-mcp-server-search_repositories` results*

---

## 8. The Hono-API Example

**Source: `avifenesh/glidemq-examples:examples/hono-api/index.ts`**

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { glideMQ, glideMQApi, QueueRegistryImpl } from '@glidemq/hono';
import type { GlideMQEnv } from '@glidemq/hono';
import type { Job } from 'glide-mq';

const connection = { addresses: [{ host: 'localhost', port: 6379 }] };

const registry = new QueueRegistryImpl({
  connection,
  queues: {
    emails:  { processor: processEmail, concurrency: 5 },
    orders:  { processor: processOrder, concurrency: 3 },
  },
});

const app = new Hono<GlideMQEnv>();
app.use(glideMQ(registry));         // injects registry into c.var.glideMQ
app.route('/api/queues', glideMQApi());  // typed REST API + SSE

app.post('/send-email', async (c) => {
  const { queue } = c.var.glideMQ.get('emails');
  const job = await queue.add('send', await c.req.json());
  return c.json({ jobId: job?.id ?? null });
});
```

**Integration pattern observations:**
1. Uses `@glidemq/hono` middleware package, not `glide-mq` directly in Hono routing
2. Runs on **`@hono/node-server`** (Node.js adapter) — not on Deno natively
3. `QueueRegistryImpl` manages queue + worker lifecycle with `registry.closeAll()` on `SIGTERM`
4. `glideMQApi()` exposes a full typed REST surface: job CRUD, pause/resume, schedulers, SSE, flow API, usage summary, broadcast

The `@glidemq/hono` README states the middleware is "**multi-runtime — runs on Node, Bun, Deno, and edge runtimes**", but this claim is about the Hono middleware layer itself, not about the underlying `@glidemq/speedkey` NAPI binary. The example actually uses `@hono/node-server`, confirming Node.js as the runtime for this pattern.

> *Source: `avifenesh/glidemq-examples:examples/hono-api/index.ts`, `avifenesh/glidemq-hono:README.md`*

**For NetScript**: If NetScript's Hono integration is intended for Deno, the `@hono/node-server` adapter would need to be replaced with Deno.serve + the question of whether `@glidemq/speedkey`'s NAPI binary loads on Deno remains open (see §6.3).

---

## 9. The Dashboard Repo

### 9.1 Tech Stack

- **Language**: TypeScript compiled to CJS (`tsconfig.json` → `dist/`)
- **Server layer**: Express 4 or 5 (peer dep) — pure Express `Router`
- **Frontend**: A single embedded HTML file (`src/dashboard-ui.html`, 81KB) served as a static asset. No React, Vue, or build step. Vanilla JS + inline CSS inside the HTML file.
- **Real-time**: SSE (`/api/events`) — browser-side `EventSource` polling
- **Test stack**: Vitest + supertest

### 9.2 APIs It Consumes

The dashboard calls `Queue` instance methods directly (not HTTP-to-Valkey):

```typescript
createDashboard(queues: Queue[], opts?: DashboardOptions): Router
```

It calls: `queue.getJobCounts()`, `queue.getJobs()`, `queue.getJob()`, `queue.getJobLogs()`, `queue.pause()`, `queue.resume()`, `queue.drain()`, `queue.obliterate()`, `queue.retryJobs()`, `queue.getFlowUsage()`, `queue.getFlowBudget()`, `queue.getUsageSummary()`, `queue.readStream()` — all synchronously in the same Node.js process.

REST API surface:

| Method | Path | Description |
|---|---|---|
| GET | `/api/queues` | All queue counts + metrics |
| GET | `/api/queues/:name` | Queue details + recent jobs |
| GET | `/api/queues/:name/jobs/:id` | Single job details |
| POST | `/api/queues/:name/jobs` | Add job |
| POST | `/api/queues/:name/pause` | Pause |
| POST | `/api/queues/:name/resume` | Resume |
| POST | `/api/queues/:name/jobs/:id/retry` | Retry failed job |
| DELETE | `/api/queues/:name/jobs/:id` | Remove job |
| POST | `/api/queues/:name/drain` | Drain waiting jobs |
| POST | `/api/queues/:name/obliterate` | Obliterate queue |
| GET | `/api/events` | SSE lifecycle stream |
| GET | `/api/queues/:name/flows/:id/usage` | Flow usage |
| GET | `/api/queues/:name/flows/:id/budget` | Flow budget |
| GET | `/api/usage/summary` | Rolling usage summary |
| GET | `/api/queues/:name/jobs/:id/stream` | Job SSE stream |

> *Source: `avifenesh/glidemq-dashboard:README.md`*

### 9.3 Embeddability

The dashboard is an Express middleware — **embeddable in any Express 4/5 application** with one line. Not embeddable in Hono, Fastify, Koa, or Deno's native HTTP server without wrapping. No standalone server mode (there's a `demo.ts` that creates a minimal Express server for dev use).

**Authorization** is handled via an `authorize(req, action): boolean | Promise<boolean>` callback that fires per-action.

---

## Summary Assessment for NetScript Integration

### Critical Blockers

| Issue | Severity | Notes |
|---|---|---|
| **Garnet incompatibility** | 🔴 Hard blocker | `FUNCTION LOAD`/`FCALL` not supported by Garnet. NetScript's Garnet seam cannot use GlideMQ without replacing the transport layer. |
| **Deno NAPI unverified** | 🔴 Risk | `@glidemq/speedkey` NAPI binary on Deno is explicitly untested (HANDOVER: "still pending"). Must be verified before any Deno integration. |

### Significant Concerns

| Issue | Severity | Notes |
|---|---|---|
| **Bus factor: 1** | 🟠 High | Single developer, personal NAPI fork, no org backing. GlideMQ is a dependency risk for production infrastructure. |
| **CJS-only output** | 🟡 Medium | Works with Deno `npm:` CJS compat but suboptimal. No ESM entry point. |
| **Early maturity** | 🟡 Medium | 0.15.x series, fast iteration, small ecosystem (2–13 stars). Docs are excellent but adoption is nascent. |
| **Express-only dashboard** | 🟡 Medium | @glidemq/dashboard requires Express. NetScript would need Express as a host or a different dashboard approach. |
| **OTel span coverage** | 🟡 Medium | Only 2 span types (queue.add, flow.add). No worker-side spans, no W3C traceparent propagation across queue boundary. |

### Genuine Strengths Relevant to NetScript

| Strength | Relevance |
|---|---|
| **1 RTT per job** via `glidemq_completeAndFetchNext` | Direct throughput benefit in any queue seam |
| **Zero-config cluster** via hash-tag `{queueName}` | Compatible with ElastiCache/Valkey cluster |
| **44 Valkey Functions** (no NOSCRIPT errors, persistent) | More reliable than BullMQ's EVAL scripts under high concurrency |
| **Hono integration** (`@glidemq/hono`) | Direct alignment with NetScript's Hono-based HTTP layer |
| **At-least-once with `XAUTOCLAIM` recovery** | Reliable over BullMQ-style lock-based stall detection |
| **AI-native primitives** built into core | LLM pipeline orchestration without external tooling |
| **TestQueue/TestWorker** (in-memory) | Zero-Valkey dependency for unit tests |
| **Apache-2.0** | Permissive license, no LGPL/GPL concerns |
| **IAM auth** for ElastiCache/MemoryDB | AWS-native deployment path |

---

## Research Limitations & Workarounds

1. **`glidemq.dev` docs unreachable** — DNS resolution failed for `glidemq.dev` in this environment. All guide-page content was sourced from the GitHub docs/ directory which mirrors the website content. Assessed as complete.

2. **NPM download stats** — npmjs.com unreachable. Cannot confirm weekly download figures.

3. **Dragonfly FUNCTION LOAD** — whether Dragonfly's implementation of `FUNCTION LOAD` is sufficient for GlideMQ's Lua library is **unverified**. The Lua library makes heavy use of `redis.register_function()` and the Streams + consumer group API. Needs empirical testing.

4. **Deno NAPI binary resolution** — The specific mechanism by which `@glidemq/speedkey`'s `node_modules/.../speedkey.*.node` binary would be found and loaded under Deno's `npm:` compatibility layer is untested. This is the single highest-risk item for Deno integration.

5. **Star counts for `glide-mq` core repo** — could not retrieve directly; proxy signal via ecosystem repos (2–13 stars) suggests very early adoption.

6. **`LIBRARY_VERSION` 93** (0.15.3) and **LIBRARY_VERSION** (0.15.4 — 94 or higher implied) — the Lua library has been revised frequently across 0.15.x, meaning clients must reload on version mismatch. This is handled automatically but means cluster rolling upgrades need coordination.