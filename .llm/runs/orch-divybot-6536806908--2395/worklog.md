# Worklog

## Owner routing override (verbatim)

> Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Feature-tier loop: at most 2 PLAN-EVAL rounds and 5 IMPL-EVAL rounds. The final IMPL-EVAL must review the exact pushed head and end with one line: VERDICT: MERGE <full sha> or VERDICT: CHANGES <full sha>.

## Bootstrap

- Read the complete assignment, issue body and comments. No triage report or existing PR found.
- Consulted prior committed environment and validation memories before inspecting source.
- Consulted NetScript MCP find_guidance then search_docs for queue recovery semantics.
- RTK unavailable; use focused raw commands and structured gate wrappers.
- Operator-specific no-closing-keyword and no-taxonomy rules take precedence over generic dispatch defaults.
- No local scaffold.runtime E2E; coordinator owns the expensive gate.

## Design

1. Public surface: optional context.extendVisibility(ms?), ListenOptions.maxDeliveries;
   RedisAdapter.reclaimExpired(), getMetrics(), getHealth(); existing constructors preserved.
2. Vocabulary: claim receipt, lease deadline, delivery count, retry limit, durable DLQ outbox,
   reclaimed/deadLettered counters. At-least-once delivery; application effects stay idempotent.
3. Ports: existing MessageQueue, MessageContext, DeadLetterStorePort; ioredis command client.
4. Constants: 30_000ms default lease, 5 default deliveries, bounded page/poll/retry constants;
   existing DLQ reason vocabulary reused. Redis TIME owns the lease clock.
5. Commit slices: plan; atomic lease contract/runtime/adapter/tests/docs; final evidence/fixes.
   Files and gates are listed in plan.md; all slices update this file and context-pack.md.
6. Deferred scope: listener concurrency (#2351), other providers, telemetry exporter plumbing.
7. Contributor path: packages/queue/README.md documents options, heartbeat, recovery, metrics,
   durability and extending the internal lease transaction seam.

Reconcile (plan): issue remains open, no duplicate PR, coordinator-owned taxonomy untouched.
