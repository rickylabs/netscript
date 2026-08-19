# Worklog — claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc

## Design

Lightweight checkpoint (investigation run; same conventions as run 1's Design):

- **Public surface (run-dir):** `bench/parallel/run-parallel.ts` (P1-P4 suite, correctness-
  asserted per rep, heartbeat liveness metric), `bench/parallel/rust-lcg-par/` (zero-dep cdylib:
  `lcg_run`, `lcg_run_parallel` via std::thread), `bench/parallel/worker-lcg.ts` (P2 isolate
  body), `bench/parallel/wasmbuild-lcg/` (official pipeline project), `run-wasmbuild.ts` (P5),
  `report-parallel.ts` (script-generated results — house rule).
- **Vocabulary:** shapes P1-P5; K ∈ {1,2,4,8}; jitterMs = max 5 ms-heartbeat delay (liveness).
- **Constants:** MINSTD 48271/2147483647 seed 42, N=1e7, reps 10 (P5: 300) — run-1 continuity.
- **Correctness:** every rep asserts acc; P3's split has a TS mirror computing per-K expected
  values (per-thread seed+k); heartbeat settle-before-stop fix applied after smoke showed
  starved-callback zeros (recorded below).
- **Slices:** plan.md T1-T6. **Deferred:** plan.md § Deferred scope.

## PLAN-EVAL

**N/A** per plan.md L3 (owner-directed scope; measurement mechanics locked in plan). IMPL-EVAL
mandatory on the new PR (cloud route).

## Slice log

### T1 — bootstrap + research + plan (local)

supervisor.md (push policy), research.md (R1-R12: bridge ecosystem incl. deno_core archival,
rusty_v8 cadence, wasmbuild/deno_bindgen/Node-API/FFI-nonblocking; internal parallelism audit
R9-R11), plan.md (L1-L5 incl. pre-registered verdict framing), drift R2-D-1..D-2.

### T2/T3 — parallel suite (local)

Zero-dep cdylib built (312 KB). Smoke exposed a measurement defect: the liveness heartbeat's
starved callback never fired before stop() on synchronous paths (P1/P3 jitter read 0 while the
loop was actually blocked) — fixed with settle-before-stop; full suite rerun (10 reps × 4 shapes
× K∈{1,2,4,8}, every rep correctness-asserted, zero mismatches).

Headline (results-parallel.md): P1 today = 4.5 jobs/s at every K with jitter ≈ wall (878 ms at
K=4); P2 isolates = 14.8 jobs/s at K=4, ~3.6 MB/isolate, 35 ms spawn jitter; P3 within-job split
= 48.3→12.6 ms at 4 threads (3.8×) but blocking; **P4 nonblocking FFI = 79.3 jobs/s at K=4
(17.6×) with 1.9 ms p50 / 4.2 ms max jitter** — passes the L5 liveness bar; K=8 waves (pool ≈ 4)
and jitter degrades (34.8 max) → size K to cores.

### T4 — wasmbuild pipeline (local)

crates.io reachable through proxy. First attempt failed on wasmbuild 0.23.0's exact wasm-bindgen
pin (R2-D-4); with `=0.2.108` the official pipeline built `lib/rs_lib.{js,d.ts,wasm}`; P5: 300
measured calls, acc asserted, p50 53.9 ms ≈ Rust binary 53.1 / raw WASM 54.2 — native speed with
typed, JSR-publishable DX.

### T5 — RFC (local)

`rfcs/0000-rust-workers-integration.md` (Draft): three-tier adoption (task recipe / in-process
compute plane / implement the documented web-worker mode), bridge matrix (wasmbuild, FFI+
nonblocking, deno_bindgen, Node-API, rusty_v8/deno_core-embedding-rejected), thread-safety
story, measured tables, unresolved questions.

## Gate results

| Slice | Gate | Result | Evidence |
| --- | --- | --- | --- |
| T2 | Cross-shape correctness (every rep asserts acc; P3 TS mirror per K) | PASS | zero mismatches across 460 measured samples |
| T3 | Suite completeness (4 shapes × 4 K × 10 reps + P5 300) + results-parallel.md script-generated | PASS | report-parallel.ts output "460 samples" |
| T3 | Liveness-metric validity (starved-heartbeat defect fixed before full run) | PASS | worklog T2/T3 note; smoke vs final jitter values |
| T4 | Official wasmbuild pipeline end-to-end | PASS | lib/ artifacts + P5 acc-asserted series |
| T5 | RFC fmt + zero TBD + link integrity (2 checker false-positives triaged: `.so/.dylib/.dll`, `denoland/deno` are prose) | PASS | fmt-clean; grep TBD = 0; path check |
| T5 | Fitness/quality gates | N/A | no packages/plugins source touched |
