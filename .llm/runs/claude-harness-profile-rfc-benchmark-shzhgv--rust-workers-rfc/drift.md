# Drift Log: rust-workers RFC (run 2)

## 2026-08-19 — R2-D-1: Push deferred while PR #1678 awaits merge

- **What:** RFC-2 work is committed locally only until #1678 merges (its IMPL-EVAL PASS is
  head-pinned); then the designated branch restarts from origin/main and this work ships on a
  new draft PR. Exception: the run-1 CPU/RAM scale amendment DID push to #1678 (owner review
  request, 2026-08-19).
- **Severity:** minor · **Action:** accept (recorded in supervisor.md § Push policy)

## 2026-08-19 — R2-D-2: Documented "web-worker"/"subprocess" runner modes are unimplemented

- **What:** `docs/site/background-processing/workers.md:218-231` documents three runner modes
  with web-worker ("one V8 isolate per worker, ~20-40 MB each; WORKERS_CONCURRENCY sets the
  process pool size for parallel job execution") as scaffold default. In code, `WorkerPool`
  wraps `InProcessJobRunner` (`plugins/workers/worker/job-runner-pool.ts:25-40`), `poolSize` is accepted unused, `workerUrl` is read but never materialized into an isolate, and no Web Worker is instantiated anywhere in `plugins/workers` +
  `packages/plugin-workers-core` (grep evidence in research R9). The `worker.ts:156` log line
  "Starting with Web Worker pool (N workers)" is misleading.
- **Expected:** Docs describe implemented behavior. **Actual:** Job execution is single-isolate
  cooperative async; measured: 4.5 jobs/s at every K, event loop blocked for full job duration.
- **Severity:** significant (docs/code drift + real capability gap; motivates RFC-2 Tier 3)
- **Action:** propose-update — RFC-2 proposed-change #1 (docs truthing) + Tier 3; follow-up
  issue candidate after evaluator review.
- **Evidence:** research.md R9-R11; results-parallel.md P1.

## 2026-08-19 — R2-D-3: FFI docs say --unstable; stable --allow-ffi suffices on 2.9.5

- **What:** docs.deno.com FFI page still requires `--unstable`; empirically `Deno.dlopen` works
  with `--allow-ffi` alone on Deno 2.9.5 (verified in run 1 and used throughout run 2).
- **Severity:** minor (upstream doc lag; cited honestly in both RFCs) · **Action:** accept

## 2026-08-19 — R2-D-4: wasmbuild requires an exact wasm-bindgen pin

- **What:** jsr:@deno/wasmbuild 0.23.0 fails unless the crate depends on wasm-bindgen exactly
  0.2.108 ("must have a dependency on wasm-bindgen 0.2.108 (found 0.2.127)"); with the pin the
  pipeline builds and the generated module runs at native speed (P5 53.9 ms).
- **Severity:** minor (sharp edge worth documenting in the Tier-2 recipe) · **Action:** accept
