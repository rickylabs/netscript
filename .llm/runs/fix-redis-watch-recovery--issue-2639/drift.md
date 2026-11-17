# Drift

None yet. Initial code-read finding remains unverified until actual runtime reproduction. No implementation authorized by inference before selected PLAN-EVAL PASS. Repository same-session evaluator steering yields to T3's required fresh delegate task for each evaluation/recheck; carry prior findings in the brief.


## Recovery implementation details

Native @std retry requires a finite positive integer, so the outer recovery loop uses a finite count whose minimum cumulative delay exceeds the30-second budget; jitter disabled only on this outer bound. Existing connection attempts retain jitter. The budget starts at first disconnect (a tighter bound than native-window plus30seconds), includes reconnect/subscription/snapshot retries and retains the last underlying cause. Native automatic replay of unfulfilled subscriber commands is disabled alongside autoResubscribe so released leases cannot replay stale SUBSCRIBE. Primary failed connection promises reset so later snapshot attempts can reconnect.

Per Plan-Gate F-1 watch-point, fixed-key bookkeeping is extracted to the focused adapters/redis/watch-fixed-keys.ts module instead of enlarging the already oversized adapter. The adapter shrinks below its baseline size; no public contract/context/port or new runtime class is introduced. This adds one internal file to S2 (18maximum vs planned17, still below30), within the approved same-concern split allowance. Existing prefix discovery policy is retained, waiting for shared recovery before polling and normalizing read failures into the existing typed KV hierarchy.
