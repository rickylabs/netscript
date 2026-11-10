# NetScript desktop benchmark

| Host | Cold start (median) | Memory (tree) | Processes | Idle CPU | Active CPU | 8 instances (total) |
| --- | --- | --- | --- | --- | --- | --- |
| GPUIX + Preact (this build) | 961 ms | 264 MB RSS | 1 | 3.9% | 80.2% | did not start |
| GPUIX-first + Preact | 904 ms | 264 MB RSS | 1 | 3.1% | 36.7% | did not start |
| Deno Desktop webview (same app) | 1018 ms | 502 MB RSS | 7 | 0.5% | 38.1% | did not start |
| Deno Desktop webview · 250 ms budget | 973 ms | 504 MB RSS | 7 | 0.5% | 10% | did not start |
| GPUIX + Preact · real stack | 14048 ms | 1967 MB RSS | 19 | 12.2% | 150% | did not start |
| GPUIX-first · real stack | 12156 ms | 1968 MB RSS | 19 | 16.3% | 122.3% | did not start |
| Deno Desktop webview · real stack | 13734 ms | 2229 MB RSS | 25 | 11.4% | 111.4% | did not start |
| Deno Desktop webview · 250 ms budget · real stack | 13849 ms | 2230 MB RSS | 25 | 10.3% | 121.2% | did not start |

| Real stack | Graph ready | Host memory | Graph memory | Host CPU idle / active | Graph CPU idle / active |
| --- | --- | --- | --- | --- | --- |
| GPUIX + Preact · real stack | 12285 ms | 286 MB | 1676 MB (18 proc) | 4.5% / 45.2% | 7.8% / 104.8% |
| GPUIX-first · real stack | 10884 ms | 285 MB | 1679 MB (18 proc) | 6.3% / 32.3% | 9.4% / 91.9% |
| Deno Desktop webview · real stack | 12567 ms | 546 MB | 1676 MB (18 proc) | 1.3% / 18.3% | 10.2% / 90.5% |
| Deno Desktop webview · 250 ms budget · real stack | 12825 ms | 546 MB | 1680 MB (18 proc) | 1.6% / 15.8% | 8.9% / 105.5% |

```json
{
  "date": "2026-11-09T22:17:12.526Z",
  "os": "windows-x86_64",
  "osRelease": "10.0.26300",
  "cpus": 14,
  "loadavg": null,
  "memoryTotalMb": 32373,
  "method": "cold = spawn→data-backed frame painted, fresh profile; memory = process tree 3 s after ready; idle/active CPU = tree CPU time over a window, % of one core"
}
```
