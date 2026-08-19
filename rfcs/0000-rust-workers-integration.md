---
rfc: 0000 # assigned by a maintainer at acceptance; keep 0000 while drafting
title: Rust adoption in Background Processing — tasks, and the worker itself
status: Draft # Draft | Discussion | FCP | Accepted | Rejected | Withdrawn
authors: ['@rickylabs']
created: 2026-08-19
tracking-issue: to be opened at Discussion (companion to the scriptc RFC's #1680)
target-milestone: Backlog / Triage
---

# Rust adoption in Background Processing — tasks, and the worker itself

Every quantitative claim traces to
`.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc/results/` (this run:
parallelism suite, wasmbuild pipeline) or to the scriptc RFC's run (`…--scriptc-rfc-bench/results/`
— subjects A–D, boundary E/F/G, CPU/RAM scale probes; IMPL-EVAL independently recomputed those
numbers). Same machine, same MINSTD workload, same pinned environment manifest across both runs.

## Summary

Rust already runs NetScript's worker hot paths — Deno's KV queue, timers, and IO are deno_core ops
over rusty_v8. What is _not_ Rust today is (1) user task compute and (2) the worker's parallel
execution model, and the second is the finding that motivates this RFC: **the documented "web-worker
(one V8 isolate per worker)" runner mode does not exist in code** — jobs execute as cooperative
async in a single isolate, so one CPU-bound handler freezes the entire worker (measured: a 220 ms
job blocks the event loop for 220 ms; K jobs serialize at 4.5 jobs/s regardless of
`WORKERS_CONCURRENCY`). This RFC proposes adopting Rust along the two axes the measurements
separate: **as tasks** (already proven through the `executable` seam — Rust binary, executor-side
4.9 ms vs deno's 50.6 ms, ~10 ms system CPU per message vs 57–73 ms) and **inside the worker** as an
in-process native compute plane: `nonblocking` FFI calls onto Rust threads delivered **17.6× the
throughput of today's model (79.3 vs 4.5 jobs/s at 4 cores) while keeping event-loop jitter under 5
ms**, and the official wasmbuild pipeline compiled the same kernel to a typed, JSR-publishable
module running at native speed (53.9 ms vs Rust binary 53.1 ms). Recommended shape: fix the
isolate-parallelism gap on the worker plane, publish the wasmbuild/FFI recipes on the compute plane,
and reject direct rusty_v8/deno_core embedding.

## Motivation

Three measured facts define the problem:

1. **Today's worker cannot use the machine for job compute.** `WorkerPool` wraps
   `InProcessJobRunner` (`plugins/workers/worker/job-runner-pool.ts:25-40`); its `poolSize` and
   `workerUrl` options are accepted but never read; there are **zero Web Worker instantiations** in
   `plugins/workers` + `packages/plugin-workers-core`; the `WORKER_RUNTIMES` values
   (`packages/plugin-workers-core/src/domain/constants.ts:83`) are vocabulary without
   implementation. Measured consequence (results-parallel.md, P1): K CPU-bound jobs run at 4.5
   jobs/s at every K, and the event loop is blocked for the full duration (jitter ≈ wall: 878 ms at
   K=4) — health checks, queue listeners, and SSE streams all stall. The docs' claim of "web-worker
   … parallel job execution" (workers.md:218-231) is currently aspirational (drift R2-D-2).
2. **JS compute is 4× off native on this workload.** In-process V8 runs the 10M-iteration kernel at
   219 ms; Rust at 53 ms; WASM at 54 ms (run-1 boundary data). Parallelism and native speed
   compound: 4 cores × 4.2× ≈ an order of magnitude on CPU-bound work.
3. **Rust as a task is already the measured ceiling** (run 1, subject D): executor-side 4.9 ms p50
   vs deno's 50.6 ms; ~10 ms system CPU per message vs 57–73 ms; 2.1 MB vs 43 MB RSS — with zero
   framework changes, through the existing `executable` adapter.

The cost of doing nothing: worker hosts saturate on runtime overhead (run-1 scale probe: the deno
task runtime alone drives 4 cores to 95–100% from 16 in-flight messages) or freeze on inline
compute, and the fix teams reach for — more replicas — buys 4.5 jobs/s per added host for work a
single host could do at 79 jobs/s.

## Guide-level explanation

Rust enters at three tiers, cheapest commitment first:

### Tier 1 — Rust as a task (works today; recipe)

```ts
export const transcode = defineTask('transcode')
  .runtime('executable')
  .entrypoint('./tasks/bin/transcode') // cargo build --release artifact
  .timeout(60_000);
```

Standard polyglot contract (argv/env in, last JSON line out). Proven end-to-end through the
production dispatch path in run 1. This is the right tier for **isolated, retryable units of work**
— the queue provides retry/idempotency/telemetry; the process boundary provides crash isolation. Its
floor is the ~5–6 ms process spawn plus the ~58–62 ms queue dispatch.

### Tier 2 — Rust as an in-process compute plane for jobs (recipes now, helper later)

For CPU-heavy sections _inside_ JS job handlers — no queue round-trip, no subprocess:

```ts
// wasmbuild route (sandboxed, JSR-publishable, typed):
import { simulate } from '@acme/pricing-kernel'; // wasmbuild output on JSR
const result = simulate(inputs); // native speed, in-process

// FFI route (maximum performance, trusted deployments):
const lib = Deno.dlopen('./native/libkernel.so', {
  simulate: { parameters: ['buffer', 'usize'], result: 'f64', nonblocking: true },
});
const price = await lib.symbols.simulate(buf, buf.length); // runs on a pool thread;
// the worker's event loop, health checks, and listeners stay live (measured: <5 ms jitter)
```

The `nonblocking: true` flag is the load-bearing detail: the call "runs on a dedicated blocking
thread and returns a Promise" — Rust threads do the compute, the isolate keeps serving. Rust's
`Send`/`Sync` ownership rules make the native side data-race-free at compile time; the FFI boundary
passes plain data only.

### Tier 3 — real isolate parallelism in the worker (framework change, this RFC's ask)

Implement the already-documented `web-worker` runner mode: a pool of K module Workers executing job
handlers, sized by `WORKERS_CONCURRENCY`. Measured (P2): 3.3× throughput at K=4 with ~3.6 MB per
isolate — and it composes with Tier 2 (a Web Worker running FFI/WASM compute gets native speed _and_
full main-isolate liveness).

## Reference-level explanation

### What Rust already owns (and why "rewrite the worker in Rust" is the wrong frame)

Deno **is** a Rust program: rusty_v8 binds V8's C++ API ("zero additional call overhead"; major
version tracks Chrome, a new major every 4 weeks), and deno_core — the official embedding layer
(JsRuntime, `#[op2]` ops, extensions) — was archived as a standalone repo on 2026-04-02 and folded
into the main `denoland/deno` monorepo. Every hot IO path the worker relies on (KV native queue
`enqueue`/`listenQueue`, timers, fetch, crypto) already executes as Rust ops. The worker's JS layer
is orchestration: registry lookups, idempotency claims, execution-state writes, dispatch. Two
consequences:

- The **wins left on the table are compute and parallel scheduling**, not IO plumbing — which is
  what the measurements target.
- **Embedding deno_core/rusty_v8 directly** (a Rust worker binary hosting isolates) would make
  NetScript a runtime maintainer on Chrome's 4-week cadence against an API surface that now lives
  inside the Deno monorepo — for capabilities (isolate pools, snapshots) that `Worker` + FFI already
  expose from JS. Rejected under the pre-registered bar (plan.md L5: a capability the paved roads
  cannot deliver at all, not a speed delta — and the paved roads deliver).

### The measurements (results-parallel.md; 10M-iteration MINSTD, 4-core host, 10 reps/config)

| Shape                                   | K=1        | K=2  | K=4      | K=8  | Event-loop jitter @K=4                         |
| --------------------------------------- | ---------- | ---- | -------- | ---- | ---------------------------------------------- |
| P1 today: sequential JS in the isolate  | 4.5 jobs/s | 4.5  | 4.5      | 4.6  | **878 ms** (blocked)                           |
| P2 Web Worker pool (one job/isolate)    | 4.3        | 8.0  | 14.8     | 15.7 | 35 ms (spawn cost)                             |
| P3 FFI, one job split across K threads  | 20.7       | 40.6 | **79.3** | 55.6 | 9.7 ms (blocking call, shortened by the split) |
| P4 FFI `nonblocking`, K concurrent jobs | 20.5       | 40.9 | **79.3** | 72.4 | **1.9 ms**                                     |
| P5 wasmbuild module (single call)       | 18.6       | —    | —        | —    | n/a (blocking in-isolate)                      |

Readings:

- **P4 is the sweet spot for job-embedded compute**: 17.6× today's throughput at K=4, with the main
  isolate essentially undisturbed (p50 1.9 ms, max 4.2 ms — passes the pre-registered <10 ms
  liveness bar). At K=8 the pool waves (110 ms for 8 jobs ≈ 2×K=4) and jitter worsens (max 34.8 ms):
  size K to physical cores.
- **P3 shows near-linear within-job scaling** (48.3 → 12.6 ms at 4 threads, 3.8×) — the shape for
  latency-critical single jobs — but as a _blocking_ call it stalls the isolate for its full
  duration; use it behind P4's `nonblocking` or inside a Web Worker, never bare on the main isolate.
- **P2 (isolate pool) is the general-purpose fix**: it parallelizes _arbitrary JS handlers_ (no Rust
  required), costs ~3.6 MB per isolate (vs 43 MB per deno subprocess), and its 35 ms spawn jitter
  amortizes away with a persistent pool (spawn once, feed jobs — the proposed Tier 3 keeps warm
  workers, unlike this cold-spawn measurement).
- **P5 proves the official pipeline**: `deno task wasmbuild` (jsr:@deno/wasmbuild 0.23.0) compiled
  the kernel and generated typed bindings that run at native speed (53.9 ms ≈ Rust binary 53.1 ms).
  One sharp edge measured: wasmbuild requires an **exact** wasm-bindgen pin (=0.2.108 for 0.23.0; a
  caret dependency fails the build with a clear error).

### The bridge matrix (how Deno and Rust complement, most-official-first)

| Bridge                             | Status                                                                                                           | Isolation                                                    | Best for                                                           | Costs                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **wasmbuild** (Deno-org)           | Official tool, JSR-publishable output, Deno ≥2.1                                                                 | WASM sandbox, capability imports                             | Shareable compute kernels; anything a library task should be       | JS-boundary copies for large buffers; no threads in practice; exact wasm-bindgen pin      |
| **FFI + `nonblocking`** (built-in) | Stable in 2.9.5 with `--allow-ffi` alone (docs still say `--unstable` — doc lag, verified empirically)           | **None** — host address space; native crash kills the worker | Maximum-performance trusted kernels; thread-pool compute (P3/P4)   | `Send`/`Sync` discipline is the safety story; per-platform `.so/.dylib/.dll` build matrix |
| **deno_bindgen** (Deno-org)        | Active; `#[deno_bindgen]` macro + CLI generates typed `dlopen` glue ("as-if written by hand", ~7 ns basic calls) | Same as FFI                                                  | Removing hand-written FFI signatures once an FFI kernel stabilizes | Adds a codegen step                                                                       |
| **Node-API addons**                | Supported for npm packages when `node_modules/` exists + `--allow-ffi` (+ `--allow-scripts` for build hooks)     | Same as FFI                                                  | Consuming existing npm-native libraries                            | npm-shaped: `nodeModulesDir` requirement clashes with NetScript's JSR-first scaffolds     |
| **rusty_v8 / deno_core embedding** | rusty_v8: Chrome-cadence majors; deno_core: archived into the Deno monorepo                                      | N/A (you become the host)                                    | Building a runtime, which NetScript is not                         | Permanent runtime-maintenance treadmill; rejected above                                   |

Thread-safety summary the RFC commits to documenting: today's single-isolate JS is race-free by
having no parallelism; Web Workers keep race-freedom via structured-clone message passing; Rust-side
threads keep it via ownership (`Send`/`Sync` checked at compile time; the P3/P4 kernel shares
nothing and joins). The one genuinely unsafe shape — shared mutable state across the FFI boundary —
is prohibited by recipe convention: plain-data arguments and return values only.

### Proposed changes (ordered by commitment)

1. **Docs truthing (immediate, docs-only).** State that runner modes other than in-process are not
   yet implemented (or implement Tier 3 first and keep the docs); fix the misleading "Starting with
   Web Worker pool" log line (`worker.ts:156`). Companion to drift R2-D-2.
2. **Tier 2 recipes (docs-only).** Background Processing how-tos for the wasmbuild route (kernel →
   JSR package → import in a job) and the FFI `nonblocking` route (with the K≤cores sizing rule, the
   liveness numbers, and the thread-safety conventions above).
3. **Tier 3: implement `web-worker` runner mode (framework, `plugins/workers` +
   `plugin-workers-core`).** Make `WorkerPool` honor `poolSize`/`workerUrl`: a persistent pool of
   module Workers consuming job dispatches over `postMessage`, sized by `WORKERS_CONCURRENCY`, with
   per-isolate lifecycle (respawn on crash — isolating handler failures better than today),
   `AbortSignal` propagation, and the existing execution-state contract. The dormant option types
   and the documented semantics already specify this; P2 numbers bound the win (3.3× at K=4) and
   cost (~3.6 MB/isolate).
4. **Optional Tier 2 helper (`@netscript/plugin-workers-core`, later).** A small
   `defineNativeKernel({ lib, symbols })` wrapper standardizing dlopen setup, `nonblocking`
   defaults, K-sizing, and disposal — extracted from the recipe only after real usage, per
   wrap-don't-reinvent.

Task-side Rust (Tier 1) needs nothing: it is the run-1 `executable` recipe, and the scriptc RFC's
phased plan already covers the native-task story (scriptc for TS-authored short tasks; Rust where
compute or ecosystem demands it — the two are complements: identical startup/footprint class, 4.2×
apart on compute).

## Drawbacks

1. **FFI abandons the sandbox** — same class as the existing non-deno runtimes
   (`workers-non-deno-task-sandbox-boundary` debt), but in-process: a native crash takes the worker
   host, and `--allow-ffi` in the worker's permission set weakens the isolate's own sandbox.
   Mitigations are conventions (plain-data boundary, kernel review), not enforcement. The sandboxed
   alternative (wasmbuild) costs boundary copies and lacks threads.
2. **A second language enters job code paths.** Tier 2 kernels need cargo in CI, a per-platform
   artifact matrix, and Rust review capacity. (Tier 3 needs none of this — it is pure TypeScript.)
3. **Web Worker pool complexity**: worker lifecycle, backpressure, and structured-clone
   serialization limits on job payloads; per-isolate memory bounds fanout (~3.6 MB each is cheap,
   but K is still a config to size).
4. **wasmbuild pinning friction**: exact wasm-bindgen version coupling means kernel crates carry a
   toolchain-dictated dependency line.

## Rationale and alternatives

- **Why not "just scale out"?** Run-1 scale data: a host saturated by runtime overhead at 95–100%
  CPU delivers ~69 tasks/s; the same host at 79 jobs/s in-process (P4) or 125–165 tasks/s (native
  subprocess tasks) has headroom left. Horizontal scaling multiplies whichever per-host number you
  start from.
- **Why not subprocess tasks for everything?** The queue path adds ~58–62 ms dispatch per message
  (run 1) — right for durable, retryable units; wrong for hot in-handler compute where P4's per-call
  overhead is ~0.5 ms.
- **Why not worker_threads-style shared memory (SharedArrayBuffer)?** Structured-clone message
  passing plus Rust-side threading covers the measured needs without importing shared-mutable-JS
  hazards; revisit only if profiling shows serialization dominating (unresolved question).
- **Why reject deno_core embedding but keep it documented?** Because the question will recur; the
  R1/R2 facts (Chrome-cadence majors, monorepo absorption) are the durable answer.

## Breaking changes and migration

None proposed here. Tier 3 activates a documented-but-dormant mode behind existing config
(`WORKER_RUNTIMES`, `WORKERS_CONCURRENCY`); in-process remains the default until the pool proves
itself behind a flag. Tiers 1–2 are recipes.

## Prior art

- Run 1 / scriptc RFC (PR #1678): dispatch-path benchmark methodology, subject D, boundary E/F/G,
  CPU/RAM scale probes, `TaskRuntimeAdapterLike` seam analysis.
- denoland/wasmbuild, deno_bindgen, rusty_v8 (goals + cadence), deno_core archival notice.
- Deno FFI `nonblocking` semantics (docs) + empirical stable-flag verification (this run).
- pydantic/monty (#1679) — the same in-process compute-plane pattern for Python.

## Unresolved questions

- Tier 3 pool mechanics: dispatch protocol (postMessage vs MessageChannel), backpressure, and
  whether the pool serves tasks' in-process modes too — needs its own design doc at implementation
  time (this RFC bounds the win/cost, not the design).
- P4's blocking-pool concurrency ceiling (waves at K=8 suggest a 4-thread pool on this host):
  confirm whether `DENO_UNSTABLE_*`/tokio sizing applies before publishing the sizing rule.
- Large-payload economics: at what buffer size do WASM/FFI boundary copies erase the compute win?
  (This run's kernel passes scalars only.)
- Whether `deno compile` of the worker host changes any of the FFI/WASM recipes.

## Future possibilities

- **WASM task runtime** (shared future with the scriptc RFC): the sandboxed, spawn-free quadrant
  both compilers reach; P5 shows the artifact side is production-grade today.
- **wasmbuild kernels as first-class scaffold artifacts** (`netscript generate kernel`).
- **A Rust `TaskRuntimeAdapterLike` host extension** if a future deployment needs custom dispatch
  below JS — the seam exists; the case does not yet.
- **monty (#1679)** on the same compute-plane seam for Python.
