# Worklog

## Design

Public contract remains CacheEntry.DataPath. The existing generator composes upstream AOF/recovery/commit flags at each Garnet launch edge, with /data in containers and resolved host DataPath for executable. No new runtime abstraction. Durable writes wait for native AOF flush; ephemeral mode preserves existing argv. Tests use emitted configuration and real queue delivery after restart, including a checkpoint plus later AOF tail. Docs state modes and latency/retention behavior. PLAN-EVAL N/A for this locked native configuration passthrough; mandatory independent final evaluation.

Fresh main b0eb07957 confirmed before branch creation. Pinned server help verified in an owned auto-removed container. Baseline static/runtime regressions next; no product implementation.


## Main baseline reproduction

Static controls: all three no-DataPath cases pass; Container/Executable/Auto DataPath cases fail because generated argv lacks AOF/recovery. Real AOF-only queue regression on unchanged main source: both jobs are ready before an owned hard restart; the restarted server answers PING, then delivers zero jobs instead of two. This is a genuine data-loss failure after readiness, not a boot/network failure.

Two fixture problems were corrected before counting runtime evidence: a direct ioredis import was not declared in CLI (replaced by native Deno TCP for PING/SAVE; queue uses its own existing dependency), and Docker reallocated the dynamic published port on restart (re-read after start). Those bootstrap failures are excluded. Checkpoint control independently exposed pinned native4K alignment failure matching upstream2239; it is also excluded from proof of the missing-AOF finding. Durable policy includes supported FileStream plus storage-tier per the confirmed upstream workaround, with common log/checkpoint directory. No version change.

Each runtime test verifies immutable container/volume IDs and unique ownership labels before cleanup. Post-run Docker scans show no test-owned containers or volumes. All other resources are untouched. Raw server logs are not retained in public run evidence.
