# cut-trace — 0.0.8 milestone run (captured live from git log --first-parent origin/main; never reconstructed)

Baseline main 39cb712 (2026-10-09). Published: v0.0.8-canary.2 = f62a56c (2026-10-08).

## Merged after canary .2, before this run's first dispatch (pre-run; part of the canary .3 payload)

| Time (UTC+2) | Commit | Subject |
|---|---|---|
| 2026-10-09T11:34:36+02:00 | 39cb712 | feat(sagas): commit typed worker effects atomically with transitions (#2097) |
| 2026-10-09T10:38:01+02:00 | 020a6ec | feat(telemetry): add bounded command tracing and privacy conformance (#2094) |
| 2026-10-09T10:15:04+02:00 | 61da18e | feat(command): relay durable outbox through checked sinks (#2096) |
| 2026-10-08T16:58:17+02:00 | 881d25e | fix(ai): keep published adapters peer-compatible with AI core (#2087) |
| 2026-10-08T15:19:00+02:00 | 6645acb | fix(fresh/sdk): qualify one TanStack DB Collection runtime (#2089) |
| 2026-10-08T14:59:20+02:00 | f1ba046 | feat(database): PostgreSQL command store and true transaction client (#2093) |
| 2026-10-08T14:37:13+02:00 | 7726065 | fix(fresh): keep typed route URL helpers pure (#2090) |
| 2026-10-08T14:22:12+02:00 | 2a13927 | fix(workers): propagate job cancellation and deadlines (#2088) |
| 2026-10-08T13:49:01+02:00 | 102f40e | fix(desktop): reconnect native RPC after document reload (#2091) |
| 2026-10-08T13:15:30+02:00 | 587be0d | fix(ai): support explicit Anthropic model IDs and current wire options (#2078) |
| 2026-10-08T12:52:57+02:00 | f257f96 | fix(fresh): preserve complete native chat messages in send (#2092) |

## Run merges (appended as they land)

| Time | Commit | PR | Closes | Wave/leaf |
|---|---|---|---|---|
| 2026-10-09T20:26:28Z | 9d8dfb3 | #2126 | — (Refs #2036) | X-2036 priority repair: AI-peer CI blocker |
| 2026-10-09T20:59:07Z | 09567c5 | #2122 | #1786, #2107 | W9-1786 LoggingPlugin correlation + redaction |
| 2026-10-10T00:13:55+02:00 | bc51667 | #2116 | #2065 | W1-2065 service middleware slot + opt-in body limit |
| 2026-10-10T00:30:05+02:00 | ee620d4 | #2121 | — (Refs #1388, L1) | W5-1388-L1 HttpGate exact status/headers/body contract |
| 2026-10-10T00:30:05+02:00 | ee620d4 | #2119 | #1999 (+#2025 dup) | W2-1999 GET me empty input on REST |
| 2026-10-09T22:48:39Z | 2e46f68 | #2119 | #1999 (+#2025 dup) | W2-1999 GET me empty input on REST |
| 2026-10-10T00:51:54+02:00 | c7ab1ba | #2131 | #1670 | W15-1670 cache-first loader docs |
| 2026-10-10T01:20:58+02:00 | 492a855 | #2123 | #2031 | W2-2031 oRPC-native defined-error narrowing |
| 2026-10-10T07:10:21+02:00 | 14e316c | #2169 | #1939 | W15-1939 README router fence derived from scaffold template |
| 2026-10-10T07:25:36+02:00 | e876d98 | #2135 | #2099,2101 | W9-KV KV adapter atomic/watch conformance |
| 2026-10-10T07:50:45+02:00 | 6e69e571f | #2137 | #2105 | W2-2105 declared fail-closed raw-route seam |
| 2026-10-10T08:10:42+02:00 | 45dfff04d | #2136 | #1681 | W9-1681 worker queue correlation/trace env |
| 2026-10-10T06:33:57Z | 0df1141 | #2133 | #2032 | W3-2032 |
| 2026-10-10T06:36:32Z | 22bb47b | #2124 | #2102 | W2-2102 |
| 2026-10-10T06:37:14Z | 955644f | #2127 | #1688 | W2-1688 |
| 2026-10-10T06:40:07Z | 921e3b8 | #2129 | #1893 | W11-1893 |
| 2026-10-10T06:56:03Z | b1c260e | #2130 | #2013 | W15-2013 |
| 2026-10-10T07:02:56Z | 85338b3 | #2178 | #2120 | W3-2120 |
| 2026-10-10T07:24:30Z | 0944e95 | #2167 |  | W9-1369 |
| 2026-10-10T07:28:25Z | 861de02 | #2198 | #1826 | X-1826 |
| 2026-10-10T07:54:29Z | b8266ad | #2140 | #1682 | W9-1682 |
| 2026-10-10T08:19:49Z | f608cf1 | #2183 | #2018 | W3-2018 |
| 2026-10-10T08:36:11Z | f1784a9 | #2196 | #2164 | X-2164 |
| 2026-10-10T09:39:32Z | 84e147f | #2189 |  | X-1385 |
| 2026-10-10T11:15:09Z | 36c9324 | #2141 | #1825 | W9-1825 |
| 2026-10-10T11:36:12Z | a0add90 | #2193 |  | X-1386 |
| 2026-10-10T11:37:01Z | 142b621 | #2195 |  | X-2194 |
| 2026-10-10T11:50:42Z | 412bed9 | #2117 | #1383 | W1-1383 |
| 2026-10-10T11:53:40Z | c29e30c | #2211 | #2210 | X-2210 |
| 2026-10-10T12:01:58Z | ed03df6 | #2188 |  | X-2026 |
| 2026-10-10T12:03:22Z | 1ca18a6 | #2186 |  | X-2185 |
| 2026-10-10T12:19:43Z | 3ea5bd4 | #2139 | #1990 | W9-1990 |
| 2026-10-10T12:27:48Z | 8d44ba0 | #2182 | #1765 | W15-1765 |
| 2026-10-10T12:29:22Z | da3f407 | #2199 |  | X-1742 |
| 2026-10-10T12:30:48Z | a3d4933 | #2163 | #2095 | W9-2095 |
| 2026-10-10T12:40:53Z | b12a059 | #2197 | #1690 | X-1690 |
| 2026-10-10T13:02:46Z | 5f1094a | #2175 | #2028 | W11-2028 |
| 2026-10-10T13:06:06Z | 2d23726 | #2171 | #2030 | W11-2030 |
| 2026-10-10T13:13:54Z | ddced16 | #2205 |  | X-1684 |
| 2026-10-10T13:20:55Z | 30f06a6 | #2204 |  | X-2066 |
| 2026-10-10T13:27:35Z | 128ea54 | #2177 |  | W3-1384 |
| 2026-10-10T13:40:16Z | a514879 | #2173 | #2024 | W11-2024 |
| 2026-10-10T13:48:08Z | 9c03082 | #2220 |  | X-1382 |
