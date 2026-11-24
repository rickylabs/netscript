# Streams subscriber capacity benchmark

Run this command from the repository root on Linux with Deno and `getconf` available.

```sh
deno run -A --frozen tools/streams-subscriber-capacity/main.ts > results.json
```

The command offers writes for nine minutes, plus setup and drain time, and writes a single JSON
report to stdout. Progress goes to stderr. Add `--smoke` for a short wiring check with a different workload. The default
command is the capacity measurement.

The harness starts one loopback Streams companion with an ephemeral port and a fresh file-backed
data directory. It runs three layouts in order, each with 1, 8, then 32 total readers:

| Layout | Stream assignment |
| --- | --- |
| `single` | All readers share one stream. |
| `spread` | Readers are assigned round-robin across up to eight streams. |
| `spread-slow` | Same assignment, with one client waiting 250 ms before processing each SSE frame. |

Every reader reaches its opening control before writes begin. Each phase offers one small
numbered upsert per second for 60 seconds, round-robin across that phase's streams. The slow
client consumes the same small messages and models delayed frame processing. This workload
does not establish a socket backpressure threshold.

Per-revision latency starts when the harness calls the producer's append enqueue and ends at
the last expected reader's committing control. The report includes each expected reader's
latency or `null` for a missing commit, nearest-rank p50 and p95, and the maximum over complete
latency samples. A gap is an expected revision that never commits for a reader during the
phase. Duplicate or out-of-order commits are reported separately. The reconnect count records
additional HTTP attempts after EOF or a retryable transport error, resuming from the last
committed opaque offset. HTTP versions come from the SSE responses.

The companion's RSS and open file descriptors are sampled at the start, each append, and the
end of the delivery window. Average CPU uses that same interval and Linux procfs accounting
for the companion only; 100% is one logical CPU. Storage is the sum of logical file sizes for
LMDB and log segments before and after the write window. Runtime CPU availability and system
memory are recorded separately.

Startup has a 30-second deadline. Each reader has five seconds to open. Each phase has a
four-minute deadline and the run has a 35-minute deadline, with bounded shutdown after abort.
The write schedule records offered appends and acknowledgement times separately. The last
acknowledgement starts a ten-second delivery grace period.

After delivery, the harness aborts and joins the readers, then explicitly closes each durable
stream to wake remaining upstream waits. It takes snapshots until the upstream response and
waiter counts reach zero, then deletes the closed streams. The JSON records the counts at
opening, after reader cancellation and explicit stream close, and after graceful companion
shutdown. It also records child exit and verified temporary directory removal. Last-subscriber
reclamation on a still-open idle topic is outside the measured workload. A timeout, measurement
or cleanup failure produces a nonzero exit. Delivery gaps, duplicates, or ordering
violations also produce a nonzero exit.

These results apply to this workload on the reported machine and transport. For source context,
the benchmark runs the Streams factory (`plugins/streams/services/src/service.ts`) and the
bounded file adapter (`plugins/streams/services/src/bounded-file-store.ts`). Its diagnostic
reader checks the pinned upstream server's active SSE responses and file-store pending long polls
outside the timed window. Those counters are internal to the upstream implementation.
