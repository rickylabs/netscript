# Benchmark results — C#/.NET task runtime paths (run 3)

Generated 2026-08-19T22:54:04.013Z by `report-3.ts` from `results/raw/*.jsonl`.
Series: warmup 20 discarded; H1 measured 100, others 300. Dispatch through the REAL
`DotNetRuntimeAdapter` (H1 `.cs` file-based; H2/H3 direct-exec mode); H3x =
`ExecutableRuntimeAdapter` control. Run-1 manifest + `environment.json` deltas apply.

## Series (queue = enqueue→completed through the production dispatch path)

| Subject | Workload | Mode | c | n | fail | e2e p50 | p95 (ms) | exec-wall p50 | vmHwm med (KB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H1-dotnet-run | short | queue | 1 | 100 | 0 | 330.7 | 384.6 | 284.4 | 28060 |
| H2-dotnet-fd | long | direct | 1 | 300 | 0 | 90.7 | 95.2 | 90.7 | 24868 |
| H2-dotnet-fd | long | queue | 1 | 300 | 0 | 149.1 | 195.2 | 93.2 | 24868 |
| H2-dotnet-fd | short | direct | 1 | 300 | 0 | 38.9 | 42.9 | 38.9 | 24864 |
| H2-dotnet-fd | short | queue | 1 | 300 | 0 | 93.9 | 142.0 | 41.0 | 24864 |
| H2-dotnet-fd | short | queue | 16 | 300 | 0 | 205.9 | 271.8 | 70.1 | 24868 |
| H3-dotnet-aot | long | direct | 1 | 300 | 0 | 56.5 | 57.9 | 56.5 | 3364 |
| H3-dotnet-aot | long | queue | 1 | 300 | 0 | 113.8 | 160.1 | 57.1 | 3364 |
| H3-dotnet-aot | short | direct | 1 | 300 | 0 | 5.6 | 6.3 | 5.6 | 3376 |
| H3-dotnet-aot | short | queue | 1 | 300 | 0 | 63.2 | 107.8 | 6.3 | 3364 |
| H3-dotnet-aot | short | queue | 16 | 300 | 0 | 114.4 | 154.0 | 9.0 | 3372 |
| H3x-executable-control | short | queue | 1 | 300 | 0 | 60.2 | 108.6 | 6.4 | 3392 |
| H3x-executable-control | short | queue | 16 | 300 | 0 | 113.8 | 147.2 | 8.7 | 3364 |

## Cold-spawn probe (`/usr/bin/time -v`, 100k workload, 30 reps)

| Command | max RSS med (KB) | wall p50 (ms) | CPU p50 (user+sys, ms) |
| --- | --- | --- | --- |
| H1-dotnet-run | 100664 | 283.6 | 380.0 |
| H2-dotnet-fd | 26260 | 37.7 | 30.0 |
| H3-dotnet-aot | 3284 | 4.3 | 0.0 |

## H4 — Bootsharp ES module in Deno (in-process, labeled DIRECT)

| boot (ms) | long-call p50 (ms) | p95 | n |
| --- | --- | --- | --- |
| 98.4 | 54.0 | 54.7 | 100 |

