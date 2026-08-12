# Context pack — #1405

- Branch: `fix/1405-durable-producer-rejection-taxonomy` at baseline `01aa12b67`.
- Archetype: 3 — Runtime / Behavior; no scope overlay.
- Locked reasons: graceful close drain is `producer-stopping`; non-retryable transport failure is
  `transport-refused`; retryable failures at `maxAttempts` remain `retry-exhausted`.
- Behavior boundary: reason strings only; no acceptance, retry-count, settlement class, delivery,
  cancellation, telemetry-classification, #1398, or scaffold changes.
- PLAN-EVAL: N/A per the owner brief and orchestration supervisor record.
- Implementation gates: scoped wrappers, quality gate, target quality scan, doc lint, JSR audit,
  focused tests, telemetry guard, and package-configured full suite are green.
- Gate caveat: the brief's bare `deno test packages/plugin-streams-core` exits 1 because it omits
  the package suite's required env permission; the configured `--allow-all` task passes 33/33.
- Orchestrator retains slice review, IMPL-EVAL, ready-state, merge, and release authority.
