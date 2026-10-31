# Worklog

## Design

1. Public surface: unchanged KvStore.list(KvListOptions), globally ordered Redis pages and exclusive
   lower/upper bounds. No new public symbols.
2. Domain vocabulary: candidate = decoded KV key plus Redis name; window = next bounded globally
   ordered candidate set; continuation = last examined candidate, not an opaque Redis cursor.
3. Ports: existing KvStore and narrow Pick<ioredis.Redis, 'scan' | 'mget'>; no new framework port.
4. Constants: reuse REDIS_SCAN_COUNT and REDIS_MGET_BATCH_SIZE; fixture sizes/page sizes are named
   test constants. Reuse @std/data-structures BinaryHeap and compareKeys.
5. Commit slices: S0 planning/run record/draft PR; S1 shared contract + bounded listing and Deno
   semantics correction, README/types and gates; S2 evaluator corrections/evidence if needed.
   Exact file/gate list is locked in plan.md.
6. Deferred scope: storage-key codec migration, sorted index/backfill, snapshot semantics and
   unrelated architecture debt. Reasons in plan.md.
7. Contributor path: packages/kv/tests/list-contract_test.ts is the one shared behavior spec;
   Redis selection details live in adapters/redis/list-entries.ts.

## Routing override

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate
session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
Matrix read first; use owner-authorized route, separate vendor family/session; resume evaluator.

## S0

Assignment and memory read, issue preflight found no duplicate PR. MCP guidance consulted before
source research. Native KV probe confirms inclusive start and illegal prefix+start+end selector.
No production code changed before PLAN-EVAL. RTK missing; focused commands used directly.
