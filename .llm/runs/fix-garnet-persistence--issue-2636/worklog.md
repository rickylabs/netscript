# Worklog

## Design

Public contract remains CacheEntry.DataPath. The existing generator composes upstream AOF/recovery/commit flags at each Garnet launch edge, with /data in containers and resolved host DataPath for executable. No new runtime abstraction. Durable writes wait for native AOF flush; ephemeral mode preserves existing argv. Tests use emitted configuration and real queue delivery after restart, including a checkpoint plus later AOF tail. Docs state modes and latency/retention behavior. PLAN-EVAL N/A for this locked native configuration passthrough; mandatory independent final evaluation.

Fresh main b0eb07957 confirmed before branch creation. Pinned server help verified in an owned auto-removed container. Baseline static/runtime regressions next; no product implementation.
