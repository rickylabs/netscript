# Worklog

## Design

1. Public surface: existing streams services entrypoint, HTTP protocol and durable offsets unchanged. Internal createStreamsServer composes a native server/store with bounded segment I/O.
2. Domain vocabulary: frame (4-byte length, payload, trailer); physical frame end; logical end (fork base + physical end); complete frame; recent verified boundary checkpoint. Existing upstream StreamMessage type reused.
3. Ports: native FileBackedStreamStore/DurableStreamTestServer, a narrow positioned-read file port with immutable size snapshot and close, backed by native Deno files. Test port exercises short reads and byte-read bounds.
4. Constants: four-byte header, one-byte trailer, 64 KiB I/O chunk, maximum 32 cached segments / 128 recent checkpoints per segment; 1 GiB synthetic log; Linux subprocess RSS ceiling chosen before measurement.
5. Commit slices: bootstrap run artifacts; bounded segment reader and dependency seam plus main.ts wiring, tests and README (structured scoped gates + quality gate + actual runtime RSS); final independent evaluation and evidence/handoff.
6. Deferred scope: changing upstream protocols, segmentation, LMDB schema, producer durability, service orchestration, memory caps, and unrelated logs. Native returned payload arrays retain response-size memory cost.
7. Contributor path: plugins/streams/services/src/bounded-file-store.ts explains the dependency seam and points to bounded-segment-log.ts plus regressions.

PLAN-EVAL: N/A — the existing issue defines framing, native offset/recovery semantics, scope and acceptance; repair does not change public/storage contracts. Independent IMPL-EVAL required.

Bootstrap: matrix feature route resolved; fetched main is unchanged; no duplicate PR; rtk unavailable; no prior session memory exposed. Deno info caused only lock churn during source inspection; revert these task-owned changes before commit.
