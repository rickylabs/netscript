# Benchmark results — Go task runtime paths (run 4)

Generated 2026-08-19T23:25:21.312Z by `report-4.ts` from `results/raw/*.jsonl`.
Series: warmup 20 discarded, 300 measured. G1 through the ExecutableRuntimeAdapter (the
recipe seam Go uses — no go TaskType exists). Run-1 manifest applies.

## Series (queue = enqueue→completed through the production dispatch path)

| Subject | Workload | Mode | c | n | fail | e2e p50 | p95 (ms) | exec-wall p50 | vmHwm med (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G1-go | long | direct | 1 | 300 | 0 | 62.5 | 65.2 | 62.5 | 2276 |
| G1-go | long | queue | 1 | 300 | 0 | 119.6 | 167.1 | 62.6 | 2276 |
| G1-go | short | direct | 1 | 300 | 0 | 5.4 | 6.5 | 5.4 | 2292 |
| G1-go | short | queue | 1 | 300 | 0 | 65.0 | 111.3 | 6.2 | 2292 |
| G1-go | short | queue | 16 | 300 | 0 | 121.6 | 164.4 | 8.5 | 2296 |

## Cold-spawn probe (`/usr/bin/time -v`, 100k workload, 30 reps)

| Command | max RSS med (KB) | wall p50 (ms) | CPU p50 (user+sys, ms) |
| --- | --- | --- | --- |
| G1-go | 2192 | 3.9 | 0.0 |
| PY-python3 | 9316 | 36.8 | 30.0 |

## Boundary — G2 official js/wasm (wasm_exec.js) + G3 c-shared FFI in Deno (DIRECT)

| Boundary | long-call p50 (ms) | p95 | n | boot (ms) |
| --- | --- | --- | --- | --- |
| G2-go-jswasm | 54.4 | 55.3 | 120 | 76.6 |
| G3-go-cshared-ffi | 55.7 | 57.0 | 120 | — |

