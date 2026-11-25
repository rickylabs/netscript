# Plan

Apply the docs overlay and describe the Archetype 5 Streams companion using its existing
service and core APIs. The benchmark is repository tooling, outside the published package roots.
The doctrine verdict keeps Streams composition in the plugin and stream conventions in core.
The worklog Design section owns the ordered slices and gates.

- Lock a single companion and one aggregate append per second, spread round-robin across the
  subscribed streams. Keep steady-state timing separate from setup and teardown.
- Compare final committed revisions against each reader's expected sequence; record retries and
  time the final committing control. Make the slow-consumer delay explicit in the reported results.
- Verify real response/waiter counts on teardown and require clean child exit and directory removal.
  Fail closed if the pinned upstream inspection seam changes. Bound both workload and cleanup.
- Keep publication, scaffold runtime, new public API, and package changes outside this run.
  JSR audit does not apply because no published surface changes.

The issue and source resolve the implementation decisions. Additional environments, real browser
constraints and higher load are safe to defer. PLAN-EVAL is N/A as recorded in the worklog.
