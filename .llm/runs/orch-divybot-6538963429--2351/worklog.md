# Worklog

## Design

1. Public surface: existing RedisAdapter.listen and ListenOptions gain bounded Redis dispatch via concurrency plus optional pollIntervalMs/delayedPollIntervalMs; env seam tunes generated workers. Existing stop/ack/nack/extendVisibility and TracedQueue remain the extension surfaces.
2. Vocabulary/state: intake running → draining → stopped; one durable RedisLease per active delivery, bounded in-flight promises, first failure, distinct intake/settlement controllers, one shared stop completion. Redis-specific private admission/drain module composes existing leases; no generic pool or lifecycle framework.
3. Ports: MessageQueue, ListenOptions, MessageContext; RedisLeases atomic receipt runtime; ioredis transport; @std/async abortable delay; environment and timers live only at Redis adapter edge; worker owns heartbeat through extendVisibility.
4. Constants: default empty poll 50 ms, delayed poll 1000 ms, allowed interval 10–60000 ms, default drain 30000 ms, named environment variables. Existing recovery and promotion page/retry constants unchanged.
5. Slices: S0 research/design; S1 bounded dispatch + lifecycle + config + docs and targeted tests; S2 real-backend expanded proof, measurements, trace correlation, negative controls and generated carriers. Gates/files in plan.md. Every slice updates this file and context-pack.md, commits and pushes.
6. Deferred scope: fresh cockpit end-to-end p95 and coordinator-controlled scaffold.runtime CI, both explicitly unproven; no changes to other adapters, native observers or atomic script semantics.
7. Contributor path: packages/queue/adapters/_redis-listener.ts owns admission and drain; redis.adapter.ts owns timer configuration and sockets; tests/redis-concurrency_test.ts demonstrates the real-backend extension pattern.

## Bootstrap

Full assignment read. MCP guidance searched, memories consulted, issue comments read, main rebaselined and routing resolved. Owner evaluator/PR-link overrides recorded in supervisor.md. PLAN-EVAL pending; no implementation has begun.

## PLAN-EVAL round 1 correction

FAIL_PLAN identified post-abort final-delivery loss, missing concurrency/env-access policy, file-size/cardinality placement and imprecise negative controls. Plan now locks dispatch-and-drain after committed abort, validated concurrency and named env failures with NotCapable compatibility, private listener composition plus explicit debt delta, preserved stopped-process recovery semantics and exact negative-control assertions. No code written. S0 pushed as 59ce4a0; draft PR #2496 created; reconcile: no duplicate work or new issue requirements. Baseline real queue 144/0/3, worker lease suites 13/0, full doc lint has the single inherited KV private-type-ref.

PLAN-EVAL round2 PASS before code. Implementing S1 with one private Redis-specific state owner and preserved atomic scripts.

S1 targeted real-backend tests14pass/0fail. Structured queue check/lint/fmt pass with complete selected-file coverage. quality:gate durable receipt PASS (includes deps:check and architecture). Initial complete baseline-production negative control:14fail/0pass, including missing concurrency, omitted config rejection, dropped post-abort claim and aborted automatic acknowledgement. Refined capacity test to allow baseline serial ack before proceeding to N, so its distinguishing failure is the N barrier rather than the independent abort/ack defect. Full suite and final negative control pending.

S1 independent review round1 found no code blockers but required full-suite evidence after restoring the producer-only stop grace. Rerun complete queue suite through structured wrapper against both real Redis and Garnet: {"passed": 158, "failed": 0, "ignored": 3, "totalResults": 161, "uniqueFailures": 0}, exit0. All three delayed-promotion timer-stop outcomes (successful, failing, expected-stop) and refused-endpoint/outage stop tests pass. Independent round2 verifies this evidence before S1 commit.

S1 independent review round2 PASS; E1 resolved by full158pass/0fail/3CI-onlyignore. Sign-off is based on separate-session substantive review plus verified wrapper evidence. Redis adapter467lines, private listener91lines; Lua/fence scripts unchanged. Full doclint retains only baseline KV private-type-ref; new Redis/port surface clean. JSR audit dry-run succeeds with no hard findings (slow-types warning is the scanner banner false positive). S1 ready to commit/push. Reconcile: draft PR#2496 remains main-targeted; labels/milestone unchanged; issue acceptance unchanged; S2 remains in scope.
