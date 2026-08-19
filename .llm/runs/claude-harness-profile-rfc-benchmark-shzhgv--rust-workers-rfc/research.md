# Research — claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc

## Re-baseline

- Carried-in source: run 1 (`../claude-harness-profile-rfc-benchmark-shzhgv--scriptc-rfc-bench/`)
  — subject-D (Rust binary) and boundary E/F/G data reused directly (same environment manifest,
  same MINSTD workload, IMPL-EVAL PASS on the numbers). This run adds parallelism-specific
  measurements only.
- Owner directive (in-session, 2026-08-19): RFC #2 on Rust adoption in workers — polyglot task
  angle + integrating Rust to push the worker itself (parallelizing, thread safety) vs the
  current Deno implementation; deep attention to rusty_v8 and the official/native bridge
  ecosystem (denoland/wasmbuild et al.) for Deno×Rust complementarity.

## Findings — external (official Deno×Rust bridge ecosystem)

| # | Finding | Source |
| - | ------- | ------ |
| R1 | **rusty_v8** = Rust bindings to V8's C++ API, built "to support the Deno project"; zero-cost goal ("do not introduce additional call overhead"); enables isolates, contexts, snapshots, running JS from Rust; ships prebuilt static libs (V8 = 600k+ lines C++ not rebuilt by users); **major version tracks Chrome, new major every 4 weeks** — a real maintenance treadmill for any direct embedder. | github.com/denoland/rusty_v8 |
| R2 | **deno_core** (JsRuntime, `#[op2]` ops, extensions, serde_v8) is the official embedding layer above rusty_v8 — and its standalone repo was **archived 2026-04-02, merged into denoland/deno** (read-only). Embedding deno_core now means tracking the main Deno monorepo. | github.com/denoland/deno_core (archived banner) |
| R3 | **wasmbuild** — official Deno-org tool: `deno task wasmbuild` / `deno install jsr:@deno/wasmbuild`; compiles a Rust crate to WASM and generates JS/TS bindings via wasm-bindgen into `./lib` (`--out`), importable as a plain module (`import { add } from "./lib/rs_lib.js"`); output **publishable to JSR** (Deno ≥2.1, ≥2.1.5 via JSR); `--inline` for environments without Wasm imports. This is the paved road for userland Rust-in-Deno. | github.com/denoland/wasmbuild |
| R4 | **deno_bindgen** — `#[deno_bindgen]` proc-macro + CLI generating typed TS glue over `Deno.dlopen` ("as-if written by hand" codegen, ~6.9 ns basic-call latency on M1, Explicit Resource Management support). Active, Deno-org. The FFI analogue of wasmbuild. | github.com/denoland/deno_bindgen |
| R5 | **FFI**: `nonblocking: true` foreign functions "run on a dedicated blocking thread and return a `Promise`" — i.e. native Rust compute off the event loop with async integration. Docs page still says `--unstable` + `--allow-ffi`; **empirically on Deno 2.9.5 `--allow-ffi` alone suffices** (run 1, verified; doc lag noted). | docs.deno.com FFI; run-1 empirical |
| R6 | **Node-API**: "Deno supports Node-API addons used by popular npm packages like esbuild, npm:sqlite3, npm:duckdb… supported when a local node_modules/ directory is present" + `--allow-ffi`; lifecycle build scripts need `--allow-scripts`. A third native path (npm-ecosystem-shaped; requires nodeModulesDir — friction against NetScript's JSR-first posture). | docs.deno.com node |
| R7 | **Web Workers**: module workers supported (`new Worker(import.meta.resolve('./worker.ts'), { type: 'module' })`); each is its own V8 isolate — true multi-core JS parallelism at isolate-startup + per-isolate-RSS cost (measured this run). | docs.deno.com; measured |
| R8 | Deno itself **is** Rust underneath: KV (sqlite + listenQueue), timers, fetch, crypto are deno_core ops. "Integrating Rust into the worker" is therefore partly already true for IO hot paths — the open gap is **user-workload compute and parallel scheduling**, which live in JS today. | architecture; run-1 F15 (KV native queue) |

## Findings — internal (current worker parallelism reality)

| # | Finding | Source |
| - | ------- | ------ |
| R9 | **The documented "web-worker" runner mode does not exist in code.** Docs claim three runner modes with "web-worker (one V8 isolate per worker, ~20-40 MB each)" as scaffold default and `WORKERS_CONCURRENCY` as a parallel pool size. In code, `WorkerPool` wraps `InProcessJobRunner` (`plugins/workers/worker/job-runner-pool.ts:25-40`); `poolSize` and `workerUrl` options are **accepted but never read**; `initialize()` is a no-op; repo-wide grep shows **zero Web Worker (`new Worker(specifier)`) instantiations** in `plugins/workers` + `packages/plugin-workers-core`. The `WORKER_RUNTIMES` constant (`domain/constants.ts:83`) exists as vocabulary only. | code + docs/site/background-processing/workers.md:218-231 |
| R10 | Job "concurrency" is therefore **cooperative async in a single isolate**: `WORKERS_CONCURRENCY` bounds in-flight dispatches, not CPU parallelism. CPU-bound job handler code serializes on one core; a 219 ms compute job at c=4 gives ~4× *latency*, not 4× throughput. Tasks (polyglot) are the exception — they get process-level parallelism via subprocess spawn (run-1 c-sweep: native task subjects scaled to ~125-165 tasks/s on 4 cores). | code; run-1 results.md |
| R11 | The worker's "Starting with Web Worker pool (N workers)" log line (`worker.ts:156`) is misleading given R9 — worth a docs/code reconciliation issue regardless of this RFC's fate. | worker.ts:156 |
| R12 | Thread-safety model today: single-isolate JS = no data races by construction, at the price of no parallelism; cross-isolate would use structured-clone message passing; Rust in-process (FFI) brings real threads — safety must then come from Rust's ownership model (`Send`/`Sync` enforced at compile time) + a C-ABI boundary that passes only plain data. | analysis |

## Benchmark subjects (this run; MINSTD workload, run-1 manifest)

- **P1 sequential JS** (baseline, = run-1 G): 10M loop in-process.
- **P2 Web Worker fan-out**: K isolates × 10M loop; measure wall, per-isolate startup, RSS.
- **P3 FFI blocking parallel**: cdylib `lcg_run_parallel(n, seed, threads)` using `std::thread`
  (zero deps — crates.io reachability untested), called synchronously.
- **P4 FFI nonblocking**: same symbol with `nonblocking: true` — K concurrent Promises;
  event-loop liveness measured (timer jitter while compute runs).
- **P5 wasmbuild**: attempt the official pipeline on the same crate (`deno task wasmbuild`);
  if the toolchain (wasm-bindgen fetch) is unavailable in-container, record as drift and keep
  run-1's raw-WASM numbers as the WASM datum.
- Scaling axis: threads/workers K ∈ {1, 2, 4} (4 physical cores), plus oversubscription K=8.

## Open questions

- Does `cargo` reach crates.io through the proxy (needed only if P3 wants rayon — std::thread
  keeps it hermetic)? → resolve empirically; std::thread is the plan of record.
- wasmbuild in-container feasibility (downloads wasm-bindgen CLI?) → P5 resolves or drifts.
- Where does the RFC draw the line between "worker plugin ships it" (e.g. an FFI compute-pool
  helper) vs "recipe for userland" (wasmbuild library tasks)? → plan decision, informed by P3/P4.
