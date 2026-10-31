# Research

Re-baselined on main `f6839463668c5dae4ca7234d26909e74e10b89c0` (merged #2499).
Read the live #2383 body and comments: two Acceptance boxes, no orchid-triage comment and no matching PR. #2499 already fixed the compensation engine persistence route, but did not supply the requested compensation-specific failure-between-writes regression on each provider. This leaf must finish that evidence rather than invent a parallel write path.

NetScript MCP `find_guidance` with a compensation persistence intent, followed by `search_docs`, consulted first. Public docs describe durable saga/plugin composition; focused source provides the internal transaction contract.

`SagaEngine.commitCompensation` builds the compensation identity from saga id, instance id and expected version, then calls the same `#persistTransition`/`commitTransition` as ordinary handlers. No separate applied-key reservation remains for stored sagas. `KvSagaStore` batches digest, envelope, correlation and history in one CAS on Deno KV/Redis; ordinary `PrismaSagaStore` uses an interactive transaction; the command-capable Prisma adapter uses its existing transaction. Granular custom stores are rejected before handler execution. Memory is a testing adapter, not durable persistence.

Current compensation tests use MemorySagaStore and test successful replay, not a failed persistent commit. Existing PostgreSQL conformance template already supplies real generated clients and per-write rollback injection for ordinary inbound transitions. Reuse that provider harness. Existing KV test seams proxy KvStore.atomic; use its mutation batch to assert compensation state/replay participate together, inject before dispatch and simulate a lost acknowledgement after commit. PostgreSQL can throw after the actual applied-key insert and before state update, proving database rollback.

Archetype 3 runtime/state-machine concern with Archetype 5 plugin consumer. Doctrine runtime crash-boundary, purity, composition and adapter layering apply. Public API, dependencies and export map stay unchanged. JSR surface scan: explicit existing result types, named export manifests, module docs, valid scoped metadata and publish excludes already exist; no new exported or slow types planned. No new doctrine debt.
