# Plan

## SKILL

netscript-doctrine, netscript-harness, netscript-pr, netscript-tools, netscript-deno-toolchain, jsr-audit.

## Contract and design checkpoint

Keep existing watch/ready API. Publish the existing typed KV errors so callers can catch failures. Subscriber recovery must restore every live lease after the old physical subscriber ends; a short native reconnect must also reread watched keys after subscription acknowledgement. State watch delivery is at least once/current state, not every intermediate mutation. An unrecoverable bounded retry rejects iteration with KvConnectionError, with original cause. Explicit adapter close rejects waiting watches with KvClosedError; consumer abort completes cleanly. Releasing one lease never removes another's subscription.

Recovery is bounded by existing native retry settings rather than endless silent waits. Use native retry AbortSignal, cancel on no remaining leases or adapter close. No idle keyspace polling or new options. Shared subscription owner supervises reconnect and terminal failure; watch loop handles state reread and queue failure. Design details will be locked after red runtime research and before separate PLAN-EVAL; no production implementation before PASS.

## Slices

S1 owned-server reproduction and finalized lifecycle contract/plan, <=10files (run artifacts and redis-watch-recovery_test.ts); prove actual stopped server causes ended subscriber and existing iterator hangs. Compare a short reconnect gap and terminal failure.
S2 contract exports/JSDoc, minimal connection/subscription/queue/adapter repairs plus focused lifecycle tests/docs, <=12files. Prove long/short recovery, changed/deleted keys, two independent leases, typed terminal error and prompt abort/close.
S3 package/consumer gates and generated documentation assets, <=15files; final independent evaluation and required head checks.

## Gates

Structured scoped check/test/lint/fmt; real Redis outage suite plus full KV suite against isolated owned Redis; quality:gate, release:preflight, docs:accuracy, JSR audit/dry-run/doc lint, consumer/prose/corpus/publish freshness if docs/exports change. Full scaffold.runtime N/A: no scaffold/Aspire/executable wiring changes; direct real-server lifecycle tests are the acceptance oracle. Independent feature PLAN-EVAL selected before implementation, then feature IMPL-EVAL. No lock churn.

## Risks and deferred scope

Ready-before-resubscribe -> explicit acknowledgement before reread. Concurrent lease release/reacquire -> existing serialization and identity fences retained. Abort/close during recovery -> cancel native retry and pending connections; no retained handles. Outage mutation loss -> reread current key state including deletes. Infinite silent waits -> bounded retry and typed queue failure. Public errors -> existing hierarchy only, documented JSDoc/exports and doc lint/dry-run. Avoid fake-only proof -> real server stop/restart baseline. Prefix discovery/Streams/saga transport changes deferred; shared subscription lifecycle must preserve prefix behavior. No new abstractions or dependency changes.
