# Worklog

## Design

1. Public surface: existing RedisAdapter.listen and ListenOptions gain bounded Redis dispatch via concurrency plus optional pollIntervalMs/delayedPollIntervalMs; env seam tunes generated workers. Existing stop/ack/nack/extendVisibility and TracedQueue remain the extension surfaces.
2. Vocabulary/state: intake running → draining → stopped; one durable RedisLease per active delivery, bounded in-flight promises, first failure, distinct intake/settlement controllers, one shared stop completion. No new generic pool or lifecycle framework.
3. Ports: MessageQueue, ListenOptions, MessageContext; RedisLeases atomic receipt runtime; ioredis transport; @std/async abortable delay; environment and timers live only at Redis adapter edge; worker owns heartbeat through extendVisibility.
4. Constants: default empty poll 50 ms, delayed poll 1000 ms, allowed interval 10–60000 ms, default drain 30000 ms, named environment variables. Existing recovery and promotion page/retry constants unchanged.
5. Slices: S0 research/design; S1 bounded dispatch + lifecycle + config + docs and targeted tests; S2 real-backend expanded proof, measurements, trace correlation, negative controls and generated carriers. Gates/files in plan.md. Every slice updates this file and context-pack.md, commits and pushes.
6. Deferred scope: fresh cockpit end-to-end p95 and coordinator-controlled scaffold.runtime CI, both explicitly unproven; no changes to other adapters, native observers or atomic script semantics.
7. Contributor path: packages/queue/adapters/redis.adapter.ts owns admission, timer configuration and drain; tests/redis-concurrency_test.ts demonstrates the real-backend extension pattern.

## Bootstrap

Full assignment read. MCP guidance searched, memories consulted, issue comments read, main rebaselined and routing resolved. Owner evaluator/PR-link overrides recorded in supervisor.md. PLAN-EVAL pending; no implementation has begun.
