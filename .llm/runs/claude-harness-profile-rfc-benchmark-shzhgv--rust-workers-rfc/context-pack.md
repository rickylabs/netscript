# Context Pack — claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc

## State (2026-08-19, closed)

- PR **#1683** (`rfcs/0000-rust-workers-integration.md` Draft + parallelism suite), IMPL-EVAL
  **PASS** (OpenHands DeepSeek, run 32309331096, evaluated head b0cd3d4; mirror in
  `evaluate.md`; LOW wording finding applied in 71da2fb). `status:ready-merge`; merge is the
  owner's call. Follow-up filed: **#1684** (R2-D-2 runner-modes docs truthing / Tier-3 pool).
- Headline data (`results/results-parallel.md`, 460 samples): P1 today 4.5 jobs/s + 878 ms
  blocked; P2 isolates 3.3× @3.6 MB; P3 split 3.8×; **P4 nonblocking FFI 79.3 jobs/s = 17.6×,
  jitter 1.9/4.2 ms**; P5 wasmbuild native-speed 53.9 ms (exact wasm-bindgen pin R2-D-4).
- RFC verdict: tiered (recipe / compute-plane recipes / implement web-worker mode); embedding
  rejected (rusty_v8 Chrome cadence, deno_core archived into Deno monorepo).

## Rerun

`cargo build --release` in `bench/parallel/rust-lcg-par/`; `deno task wasmbuild` in
`bench/parallel/wasmbuild-lcg/` (needs wasm-bindgen =0.2.108); then
`deno run --allow-all --unstable-ffi bench/parallel/run-parallel.ts --reps 10 --out
results/raw/parallel.jsonl` and `report-parallel.ts`. Run-1 environment manifest applies.
