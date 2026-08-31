# Parallelism suite results — rust-workers RFC (run 2)

Generated 2026-08-19T22:17:22.220Z by `report-parallel.ts` from raw JSONL.
Workload: 10M-iteration MINSTD (identical to run 1); 4-core host, run-1 environment
manifest applies. 10 reps/config (P5: 300). Correctness asserted on every rep.

| Shape | k | wall p50 (ms) | jobs/s | event-loop jitter p50 / max (ms) | RSS Δ p50 (MB) |
| --- | --- | --- | --- | --- | --- |
| P1-seq-js | 1 | 221.0 | 4.5 | 217.5 / 249.8 | — |
| P1-seq-js | 2 | 442.0 | 4.5 | 437.4 / 443.1 | — |
| P1-seq-js | 4 | 882.4 | 4.5 | 878.3 / 898.5 | — |
| P1-seq-js | 8 | 1752.6 | 4.6 | 1747.8 / 1885.5 | — |
| P2-web-worker | 1 | 230.9 | 4.3 | 4.7 / 10.6 | 3.8 |
| P2-web-worker | 2 | 248.5 | 8.0 | 15.7 / 20.4 | 3.6 |
| P2-web-worker | 4 | 269.5 | 14.8 | 35.4 / 41.1 | 3.6 |
| P2-web-worker | 8 | 510.7 | 15.7 | 122.8 / 153.0 | 3.9 |
| P3-ffi-split | 1 | 48.3 | 20.7 | 45.3 / 46.0 | — |
| P3-ffi-split | 2 | 24.7 | 40.6 | 21.7 / 22.1 | — |
| P3-ffi-split | 4 | 12.6 | 79.3 | 9.7 / 10.8 | — |
| P3-ffi-split | 8 | 18.0 | 55.6 | 13.8 / 16.6 | — |
| P4-ffi-nonblocking | 1 | 48.8 | 20.5 | 1.7 / 1.9 | — |
| P4-ffi-nonblocking | 2 | 48.9 | 40.9 | 1.6 / 1.9 | — |
| P4-ffi-nonblocking | 4 | 50.4 | 79.3 | 1.9 / 4.2 | — |
| P4-ffi-nonblocking | 8 | 110.6 | 72.4 | 11.1 / 34.8 | — |
| P5-wasmbuild | 1 | 53.9 | 18.6 | n/a | — |

Legend: P1 sequential JS in the main isolate (today's job-handler model); P2 K Web
Workers, one job each; P3 one job split across K std::threads via blocking FFI; P4 K
jobs as concurrent `nonblocking` FFI calls; P5 wasmbuild-generated module (single
call, k=1). Jitter = max delay of a 5 ms heartbeat on the main isolate during the
config — the event-loop liveness measure plan.md L5 gates on.

