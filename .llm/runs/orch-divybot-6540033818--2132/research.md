# Research

Baseline main: c6bce8f86f5f9e0bf61d1b5bdb228b153de37d59. Issue and all comments read;
no triage comment or existing PR covering #2132 found. MCP find_guidance(intent), then
search_docs(KvListOptions RedisKvAdapter list), returned no relevant KV listing recipe;
focused package source and `deno doc --filter KvListOptions packages/kv/mod.ts` are authoritative.

Archetype 2 integration. Existing doctrine verdict: Refactor, oversized adapters. Extract the
listing concern rather than growing the Redis class. No new port or export is required.
The owned port is KvStore.list(KvListOptions), composed into WatchableKv.

Redis writes only individual value envelopes; no sorted index exists. Creating one requires
write/atomic/TTL migration and backfill, with correctness risks outside this fix. SCAN batches
are unordered and may repeat names. Current forward listing orders each batch separately,
uses inclusive start, and compares JSON-string boundaries to colon-encoded sorting. Reverse
listing buffers every matching name and also treats start inclusively.

Memory already excludes start/end and sorts through compareKeys. Native Deno list includes its
start and forbids prefix+start+end. A read-only native KV probe confirms both. Therefore Deno
listing must adapt these native semantics for the existing NetScript contract. Reverse retains
lower-bound start and upper-bound end; only result order reverses. Existing Redis key encoding
cannot round-trip every Deno key part; this assignment does not migrate storage encoding.

Existing dependencies include @std/data-structures BinaryHeap. Reuse it for bounded selection;
no dependency change. Test Redis via NETSCRIPT_TEST_REDIS_URL, isolated per-test namespaces.
Existing CI enforces a real Redis service. Native Deno uses Deno.openKv(':memory:').
