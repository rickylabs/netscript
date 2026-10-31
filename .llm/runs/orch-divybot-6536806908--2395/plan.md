# Redis lease recovery — authorized second plan cycle

Issue #2395, coordinator #2474, draft PR #2483. Baseline main a410a81.
Archetype 2 integration, docs overlay; preserve the provider-neutral queue abstraction.
Earlier plan and both FAIL_PLAN verdicts retained in plan-prior.md and plan-eval.md.
New two-round cycle authorized in the PR decision linked in worklog. No code before PASS.

## Native primitives and migration

Redis Streams consumer groups provide native pending ownership, XAUTOCLAIM and delivery
counts, and suit a new Redis-only backend. Real pinned Garnet 2.2.1 rejects XAUTOCLAIM as
unknown; Redis 7 recognizes the same probe. Existing queues/delayed promotion use LISTs.
A Streams migration would need another backend, queue migration and listener redesign.
Keep LIST compatibility and wrap EVALSHA/EVAL with static native Lua transitions.

Sources: https://redis.io/docs/latest/commands/xautoclaim/ ,
https://microsoft.github.io/garnet/docs/commands/scripting and
https://microsoft.github.io/garnet/docs/getting-started/configuration .

Garnet must enable both Lua and lua-transaction-mode (key locking) before the consumer
upgrade. Document the prerequisite and upgrade migration. Extend the CLI infrastructure generator
so Garnet Container, Executable and both Auto branches always receive --lua and
--lua-transaction-mode. This also covers DenoKv Auto falling back to a Garnet executable.
Redis containers never receive Garnet-only flags. Keep endpoint allocation unchanged.
Probe scripting before any pickup; disabled scripting fails clearly with ready work intact.

## Locked contract and atomic transitions

- ListenOptions.visibilityTimeout defaults 30_000ms, new optional maxDeliveries defaults 5,
  recoveryGrace defaults 1_000ms. Durations/limits are finite positive integers; grace may be 0.
  Optional MessageContext.extendVisibility(ms?) returns false when its receipt expired or
  was replaced. Other providers can omit this capability.
- Claim, ack, nack, extend, orphan observation and reclaim each execute one atomic script
  over a message receipt key plus explicit ready/processing/deadline/owner/DLQ/outbox/metric
  keys in KEYS. No shared WATCH/MULTI retry loop.
- Claim verifies the expected ready tail, installs a unique fenced receipt with server-time
  deadline and incremented delivery count, and moves the raw bytes to processing atomically.
  TypeScript pre-reads the ready tail to normalize/validate JSON without Lua precision loss;
  the script checks tail equality before mutation. Retry competing pickups with a bounded
  candidate budget. Producers LPUSH at the opposite end and do not invalidate pickup.
- Preserve listen() sequential dispatch and settlement structure; replace only pickup with
  the atomic claim call, using a cancellable 50ms delay on empty queue. No concurrency rewrite.
- Receipt stores fence, deadline, lease duration, retry limit, original processing bytes and
  normalized envelope as an opaque JSON string. Redis TIME is the clock. Envelope stays opaque
  to Lua cjson so large numeric payloads retain JSON precision.
- Ack/nack/extend check matching fence and deadline strictly after server time. Stale/missing/
  expired receipts do nothing and increment staleSettlements. Extend never resurrects expiry.
- Reclaim reads a bounded deadline page then atomically rechecks observed fence and
  deadline + recoveryGrace < server time. A heartbeat winning the race cancels recovery.
  Expiry requeues the stored envelope; the next claim increments deliveryCount to 2.
  Requeuing nack and expiry at N attempts go to max_attempts_exceeded DLQ.
- Terminal explicit nack preserves reason/error metadata and existing DLQ record schema.
  Default terminal destination is the Redis DLQ LIST. Explicit external stores instead use
  the durable Redis outbox. Recovery polling appends idempotently then removes the exact
  outbox entry via a script; failure retains it. Health includes outbox depth. External stores
  must honor the existing idempotent-append port (append-only Redis store is the default,
  not an external mirror).
- Validate every key type and counter field before writes. Perform ready/DLQ/outbox insertion
  before processing/receipt deletion; an insertion error retains source work. Lua scripts
  are atomic but do not roll back runtime errors. Prevalidation prevents deterministic
  partial failure; source-first deletion is forbidden. Use same receipt/fence across unknown
  replies so command retransmission cannot settle another delivery.
- Destination invariant: handler effects and broker acknowledgement are separate transactions.
  Effects may land before a lost ack; redelivery keeps messageId and increments deliveryCount.
  Applications deduplicate effects by messageId/idempotency key. No exactly-once promise.

## Legacy orphan recovery and adoption race

New claims have no move-to-stamp gap. A rotating bounded processing scan finds legacy bytes
with no owner in an auxiliary owner hash. An atomic observation script checks exact membership
and absent ownership, creates a unique unowned receipt/fence with a full fresh lease, and indexes
it. It never invokes a handler or immediately requeues. Reclaim adopts only after lease+grace
expires and the observed fence matches. Concurrent observation cannot assign duplicate owners.
Legacy effective delivery count normalizes stored pre-delivery count +1 once; raw JSON gets
stable metadata once; invalid JSON becomes validation_failed with raw string payload.
Quiesce old consumers for rollout: old byte-based ack cannot be fenced. Even if old code removes
processing bytes, the receipt retains payload until settlement, allowing recovery at expiry.
Test mixed old/new receipts, observation races and a still-running old worker.

## Observability, lifecycle, gates and slices

Expose RedisAdapter.reclaimExpired(), getMetrics(), getHealth(). Durable counters include
reclaimed/deadLettered/staleSettlements; health includes ready/processing/DLQ/outbox depths.
Single-flight bounded recovery runs while handlers run; clear timers on abort/error/stop.
Reuse existing connections: producer commands keep their policy; the former blocking
connection owns lease scripts with offline queue and command replay disabled, bounded
command/connect timeouts and three transport attempts per operation using the same fence.
Listener startup/pickup and context settlement retry availability with capped cancellable
backoff until stopped; standalone operational calls remain bounded. Stop interrupts
the retry wait; closed old contexts cannot reopen a connection. Cached hash retries EVAL on NOSCRIPT.

1. Revised plan and same-session independent PLAN-EVAL, new cycle at most two rounds.
2. Port contract, lease scripts/runtime, adapter pickup/settlement hooks, README and real
   Redis/Garnet regressions plus run record. Gates: structured queue tests/check/lint/fmt,
   quality:scan and arch:check, full-export doc lint, scoped JSR audit/publication dry-run.
3. Negative controls, independent slice review/IMPL-EVAL, final evidence/fixes, commit/push.
   Ready after no blockers, then final exact pushed-head IMPL-EVAL and review-thread gate.
   No local scaffold.runtime E2E; coordinator alone merges. Because generation now changes,
   the full e2e-cli scaffold-runtime CI verdict is required; request coordinator arming of
   e2e-cli-gate and state this dependency in READY.

Runtime proof covers killed worker->count2; N expiries/nacks->DLQ; heartbeat; replacement process;
metrics; stale fence/ack races; legacy orphan grace; malformed/raw JSON; sustained producers and
multiple consumers; wrong-type destination; custom DLQ outage; disabled Lua; numeric precision.
Each acceptance regression must fail at runtime with old adapter restored, then pass restored fix.

Additional source/test scope: packages/cli/src/kernel/templates/aspire/helpers/register/
generate-register-infrastructure.ts and its tests/generate-register-infrastructure_test.ts.
Add generated-output regression assertions for Container, Executable, both Auto branches,
DenoKv fallback and Redis exclusion. Run existing generator test suites and scoped static gates.
The generator renders TypeScript directly; no asset-template or embedded-asset change is needed.

JSR audit: optional new ports preserve other adapters. Explicit exported types/JSDoc, unchanged
export paths, no dependencies/lock changes. Consumer gate: whole queue suite/public checks.
Relevant doctrine: adapter boundaries, no hidden state, explicit at-least-once lifecycle.
Existing adapters cardinality advisory grows from 15 to 19; navigation cost and closing
F-16 gate are recorded as redis-lease-cardinality in the debt registry. No functional gate
or acceptance is waived. Risks and mitigations are locked above. No open design decisions remain.
Deferred: Streams migration, concurrency #2351, other-provider heartbeat and exporter wiring.
Contributor path: packages/queue/README.md. Write surface in supervisor.md.
