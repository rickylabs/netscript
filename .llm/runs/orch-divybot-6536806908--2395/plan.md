# Redis visibility timeout — blocked at PLAN-EVAL

Archetype 2 integration: queue-owned ports with technology-specific Redis IO. Runtime
failure/cancellation rules apply within this adapter. Docs overlay: queue README.
Baseline: main a410a815ce1401d533b18f2a85eb75e266de94a5. No existing PR covers #2395.
Current doctrine: preserve adapter boundary, typed public API, named lifecycle, explicit
at-least-once delivery; existing listener and delayed-promotion structure remain intact.
Relevant known debt: existing adapter size/logging conventions; introduce no new debt.

## Locked decisions

- Respect ListenOptions.visibilityTimeout (default 30 seconds), add optional maxDeliveries
  (default 5), and optional MessageContext.extendVisibility(milliseconds?) returning whether
  the current claim was still live. Other providers may omit the optional capability.
- Preserve BRPOPLPUSH blocking pickup exactly. Stamp its processing entry, increment the
  deliveryCount and index its deadline in one guarded transaction touching only processing
  and lease keys, never the producer ready key. A crash in the pickup-to-stamp gap is
  recovered by adoption; a killed child test pins the gap. Use one dedicated serialized
  WATCH connection and bounded MULTI retries. Each
  processing encoding includes a unique receipt and its retry policy, so old contexts cannot
  remove a later delivery. Redis TIME supplies shared time rather than worker clock skew.
- Use WATCH on all touched keys, validate key types before destructive transactions, reject
  connection-epoch changes before EXEC, disable command replay/offline queue for lease IO,
  inspect all EXEC results. No partial remove-then-push settlement.
- Reclaim a bounded page from the deadline sorted set. Requeue expired claims preserving
  message identity, headers and current delivery count; the next claim increments to 2.
  On attempt N, terminal nack or expiry atomically moves the record to the Redis DLQ and
  increments durable counts. Persist maxDeliveries in the claim for cross-worker recovery.
- Default DLQ matches RedisDeadLetterStore records/reasons. An explicit external store uses
  a durable Redis outbox, append-before-removal, and the existing idempotent append port;
  a failed external write retains the outbox record for retry and never loses the message.
- Recover pre-upgrade and pickup-gap processing entries through a rotating bounded scan.
  Adoption atomically replaces each lease-less entry with a unique receipt and a fresh full
  lease, never immediately requeues it. Its effective delivery count is preserved (legacy
  stored count was the number BEFORE its in-progress delivery, so normalize by +1 once).
  Multiple adopters use WATCH. Old and new entries share the processing list. Document
  quiescing old workers: an old worker cannot ack the replaced bytes and its work can repeat.
  Test mixed live old/new entries plus a stale old-worker ack.
- Normalize non-envelope JSON once into a stable envelope before handing it to a handler.
  Persist its count/identity on every retry. Atomically move malformed JSON bytes to DLQ
  with validation_failed and raw string payload; test poison bytes next in queue.
- Expired/missing receipts make ack/nack no-ops and increment staleSettlements; never throw
  for a stale receipt. Unknown connection outcomes retry a fixed budget until confirmed
  committed/gone. A persistent outage remains a surfaced error with durable claim retained.
  Test lost connection during ack, stale ack after expiry, and max-attempt handler error.
- Recovery timer also drains the custom DLQ outbox. Health includes outbox depth. Explicit
  stores must provide idempotent append; existing RedisDeadLetterStore is append-only and
  is therefore unsuitable as an explicit mirrored destination without a deduplicating layer.
- Expose reclaimExpired() as an operational seam and getMetrics()/getHealth() with durable
  reclaimed/deadLettered counters and ready/processing/DLQ depth. Poll recovery while a
  handler runs; clear timers and disconnect the owned lease client on stop.
- Keep listen() sequential and structurally unchanged: replace only its pickup call and
  initialize/stop the lease runtime through existing lifecycle hooks. No concurrency rewrite.

## Open-decision sweep

No decisions requiring owner input remain. Safe to defer: queue-wide telemetry exporter
integration, broader provider heartbeat parity, concurrency (#2351), Streams migration.

## Risks and mitigations

- Crash between pickup and lease: one watched transaction covers both; real killed-child proof.
- Ack/heartbeat/reclaim races: unique receipt, server deadline and WATCH; contention tests.
- Garnet Lua disabled: MULTI-only lease protocol; test real Redis and real Garnet if available.
- Poison loops: delivery count increments at claim, persisted retry policy, terminal DLQ.
- Wrong-type destination/reconnect: validate watched types; epoch guard and replay disabled.
- Custom DLQ unavailable: durable outbox; never discard before successful idempotent append.
- Legacy claims: bounded adoption; rollout caveat and migration regression.

## Slices and gates

1. Plan/run record, draft PR; independent PLAN-EVAL before implementation.
2. Contract, atomic Redis lease runtime, adapter settlement/lifecycle, README and regression
   tests in packages/queue plus run records. Structured queue tests/check/lint/fmt;
   quality:scan and arch:check; real backend crash, expiry, DLQ, heartbeat, restart,
   stale receipt, contention and wrong-type checks. Independent slice review/IMPL-EVAL.
3. Negative-control and final evidence records, fixes only if required; commit/push,
   mark ready after no blockers, exact pushed-head final IMPL-EVAL, review-thread gate.

## JSR/public-surface audit

Existing exports remain. New optional port fields preserve current adapter implementations;
new adapter methods/types have explicit annotations and JSDoc. Internal runtime stays behind
existing Redis entrypoint. No dependencies or lock changes. Full-export doc-lint and scoped
JSR audit required; publish dry-run where supported. Read README to extend the lease seam.

## Acceptance and validation

The issue has no checkbox section. Prove all owner requirements explicitly: worker death
redelivers count 2; N attempts reaches structured DLQ; heartbeat protects long jobs; replacement
process reclaims stopped-process claims; health/metrics show counters; each core regression
fails with the old Redis implementation restored temporarily. Use real Redis/Garnet and
structured wrappers. No local scaffold.runtime E2E (owner instruction). No scaffold/runtime
wiring outside the queue adapter changes. CI state reported at exact head without waiting.

## Coordinator decision after round 2

Status: NOT APPROVED FOR IMPLEMENTATION. Round 2 still returned FAIL_PLAN; the
following proposed corrections are concrete but have no passing evaluator verdict.
Do not treat the earlier locked decisions as approved runtime design.

Proposed revision for a newly authorized plan-evaluation cycle:

- Replace shared-key WATCH with a fence per claim, derived from the original processing
  bytes and then the unique receipt. Only ownership/liveness fences participate in WATCH;
  ready/processing/deadline/DLQ/counter destinations remain inside the atomic mutation.
- Specify the destination-type invariant and preserve source records on a failed destination
  write. The evaluator's per-claim recommendation still needs to reconcile this with concurrent
  administrative key-type changes; MULTI itself does not roll back runtime command errors.
- Permit a handler only after its own receipt is committed. Stamp loss/exhaustion skips
  handler invocation, increments a diagnostic counter and retains the durable processing entry.
- Adopt only lease-less bytes observed on two scans separated by a full recovery grace period.
  Any intervening receipt stamp cancels adoption; test this against a delayed healthy stamp.
- Add sustained-producer/multi-worker progress proof with no fallback adoptions or exhausted
  heartbeat/ack retries, and a concurrent stamp/adoption single-handler regression.

Recommendation: coordinator authorize a fresh plan cycle on the revised fence/grace design,
then implement the full queue fix in this existing draft PR. Alternative: reassign the design
and preserve this branch's research/evidence. Never waive runtime proof or mark this PR ready.
