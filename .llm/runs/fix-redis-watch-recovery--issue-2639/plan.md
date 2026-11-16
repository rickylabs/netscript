# Plan

## SKILL

netscript-doctrine, netscript-harness, netscript-pr, netscript-tools, netscript-deno-toolchain, jsr-audit.

## Contract and design checkpoint

Keep existing watch/ready API. Publish the existing typed KV errors so callers can catch failures. Subscriber recovery must restore every live lease after the old physical subscriber ends; a short native reconnect must also reread watched keys after subscription acknowledgement. State watch delivery is at least once/current state, not every intermediate mutation. An unrecoverable bounded retry rejects iteration with KvConnectionError, with original cause. Explicit adapter close rejects waiting watches with KvClosedError; consumer abort completes cleanly. Releasing one lease never removes another's subscription.

Recovery is bounded by existing native retry settings rather than endless silent waits. Use native retry AbortSignal, cancel on no remaining leases or adapter close. No idle keyspace polling or new options. Shared subscription owner supervises reconnect and terminal failure; watch loop handles state reread and queue failure. Design is locked below after real outage reproduction; no production implementation before separate PLAN-EVAL PASS.

## Slices

S1 owned-server reproduction and finalized lifecycle contract/plan, <=10files (run artifacts and redis-watch-recovery_test.ts); prove actual stopped server causes ended subscriber and existing iterator hangs. Compare a short reconnect gap and terminal failure.
S2 contract exports/JSDoc, minimal connection/subscription/queue/adapter repairs plus focused lifecycle tests/docs, <=12files. Prove long/short recovery, changed/deleted keys, two independent leases, typed terminal error and prompt abort/close.
S3 package/consumer gates and generated documentation assets, <=15files; final independent evaluation and required head checks.

## Gates

Structured scoped check/test/lint/fmt; real Redis outage suite plus full KV suite against isolated owned Redis; quality:gate, release:preflight, docs:accuracy, JSR audit/dry-run/doc lint, consumer/prose/corpus/publish freshness if docs/exports change. Full scaffold.runtime N/A: no scaffold/Aspire/executable wiring changes; direct real-server lifecycle tests are the acceptance oracle. Independent feature PLAN-EVAL selected before implementation, then feature IMPL-EVAL. No lock churn.

## Risks and deferred scope

Ready-before-resubscribe -> explicit acknowledgement before reread. Concurrent lease release/reacquire -> existing serialization and identity fences retained. Abort/close during recovery -> cancel native retry and pending connections; no retained handles. Outage mutation loss -> reread current key state including deletes. Infinite silent waits -> bounded retry and typed queue failure. Public errors -> existing hierarchy only, documented JSDoc/exports and doc lint/dry-run. Avoid fake-only proof -> real server stop/restart baseline. Prefix discovery/Streams/saga transport changes deferred; shared subscription lifecycle must preserve prefix behavior. No new abstractions or dependency changes.

## Locked recovery protocol

Retain WatchSubscriptions as the single lease owner. Extend its internal listener record with reconnect/error callbacks; no new public watch handle. Its per-channel Subscription keeps live Symbol lease identities, current physical subscriber and named connected/recovering/failed/closed phase. One shared recovery promise/controller supervises all active channels. A generation identity fences stale connection callbacks and late recovery results. Initial acquire and final release retain serialized SUBSCRIBE/UNSUBSCRIBE ordering. Do not hold the serialization tail across fresh-connection retry or state rereads: cancellation/release must remain prompt.

Disable native automatic resubscription only for the dedicated subscriber. On a short native reconnect, explicitly SUBSCRIBE every still-live channel and await acknowledgement before invoking watch resynchronization. On native end, ensureSubscriber clears the ended instance/promise and obtains a new shared connection with the existing three-attempt retry policy. The recovery controller's30-second deadline bounds connect/auth/readiness, subscription restoration and snapshot retries together; caller close/no remaining leases aborts it. A second outage invalidates the prior generation. Final retry failure becomes KvConnectionError with cause, delivered to all affected queues; no background unhandled rejection. Explicit adapter close sends KvClosedError before closing sockets. Abort takes precedence for a watch whose caller already aborted.

Use native @std retry/delay AbortSignal support, plus abort-aware pending subscriber connection establishment. The manager's close cancels pending subscriber work; ended/reconnecting sockets disconnect rather than awaiting a QUIT that can never complete. A completed connection is never disconnected by a stale attempt or a single lease release while another remains.

Fixed-key resynchronization reuses getMany, with native bounded retry under the same recovery signal so primary-client reconnect timing does not falsely end a watch. Deliver current values for all observed keys, including missing keys as delete/null. These are change batches (no initial marker) and may repeat unchanged values; document at-least-once current-state delivery, not a mutation history. Install message listeners before acknowledgement and buffer messages throughout recovery. Track keys touched by live messages during a snapshot read and suppress only their racing snapshot entries; queued messages retain delivery. Never compare opaque Redis versionstamps for order. A new reconnect generation or caller abort cancels stale resync work before it can enqueue results.

WatchBatchQueue gains a terminal failure state that wakes next() and rejects with the original typed error. Failures also interrupt debounce; abort completes cleanly. Callback errors normalize once into the existing KV error hierarchy. Export existing KvError, KvConnectionError and KvClosedError from root and Redis entrypoints with JSDoc so callers can catch them without private imports. No new configuration or dependency.

## Concrete file groups

S1 (7files): six run artifacts and tests/redis-watch-recovery_test.ts. Real stopped-server/end/restart loss and never-restarted typed-failure oracle; native atomic CLIENT KILL TYPE pubsub + SET proves a publication-free short gap before any resubscription.
S2 (17files maximum): application/errors.ts; mod.ts; redis.ts; adapters/redis/connection.ts, watch-subscriptions.ts, watch-batch-queue.ts; adapters/redis.adapter.ts; tests/redis-watch-recovery_test.ts and a focused lifecycle test file; README.md; docs/site/data-persistence/kv-queues-cron.md; six run artifacts. Contract/JSDoc exports first, then adapter implementation, green regression/lease-cancellation tests and docs. Each changed concern stays in its existing owner; no package split or generic lifecycle registry.
S3 (14files maximum): six run artifacts, independent evaluate.md, generated prose/corpus/MCP+CLI publish carriers and CLI asset barrel if changed. Static/runtime/package/consumer gates prove the final state, then required checks and review threads. No doctrine debt deepening; JSR exports reuse existing explicitly typed error classes and cannot add slow inference.

## Open decisions

None. Bounds are30seconds plus the preceding native reconnect window; no public retry option in this fix. Recovery snapshots may repeat values, matching at-least-once state observation. Initial ready remains one-time startup acknowledgement. In-flight watch close fails with KvClosedError, caller abort completes normally. Prefix discovery is unchanged, but shared lease recovery/failure must preserve its lifecycle. Native Redis-only test commands are diagnostic CLIENT/MULTI/SET, never Streams. Production recovery only requires ordinary SUBSCRIBE and existing reads.
