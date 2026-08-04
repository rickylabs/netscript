# Plan

1. Lock generated-graph tests for SQLite, Deno KV resolution, and provisioned-service health checks.
2. Represent scaffolded SQLite and Deno KV as resolved Aspire resources without unresolved parameters.
3. Attach real health checks to every backing service provisioned by this generator.
4. Run focused generator tests, generated AppHost type-checking, relevant package tests, and scoped quality gates.
5. Record earned acceptance evidence and hand the ready PR to the orchestrator gate.

Per milestone ruling D6, this lane does not spawn a local PLAN-EVAL.

