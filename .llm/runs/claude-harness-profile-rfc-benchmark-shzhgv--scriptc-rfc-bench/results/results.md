# Benchmark results — scriptc task runtime vs polyglot baselines

Generated 2026-08-19T21:20:35.445Z by `bench/harness/report.ts` from `results/raw/*.jsonl`.
All numbers computed from raw samples; percentiles are nearest-rank. Series: warmup 20
discarded, measured completions only. See plan.md L1-L5 for locked methodology and
pre-registered verdict criteria; drift.md D-2/D-5 for hosting/backend substitutions.

## Environment manifest

| Pin | Value |
| --- | --- |
| os | Ubuntu 24.04.4 LTS |
| kernel | 6.18.5-fc-v20 |
| cpuModel | Intel(R) Xeon(R) Processor @ 2.10GHz |
| cores | 4 |
| deno | deno 2.9.5 (stable, release, x86_64-unknown-linux-gnu) |
| scriptc | 0.0.32 |
| clang | Ubuntu clang version 18.1.3 (1ubuntu1) |
| rustc | rustc 1.94.1 (e408947bf 2026-03-25) |
| node | v22.22.2 |
| netscriptWorkspace | repo @ 7adb3dd0ee3f6e8e297bda0533b3bfb39f78b549 |
| queueProvider | deno-kv-native (local sqlite, createQueue default — research F15) |
| hosting | in-process worker task listener (not Aspire-hosted; drift D-2, D-5) |

## Through-the-queue (end-to-end enqueue → completed)

| Subject | Workload | c | n | fail | e2e p50 | p95 | p99 | p999 (ms) | exec-wall p50 | adapter-dur p50 | tasks/s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-deno | long | 1 | 300 | 0 | 330.5 | 374.5 | 393.3 | 394.5 | 270.2 | 270.0 | 3.0 |
| A-deno | long | 4 | 300 | 0 | 331.1 | 379.0 | 392.4 | 403.3 | 274.3 | 274.0 | 12.0 |
| A-deno | short | 1 | 300 | 0 | 108.0 | 151.7 | 157.9 | 178.3 | 50.6 | 51.0 | 9.2 |
| A-deno | short | 16 | 300 | 0 | 222.4 | 301.5 | 337.3 | 355.7 | 81.5 | 82.0 | 69.0 |
| A-deno | short | 4 | 300 | 0 | 108.8 | 156.7 | 177.3 | 201.1 | 48.4 | 48.0 | 35.3 |
| A-deno | short | 64 | 300 | 0 | 940.6 | 1200.6 | 1248.5 | 1270.9 | 108.4 | 108.0 | 63.9 |
| B-scriptc | long | 1 | 300 | 0 | 284.3 | 325.9 | 334.1 | 401.8 | 225.3 | 225.0 | 3.5 |
| B-scriptc | long | 4 | 300 | 0 | 286.7 | 332.4 | 343.4 | 371.2 | 227.9 | 228.0 | 13.9 |
| B-scriptc | short | 1 | 300 | 0 | 64.0 | 107.6 | 111.4 | 138.5 | 6.8 | 7.0 | 15.6 |
| B-scriptc | short | 16 | 300 | 0 | 119.9 | 167.4 | 184.7 | 190.0 | 9.6 | 10.0 | 125.2 |
| B-scriptc | short | 4 | 300 | 0 | 78.2 | 117.7 | 125.7 | 184.0 | 6.9 | 7.0 | 51.7 |
| B-scriptc | short | 64 | 300 | 0 | 367.7 | 471.1 | 489.3 | 635.2 | 21.1 | 21.0 | 154.3 |
| C-executable-control | long | 1 | 300 | 0 | 275.7 | 325.8 | 330.9 | 333.1 | 225.2 | 225.0 | 3.6 |
| C-executable-control | long | 4 | 300 | 0 | 285.9 | 326.9 | 336.1 | 343.5 | 226.2 | 226.0 | 14.0 |
| C-executable-control | short | 1 | 300 | 0 | 65.5 | 105.9 | 111.8 | 129.5 | 6.8 | 7.0 | 15.5 |
| C-executable-control | short | 16 | 300 | 0 | 112.3 | 162.7 | 174.1 | 178.7 | 10.2 | 10.0 | 133.0 |
| C-executable-control | short | 4 | 300 | 0 | 79.0 | 110.4 | 117.6 | 124.9 | 7.0 | 7.0 | 52.7 |
| C-executable-control | short | 64 | 300 | 0 | 340.7 | 505.4 | 541.6 | 542.3 | 25.2 | 25.0 | 164.8 |
| D-rust | long | 1 | 300 | 0 | 109.3 | 153.2 | 159.1 | 160.7 | 53.1 | 53.0 | 9.2 |
| D-rust | long | 4 | 300 | 0 | 116.1 | 153.4 | 161.9 | 165.6 | 52.9 | 53.0 | 34.6 |
| D-rust | short | 1 | 300 | 0 | 63.7 | 105.4 | 109.7 | 125.5 | 4.9 | 5.0 | 16.0 |
| D-rust | short | 16 | 300 | 0 | 108.9 | 145.2 | 177.4 | 182.9 | 7.4 | 7.0 | 136.5 |
| D-rust | short | 4 | 300 | 0 | 70.2 | 116.1 | 119.6 | 120.8 | 5.1 | 5.0 | 55.9 |
| D-rust | short | 64 | 300 | 0 | 371.7 | 555.8 | 564.4 | 567.2 | 28.7 | 28.0 | 158.9 |

## Direct executor.execute() (dispatch-tax isolation)

| Subject | Workload | c | n | fail | e2e p50 | p95 | p99 | p999 (ms) | exec-wall p50 | adapter-dur p50 | tasks/s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A-deno | long | 1 | 300 | 0 | 268.9 | 284.4 | 320.6 | 333.4 | 268.9 | 269.0 | 3.7 |
| A-deno | short | 1 | 300 | 0 | 45.7 | 51.8 | 56.4 | 64.7 | 45.6 | 46.0 | 21.6 |
| B-scriptc | long | 1 | 300 | 0 | 224.1 | 230.0 | 237.8 | 242.7 | 224.1 | 224.0 | 4.4 |
| B-scriptc | short | 1 | 300 | 0 | 6.1 | 7.0 | 7.7 | 17.5 | 6.1 | 6.0 | 159.7 |
| C-executable-control | long | 1 | 300 | 0 | 223.6 | 229.2 | 234.2 | 246.3 | 223.6 | 223.0 | 4.5 |
| C-executable-control | short | 1 | 300 | 0 | 6.1 | 6.7 | 7.3 | 18.1 | 6.1 | 6.0 | 160.7 |
| D-rust | long | 1 | 300 | 0 | 52.5 | 53.8 | 55.3 | 88.5 | 52.4 | 52.0 | 18.9 |
| D-rust | short | 1 | 300 | 0 | 4.4 | 5.1 | 5.8 | 11.5 | 4.4 | 4.0 | 221.6 |

## Per-subprocess peak RSS (task self-report, VmHWM)

| Subject | Workload | c | median vmHwm (KB) | samples |
| --- | --- | --- | --- | --- |
| B-scriptc | long | 1/direct | 2404 | 300 |
| B-scriptc | long | 1/queue | 2400 | 300 |
| B-scriptc | long | 4/queue | 2404 | 300 |
| B-scriptc | short | 1/direct | 2404 | 300 |
| B-scriptc | short | 1/queue | 2400 | 300 |
| B-scriptc | short | 16/queue | 2400 | 300 |
| B-scriptc | short | 4/queue | 2400 | 300 |
| B-scriptc | short | 64/queue | 2404 | 300 |
| C-executable-control | long | 1/direct | 2400 | 300 |
| C-executable-control | long | 1/queue | 2400 | 300 |
| C-executable-control | long | 4/queue | 2400 | 300 |
| C-executable-control | short | 1/direct | 2400 | 300 |
| C-executable-control | short | 1/queue | 2400 | 300 |
| C-executable-control | short | 16/queue | 2400 | 300 |
| C-executable-control | short | 4/queue | 2400 | 300 |
| C-executable-control | short | 64/queue | 2400 | 300 |
| D-rust | long | 1/direct | 2088 | 300 |
| D-rust | long | 1/queue | 2088 | 300 |
| D-rust | long | 4/queue | 2088 | 300 |
| D-rust | short | 1/direct | 2088 | 300 |
| D-rust | short | 1/queue | 2088 | 300 |
| D-rust | short | 16/queue | 2088 | 300 |
| D-rust | short | 4/queue | 2088 | 300 |
| D-rust | short | 64/queue | 2088 | 300 |
| A-deno | (sandboxed — cannot self-report; see rss-probe below and drift D-6) | | | |

## Cold-spawn probe (`/usr/bin/time -v`, direct spawn, 100k workload, 30 reps)

| Command | max RSS median (KB) | max RSS p95 | wall p50 (ms) |
| --- | --- | --- | --- |
| A-deno-sandboxed | 43400 | 43808 | 45.2 |
| A-deno-allow-all | 43280 | 43536 | 44.3 |
| B-scriptc | 2524 | 2616 | 5.0 |
| D-rust | 2152 | 2280 | 3.3 |

## Execution-boundary microbenchmarks (in-process, labeled DIRECT — not queue numbers)

| Boundary | Workload | Phase | n | p50 (ms) | p95 | p99 |
| --- | --- | --- | --- | --- | --- | --- |
| G-inprocess-js | short | warm | 300 | 2.18 | 2.38 | 2.60 |
| E-wasm | short | warm | 300 | 0.54 | 0.57 | 0.59 |
| E-wasm | short | cold | 300 | 0.55 | 0.60 | 0.64 |
| F-ffi | short | warm | 300 | 0.48 | 0.51 | 0.54 |
| F-ffi | short | cold | 300 | 0.66 | 0.78 | 0.87 |
| G-inprocess-js | long | warm | 300 | 219.43 | 228.07 | 241.55 |
| E-wasm | long | warm | 300 | 54.16 | 54.63 | 54.87 |
| E-wasm | long | cold | 50 | 54.22 | 54.69 | 57.51 |
| F-ffi | long | warm | 300 | 48.62 | 49.27 | 50.21 |
| F-ffi | long | cold | 50 | 48.69 | 49.11 | 49.34 |

## Worker-host RSS (harness process VmHWM per series, KB)

| Series | host peak RSS (KB) |
| --- | --- |
| A-deno_long_direct_c1 | 177312 |
| A-deno_long_queue_c1 | 178240 |
| A-deno_long_queue_c4 | 220576 |
| A-deno_short_direct_c1 | 187224 |
| A-deno_short_queue_c1 | 190232 |
| A-deno_short_queue_c16 | 221656 |
| A-deno_short_queue_c4 | 221504 |
| A-deno_short_queue_c64 | 227820 |
| B-scriptc_long_direct_c1 | 179772 |
| B-scriptc_long_queue_c1 | 179288 |
| B-scriptc_long_queue_c4 | 216396 |
| B-scriptc_short_direct_c1 | 188184 |
| B-scriptc_short_queue_c1 | 188996 |
| B-scriptc_short_queue_c16 | 198828 |
| B-scriptc_short_queue_c4 | 209036 |
| B-scriptc_short_queue_c64 | 220264 |
| C-executable-control_long_direct_c1 | 178808 |
| C-executable-control_long_queue_c1 | 179160 |
| C-executable-control_long_queue_c4 | 213128 |
| C-executable-control_short_direct_c1 | 188908 |
| C-executable-control_short_queue_c1 | 194240 |
| C-executable-control_short_queue_c16 | 220872 |
| C-executable-control_short_queue_c4 | 208412 |
| C-executable-control_short_queue_c64 | 222728 |
| D-rust_long_direct_c1 | 188276 |
| D-rust_long_queue_c1 | 187784 |
| D-rust_long_queue_c4 | 221752 |
| D-rust_short_direct_c1 | 183728 |
| D-rust_short_queue_c1 | 191956 |
| D-rust_short_queue_c16 | 220584 |
| D-rust_short_queue_c4 | 194832 |
| D-rust_short_queue_c64 | 221076 |

## Pre-registered verdict inputs (plan.md L5)

- Queue e2e p50, short, c=1: A-deno = 108.0 ms; B-scriptc = 64.0 ms; **improvement = 40.7%** (criterion: <20% → recipe/customAdapters; ≥20% + RSS ratio ≥5× → built-in defensible)
- Sanity B≈C: C p50 = 65.5 ms (same binary; delta is run-to-run noise floor)
- Executor-wall p50, short, c=1: A = 50.6 ms; B = 6.8 ms (runtime-only delta = 43.9 ms)

