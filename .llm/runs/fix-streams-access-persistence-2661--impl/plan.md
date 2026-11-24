# Plan — #2661 Streams access persistence

Archetype 5, Service overlay. Doctrine verdict Keep, with stream contracts in
`@netscript/plugin-streams-core`. Apply A11 at the existing upstream compatibility edge
and keep the origin service composition thin. The existing storage debt is
`STREAMS-BOUNDED-NATIVE-IO-HOOKS`. This run's drift records the expanded private seam and
upgrade assertions.

1. Prove the synthetic workload against a production file-backed companion. For each retention
   mode, open 32 SSE connections, validate their opening controls, and offer 60 numbered producer
   writes at one per second. Validate ordered, unique committing deliveries and require p95
   below 1,000 ms. Bound startup, the trial, and cleanup.
2. Change the existing storage adapter. Preserve the upstream protocol and exact live expiry
   boundary. Flush asynchronously in batches, check the generation, and protect renewals during
   native producer-state and offset updates.
3. Verify file-store behavior, protocol behavior, and slow/error paths. Run service-scoped check,
   lint, format and test wrappers, the doctrine and quality scans, release preflight, publish
   dry-run, and scaffold runtime. Run the one-topic regression twice per baseline and final
   implementation head.

The short coalescing interval bounds the scheduling delay for an idle writer. The plan does
not assign a fixed upper bound to a stalled scheduler or failed disk. The coordinator owns the
decision about a possible lost renewal on abrupt process failure. Clean shutdown drains or
reports failure. PLAN-EVAL is N/A because the issue fixes the scope, acceptance workload, and
the compatibility seam. Independent IMPL-EVAL remains with the coordinator.

Risks include stale append snapshots, delete/recreate races, LMDB write failures and changed
upstream internals. The adapter checks its required shapes and regression tests exercise all
four cases. AP-4 is contained in the existing adapter. No workflow, catalog, lock, benchmark
guide, or host integration changes are in this plan.
