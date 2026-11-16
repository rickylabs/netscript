# Worklog

## Design

Research is active; required behavior and must-resolve lifecycle/budget/accounting choices are in plan.md. Existing Worker lifetime currently conflates listener cancellation and active job abort; queue/runner ownership boundaries must be named before a repair. Feature Plan-Gate selected. No production changes or reproduction claimed.

Fresh main b0eb07957 fetched before branch. Both full issues and relevant public docs/APIs read. Initial source spot-check confirms missing pause/resume, immediate abort at stop and ineffective later30second work wait. Core runner docs confirm1second grace. Next complete backend inventory and functional red tests.


## Research and red contracts complete

All running findings reproduced as listed in research.md; corrected Postgres harness excludes the concurrent schema race. Actual Worker replacements on Redis/Garnet fail at count2 on first restart; ordinary requeue controls pass. AMQP baseline upstream double acknowledgement blocks its accounting oracle and is explicitly scoped as prerequisite, with confirmed-publish and native-cancel plan locked. Four active owned backend containers and the earlier Garnet startup replacement removed by immutable identity after leak/teardown preview; no foreign cleanup. Deno info introduced one exact-version specifier alias in deno.lock; removed only that incidental line, preserving the original lock. No product changes.

## Design

Core owns named idle/running/paused/draining/stopped lifecycle, monotonic disposable clock, total25s budget, default5s abort cleanup and1s settlement reservation; plugin wires existing queues/supervisors/runner. Per-attempt intake pause barrier preserves execution signals and lease renewal, start lifetime, task coverage and resumed concurrency. Explicit preserveDeliveryCount nack defaults false; shutdown first-cause only, fenced/idempotent one-refund handback. Config/schema/native loader and both standard runtime constructors forward data-only budgets into the real runner. No helper agent, no dependency on the separate process-shutdown PR. plan.md enumerates ordered <30-file slices, runtime/failure/concurrency/durability cases and all publication/fitness/runtime/consumer gates. Separate feature PLAN-EVAL required before production.


## Independent Plan-Gate PASS

[GLM5.3/provider-default independent PLAN-EVAL PASS](https://github.com/rickylabs/netscript/pull/2645#issuecomment-6931112123) at89effd610:8/8Plan-Gate,9/9acceptance coverage, no production edits, separate session/family confirmed. Retain verdict. Correct S6 documentation path to tune-worker-runtime.md and name generated carriers; pin committed claims racing pause to ordinary charged requeue (preservation is draining/shutdown only), with an S4 race oracle. These are evaluator bookkeeping/advisory repairs, no architectural re-plan. S2 may begin.


## S2 core contract and receipt settlement

Public contracts first: core ./shutdown named lifecycle/monotonic disposable clock/default total25s/default grace5s/resolver and fixed work-abort-settlement primitive; queue NackOptions.preserveDeliveryCount defaultsfalse, requeue-only. Redis/Garnet handback encodes the refunded envelope in the existing atomic fenced receipt transition, bypassing limit exhaustion only on that explicit live handback; expiry recovery remains charged. Postgres generates an opaque per-claim locked_by receipt, atomically refunds/unlocks within the live fence, guards ack/release and once-only settlement. Simplified existing envelope/DLQ plumbing reduces touched Postgres581->568lines. No new schema/dependency/command/Streams.

Independent implementation-lane slice review: diff follows approved boundaries; no orphaned timers, root/barrel mirror, hidden lifecycle registry or generic transport abstraction. The ordinary default nack stays charged. Core tests assert19s work plus5s cleanup plus1s settlement share one monotonic25s deadline and clear timers. Native tests prove repeated8handbacks, max-limit bypass, terminal preservation ignored, duplicate/stale/expired contexts cannot refund/remove newer receipts. Closed Redis contexts legitimately reject AbortError; the test pins that safe outcome and unchanged newer claim rather than requiring reopening.

Validation: structured live Redis/Garnet/Postgres suite28pass/0fail/0ignored (shutdown requeue + refund races + existing Redis lease cases); budget/Postgres adjacent8pass/0fail; scoped check/lint/fmt0; core shutdown doclint0; release:preflight fourPASS and docs:accuracyPASS. Original config/runner/Worker reds remain pending S4/S5, other adapter reds pending S3. Three positively owned backend containers retained for following slices, immutable IDs/mounts privately recorded; foreign resources untouched.
