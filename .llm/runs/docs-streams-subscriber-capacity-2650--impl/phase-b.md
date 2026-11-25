# File-backed SSE fan-out causality

## Measured workload

One isolated file-backed companion per trial. Deno 2.9.7, Linux x86_64, 16 available logical CPUs, temporary file storage and HTTP/1.1 SSE over loopback. One stream had no sliding TTL. Each trial offered 60 small numbered appends at one per second after all readers reached their opening SSE control. Deliveries counted at the committing control. Co-located clients ran in one Deno process. Separated clients used a dedicated producer and four reader processes. All trials used per-reader HTTP Agents. Delay figures are wall-clock observations of this workload.
The original and counterfactual ran every reader count in both process topologies. The
highest reader count also restored the original in both. Each trial had 60 samples and
zero delivery gaps or reconnects. All 18 trials verified 18,240 reader commits.
The harness cancelled and joined the readers, explicitly closed the stream, verified zero upstream
responses and waiters, stopped the companion and removed the temporary store. Reclamation when
the last reader leaves a still-open idle topic was unmeasured.

The public benchmark runs from the repository root:

```sh
deno run -A --frozen tools/streams-subscriber-capacity/main.ts
```

The inline reproducer in the defect runs the one-topic condition from the same checkout.
**Measured unmodified companion.** The inline reproducer verified 1,920 deliveries with 72,438.8 ms p95, 77,637.9 ms maximum and 77,657.6 ms of drain.

The causal trials used Deno with `--check -A --frozen`. The runtime touchAccess
method matched the exact pinned copy. The counterfactual applied the guard
`meta.ttlSeconds !== undefined` to the existing putSync call for this experiment.

## Measured curve

| Client topology | Readers | Original p50 / p95 / max (ms) | Counterfactual p50 / p95 / max (ms) | Original drain (ms) | Counterfactual drain (ms) |
| ---  | ---: | ---: | ---: | ---: | ---: |
| Co-located | 4 | 238.1 / 332.3 / 900.1 | 47.6 / 206.9 / 265.7 | 239.5 | 63.3 |
| Co-located | 8 | 477.8 / 1,079.8 / 1,504.5 | 38.0 / 146.9 / 290.6 | 756.0 | 37.4 |
| Co-located | 16 | 2,497.8 / 5,272.0 / 6,097.7 | 44.0 / 90.5 / 304.8 | 6,097.6 | 45.2 |
| Co-located | 32 | 27,307.8 / 59,989.6 / 64,025.0 | 49.9 / 91.9 / 306.3 | 64,024.9 | 39.3 |
| Separated | 4 | 245.5 / 343.1 / 767.9 | 38.2 / 95.6 / 266.9 | 236.4 | 28.9 |
| Separated | 8 | 431.1 / 906.5 / 1,162.6 | 40.0 / 122.5 / 324.5 | 466.9 | 59.2 |
| Separated | 16 | 19,544.6 / 26,450.4 / 26,638.3 | 49.6 / 334.5 / 487.4 | 26,450.3 | 32.4 |
| Separated | 32 | 42,836.3 / 82,874.3 / 86,153.1 | 48.4 / 83.9 / 317.6 | 86,153.0 | 42.4 |

## Measured stages and restoration

Post-notify spans run from the synchronous notifier returning to the producer store call
returning. The original residual is computed by subtracting only the synchronous write
spans in the same append interval, before taking the percentile. The light probe
keeps counts and elapsed time per append and emits results after the trial.

| Client topology | Readers | Dispatch to ack p95 original / skip (ms) | Post-notify p95 original / skip (ms) | putSync p95 original / skip (ms) | Original post-notify residual p95 (ms) | Puts per append original / skip |
| ---  | ---: | ---: | ---: | ---: | ---: | ---: |
| Co-located | 4 | 331.6 / 206.2 | 200.7 / 0.9 | 198.9 / 0.0 | 2.1 | 8 / 0 |
| Co-located | 8 | 1,078.4 / 146.4 | 1,002.1 / 1.2 | 998.9 / 0.0 | 3.8 | 16 / 0 |
| Co-located | 16 | 1,686.7 / 88.6 | 1,504.2 / 2.2 | 1,498.6 / 0.0 | 7.8 | 32 / 0 |
| Co-located | 32 | 2,697.7 / 90.1 | 2,619.4 / 3.5 | 2,609.6 / 0.0 | 14.9 | 64 / 0 |
| Separated | 4 | 342.2 / 95.0 | 200.3 / 0.9 | 198.3 / 0.0 | 2.1 | 8 / 0 |
| Separated | 8 | 905.7 / 121.8 | 846.4 / 1.2 | 843.1 / 0.0 | 3.8 | 16 / 0 |
| Separated | 16 | 2,735.3 / 333.2 | 2,580.6 / 2.0 | 2,574.6 / 0.0 | 7.8 | 32 / 0 |
| Separated | 32 | 3,837.2 / 79.4 | 3,651.8 / 3.5 | 3,641.3 / 0.0 | 15.4 | 64 / 0 |

| Restored at 32 readers | Last-reader p95 (ms) | Drain (ms) | Post-notify p95 (ms) | putSync p95 (ms) |
| ---  | ---: | ---: | ---: | ---: |
| Co-located | 66,270.0 | 69,939.5 | 3,063.0 | 3,050.2 |
| Separated | 63,573.5 | 66,409.2 | 2,807.5 | 2,796.9 |

**Measured in a separate detailed 32-reader trial.** All 1,920 wakeups called touchAccess twice. The post-notify interval was 2,607.6 ms at p95. Subtracting synchronous write spans within each matching append left 16.7 ms at p95. The synchronous notifier itself was 2.3 ms at p95. Native LMDB transaction and flush, filesystem I/O and scheduler time remain unseparated.

## Measured independent client controls

These earlier client controls used 32 readers per trial. Every trial had 60 samples and
zero delivery gaps or reconnects. The deliberate slow reader delayed processing by 250 ms per SSE frame.

| Control | Last-reader p95 (ms) | Upstream receive to response headers p95 (ms) | Ack to last reader p95 (ms) |
| ---  | ---: | ---: | ---: |
| Dedicated producer, one reader process | 69,266.9 | 2,803.5 | 4.7 |
| Producer in driver, four reader processes | 79,630.2 | 3,404.3 | 4.7 |
| Fully separated A | 103,635.0 | 6,413.1 | 6.0 |
| Fully separated B | 84,974.9 | 3,874.7 | 6.7 |
| Shared Agent, keep-alive off | 68,015.1 | 3,214.8 | 4.1 |
| Shared Agent, keep-alive on | 88,367.9 | 4,005.0 | 4.3 |
| Fully separated, eight topics | 488.7 | 485.8 | 0.7 |
| Fully separated, eight topics, one delayed reader | 880.2 | 675.6 | 503.0 |

Both shared Agent settings opened 32 front connections with zero queued HTTP requests.
With a dedicated producer and four reader processes, the bottleneck remained before the
upstream response. Delaying a reader put the observed delay after acknowledgement.

## Measured retry amplification

One original-method POST timed out after 5,001.3 ms during the server's post-notify interval. The upstream accepted the first attempt and sent HTTP 200. The retry received HTTP 204. First dispatch to retry dispatch took 7,440.7 ms. Original response headers to eventual producer acknowledgement took 23.7 ms. There were no failed reconnect PUTs in the matched trials and no retries in the counterfactuals. The earlier transport controls recorded 5 timed-out POSTs and 1 timed-out reconnect PUT. First dispatch to successful retry dispatch took 6,431.8–10,656.9 ms. Original upstream response headers to eventual producer acknowledgement took 23.0–358.7 ms. Both original-method restoration trials had one attempt per write and still accumulated a backlog. The effect of changing the timeout was unmeasured.

The producer serializes each stream's FIFO, so first-attempt dispatch can lag the offer
schedule. Retries amplify this backlog on affected writes. The original-method detailed trace
also reproduced backlog with one attempt per write.

## Source-inspected upstream status

**Source-inspected.** `deno task deps:latest --filter '@durable-streams/server'` reports the pinned release **0.3.9** as npm's latest stable. Its changelog lists dependency updates. Upstream main still writes synchronously in touchAccess. File-store history and searches for touchAccess, putSync, LMDB/SSE and fan-out found no matching fix or open report. [npm release](https://www.npmjs.com/package/@durable-streams/server/v/0.3.9) · [Changelog](https://github.com/durable-streams/durable-streams/blob/461b40267aabd644558f9b19dbb9507dd5f691cf/packages/server/CHANGELOG.md#039) · [Current file-store source](https://github.com/durable-streams/durable-streams/blob/461b40267aabd644558f9b19dbb9507dd5f691cf/packages/server/src/file-store.ts#L661-L670) · [File-store history](https://github.com/durable-streams/durable-streams/commits/main/packages/server/src/file-store.ts) · [Upstream issue search](https://github.com/durable-streams/durable-streams/issues?q=is%3Aissue+putSync) · [Sliding TTL change](https://github.com/durable-streams/durable-streams/pull/321).

The upstream slow-append stopwatch ends before waiter notification. In the counterfactual,
notification and committing controls still ran, while synchronous access-time writes were
omitted. Restoring the original reproduced the bottleneck. The evidence places it at
synchronous access-time writes for this workload. Native transaction internals, physical
disk activity, scheduler waits and socket transmission remain unmeasured.

## Tracked defect

[NetScript server-side defect #2661](https://github.com/rickylabs/netscript/issues/2661).
