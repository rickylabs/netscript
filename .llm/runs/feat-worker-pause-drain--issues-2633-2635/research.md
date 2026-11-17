# Research at main b0eb079575968e843b781579673c9fe2ae250e07

Both issues2633/2635 read in full; all nine acceptance boxes map to plan.md. Source remains unchanged from main; only tests/run docs are new. Public API inspected with deno doc, MCP guidance consulted, then focused source and pinned upstream implementations. Relevant doctrine3/runtime/plugin profiles, lifecycle/clock/failure rules, gate matrix and JSR rubric applied.

## Findings verified in code

Worker.start waits the job-supervisor lifetime. stop immediately aborts its shared execution/intake controller and active job controllers, awaits runner shutdown/listeners, then reaches a30s poll that cannot provide a graceful work interval. Tasks do not enter activeJobs. Each queue listen signal cancels admission while its callback/settlement lifetime may continue. Supervisor attempt pause barriers can preserve long-lived start and cap generation concurrency without creating duplicate trigger queues or shutting down the terminal runner. Lease renewal belongs to dispatch shutdown signal, not intake.

Core runner default1000ms applies after all abort causes; explicit grace already works but no workers config field or standard runtime forwarding exists. Both runtime constructors pass only a static registry to WorkerPool. Existing CLI loadWorkersConfig wraps native loadConfig + shared WorkersConfigSchema; move this loader to runtime and keep the CLI forwarding identity, avoiding a CLI dependency in background startup.

## Runtime reproductions (new tests against unchanged product source)

| Oracle | Main result | Interpretation |
| --- | --- | --- |
| Config retains drain/grace | FAIL, value omitted | Shared schema strips both unknown fields |
| Default handler cleanup1250ms | FAIL, cleanup not finished when dispatch settles | Real >1s abort cleanup is cut short |
| Worker pause | FAIL, method missing | Functional paused/resume assertions remain in test |
| Worker graceful drain | FAIL, handler signal already aborted at stop entry | Finishing inside budget cannot succeed |
| Memory shutdown / ordinary requeue | FAIL(count2) / PASS(count2,3) | Preservation missing, failure control intact |
| KV polling shutdown / ordinary requeue | FAIL(count2) / PASS(count2,3) | Same |
| Deno KV explicit shutdown / ordinary requeue | Both FAIL, bounded next-delivery timeout | Explicit nack currently returns without enqueuing |
| Real Redis shutdown / ordinary requeue | FAIL(count2) / PASS(count2,3) | Native receipt counts shutdown |
| Real Garnet2.2.1 shutdown / ordinary requeue | FAIL(count2) / PASS(count2,3) | Same, Lua enabled, no Streams |
| Real Postgres17 shutdown / ordinary requeue | FAIL(count2) / PASS(count2,3) | Corrected harness; native SQL counts shutdown |
| Real Worker replacement on Redis/Garnet | Both FAIL on first replacement(count2) | Actual Worker.stop/dispatch handback consumes attempt |
| Real RabbitMQ AMQP wrapper | Broker406 unknown delivery tag before accounting | Upstream async double ack; no accounting claim |

Initial combined test report2pass/8fail/6unconfigured-backend ignores. Live Redis/Garnet tests execute with no ignored cases. The first Postgres harness started listen and enqueue concurrently and hit a pre-existing client/schema initialization race; corrected harness enqueues before listen. Exclude that harness failure: corrected Postgres1pass/1fail is the accounting evidence. All reports retained privately; no raw paths/endpoints/logs copied here.

AMQP inspected pinned @fedify/amqp2.4.2 from the actual Deno graph. Constructor defaults nativeRetrial=false; NetScript passes no options but advertises nativeRetrial=true. The upstream non-native async handler path acks immediately and in finally, then again when its Promise settles; real broker rejects duplicate tag. Current nack requeue is also no-op. For this feature use existing amqplib basic.cancel/native channel consumption to stop intake without closing live handlers; counted handback uses an owned confirm channel before old ack. Existing Fedify enqueue has no confirm wait, so do not use its returned Promise as durability proof. Queue name must be forwarded. No new dependency/transport abstraction.

## Adapter accounting and fencing

Redis/Garnet increments at claim; existing Lua receipt fences ownership/expiry and maxDeliveries5. Refund must change encoded envelope and maximum-limit decision in the same fenced transition, never expiry recovery. Postgres increments at UPDATE claim, currently unguarded unlock/delete; use existing locked_by as per-claim identity for refund, with same live-receipt/one-settlement invariant. KV polling increments at claim, currently deletes processing before requeue and auto-acks even explicit nack; scoped extraction provides CAS move and settlement guard. Memory needs per-delivery settlement guard and one refund. Deno KV/AMQP expose envelope counts but native implicit provider retries do not update persistent envelope counters; explicit nack will count by re-enqueuing current count, or preserve by re-enqueuing prior count. Document implicit retry limit honestly.

## Source shape and risks

Worker463lines, job-dispatcher414, KV polling811, Postgres581 at main. Plan keeps Worker<500 through core-owned bounded drain policy and reduces KV polling via focused message/settlement extraction. Existing queue adapters cardinality debt and public service/type closure debt reviewed; no new service exports. Core schema and data-only configuration require explicit annotations, native public types and doc-lint/JSR gates. No Streams, saga transport, lock or dependency change. Exact core lifecycle/clock/default/public options and delivery semantics are locked in plan.md before implementation.

## Resource hygiene

Four active research backend containers (plus one earlier owned Garnet startup replacement) (Redis, Garnet, Postgres, RabbitMQ) used recorded immutable identities plus an owner label. Read-only leak report and teardown preview ran before cleanup; all four active containers removed only after verifying exact identity/owner. Final owned-identity scan empty; foreign resources untouched. Raw reporter output retained privately and this run carries only the public-safe summary.

## Measured public documentation baseline

Structured doc-lint with Deno2.9.7 against unchanged main sources: combined core2 private-type-ref, queue1, plugin2. Per-entrypoint diagnostics retained privately for exact delta comparison; config0, Redis0, ports0, worker public entrypoint0, services0; runtime/core2, plugin runtime2; KV polling3, Postgres2, Deno KV2, AMQP1. Combined totals deduplicate diagnostics across entrypoints. These are pre-existing debt, not new waivers; new contracts must add zero diagnostics. Core already owns ./shutdown (5public names) with a generic ShutdownManager; use this small existing subpath for lifecycle/clock/bounded drain, without extending or depending on its unrelated single-phase resource registry.

Actual thrown-handler failure control added before implementation: memory and KV polling2/2PASS (counts1,2,3); native Deno KVFAIL because its retry returns count1 instead of2. Four external backend variants unconfigured in that control run only; previously recorded native Redis/Garnet/Postgres explicit failure controls executed. Plan now requires counted enqueue-before-ack for ordinary native Deno KV user-handler errors, with durable persistence failure delegated to native unacked recovery. All four new test files pass scoped lint/fmt; no product source changed.
