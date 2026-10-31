# Worklog

## Design

1. Public surface: optional `DurableStreamProducerOptions.initialEpoch` inherited by service factory. No consumer changes. Explicit epochs fence rather than auto-claim; omitted option retains legacy behavior.
2. Domain vocabulary: producer session = one epoch allocated by application storage; sequence = serial transport request counter in that epoch; duplicate = already committed exact tuple; unchanged source = caller skips producing an event. Existing lifecycle snapshot/states stay intact.
3. Ports: existing transport, clock, random and write lifecycle; persisted allocator belongs to caller, no new storage port. Cancellation continues through supervisor signal.
4. Constants: epoch/sequence zero are protocol values; integer upper bound Number.MAX_SAFE_INTEGER. Existing finite lifecycle/failure unions reused. No new protocol strings.
5. Commit slices: plan bootstrap, one cohesive runtime/proof/docs slice, evidence handoff; see plan for exact files and gates. Each commit includes worklog/context updates.
6. Deferred scope: server handshake endpoint, autonomous epoch storage, semantic value deduplication and crash-persistent queue (requires application contract beyond transport retry safety).
7. Contributor path: `src/application/durable-stream-producer-supervisor.ts` owns identity/retry/fencing policy; README explains callers' epoch responsibilities.

## Bootstrap

Matrix and owner override recorded in supervisor. MCP consulted, prior memory checked. No existing covering PR. Public-safe evidence only; raw reviewer output kept outside Git. PLAN-EVAL selected by owner, not yet run. PR labels/milestone and local scaffold runtime prohibited by owner.
