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

PLAN-EVAL round 1: FAIL_PLAN on claim contention, poison input, legacy adoption and
settlement ambiguity. Revised plan locks all four, including real regressions. No code edited.


## Terminal plan-gate decision

- Round 1: FAIL_PLAN. Revised blocking pickup, raw/poison input, legacy adoption and
  stale/ambiguous settlement semantics before round 2.
- Round 2, same evaluator: FAIL_PLAN. Remaining blockers are shared-key transaction
  contention and healthy-stamp/adoption ownership/grace rules. See plan-eval.md for both
  complete verdicts and plan.md for a concrete proposed correction.
- Two-round limit reached. No third evaluation, implementation, IMPL-EVAL or readiness claim.
- Baseline focused wrapper: 7 passed, 0 failed, exit 0.
- Baseline real-Redis delayed-promotion wrappers: 14 passed, 1 ignored, 0 failed, exit 0.
- Redis and Garnet backends were provisioned independently and responded to TIME/LPOS.
  These setup checks do not prove the requested fix; all acceptance remains unproven.
- Run-owned backend processes stopped at handoff. No foreign resources changed.
- Reconcile: draft PR #2483 remains open; no labels/milestones changed; coordinator #2474
  owns the next decision. Assignment and final-report files excluded from commits.


## Authorized resumption — 2026-10-31

Coordinator authorization: https://github.com/rickylabs/netscript/pull/2483#issuecomment-6536979349

> Authorized: a fresh PLAN-EVAL cycle, at most 2 rounds, on your revised per-claim fence and recovery-grace design, in this draft PR. Keep both earlier verdicts in plan-eval.md and use the same separate Opus 5.5 evaluator session. Implementation starts only after a PLAN-EVAL PASS.

Latest user instruction: more work remains, keep going and mark ready when done.
Both prior FAIL_PLAN verdicts are retained. New cycle uses the same evaluator; no waiver
of acceptance, independence, or final exact-head evaluation. NetScript MCP consulted again.

Second-cycle design replaces rejected WATCH proposal with atomic Lua pickup+lease,
receipt-fenced grace-aware reclaim and legacy orphan observation. Cancellable 50ms idle
polling, unchanged sequential listener structure, durable outbox/counters. No dependencies.
Garnet probe rejects XAUTOCLAIM; transactional Lua works. Document both required Lua flags.

New cycle round 1 FAIL_PLAN: Lua prerequisite would break generated Garnet defaults.
Resolved in plan by expanding generator/test scope to enable both Lua flags in Container,
Executable and Auto paths, with existing-project migration docs. New cycle round 2 pending.

Authorized cycle round 2: PASS. Independent evaluator confirmed both generator launch
functions cover every Garnet arm, including Auto fallback. Implementation now authorized.
Reconcile: no code yet; scaffold CI verdict is required and coordinator will be notified.

## Implementation proof before independent review

- Core acceptance tests: 10 passed on real Redis 7.0.15 and Garnet 2.2.1 (Lua transactional).
- Whole queue suite: 131 passed, 2 CI-only sentinels ignored; exit 0.
- Safety/compatibility/lifecycle focused suite: 26 passed, including a separate Garnet with
  Lua disabled proving that unsupported configuration never removes ready work.
- Infrastructure generator: 25 passed for both managed Garnet launch functions and Auto arms.
- Negative control: old main Redis adapter restored temporarily; all 10 core tests fail at
  runtime, with failures specifically on redelivery, missing heartbeat and stuck attempt 1.
  The implementation restored in finally; full passing rerun follows.
- Structured check: all 64 queue TS files and two changed CLI files pass (66 files).
- Queue lint: 64/64 processed, 0 findings. CLI lint: 2/2 processed, 0 findings, using a
  standalone config because root intentionally excludes CLI; no gate targets dropped.
- Quality gate durable receipt: quality:scan + arch:check/dependency checks exit 0.
- Scoped JSR audit/dry-run: dry-run OK; cardinality advisory recorded as explicit debt.
- Full-export doc-lint: exactly the existing WatchableKv private-type-ref, also present with
  old adapter restored; 0 new missing-JSDoc diagnostics. No unrelated KV change.
- Architecture debt delta recorded in redis-lease-cardinality, with cost/owner/closing gate.

Final restored implementation plus adjacent generator suite: 182 passed, 2 CI-only sentinels
ignored, exit 0. Publication checks preserve the single verified baseline KV documentation issue.
Checked the pinned Garnet commit Dockerfile: ENTRYPOINT is /app/GarnetServer with no CMD
arguments, so adding Lua flags does not replace hidden default port/index command arguments.
Source: https://github.com/microsoft/garnet/blob/b0255a31de95b1e903ee187feb59ceb04819a639/Dockerfile

Self-review found dangling deadline-index entries could occupy the bounded recovery page.
Add an atomic missing-record prune (rechecks absence in-script), plus real Redis/Garnet
100-dangling-entry regressions. This is part of the bounded recovery seam, not scope expansion.

IMPL-EVAL round 1: FAIL_FIX on transient transport ending consumption, external DLQ errors
ending consumption, and terminal reason priority at the last delivery. All addressed:
listener readiness/pickup retry availability loss with capped cancellable backoff; settlements
remain bounded; broken ioredis generations are replaced from duplicate() options; external
outbox flush is single-flight and independent from lease recovery/consumption; terminal
requeue:false preserves reason. Add real TCP proxy outage (4 seconds) and startup cancellation
tests, healthy-next-message during DLQ outage, and last-delivery reason tests. Proxy outage
plus safety suite now passes 18 tests on real Redis/Garnet.

After all I1–I3 fixes: combined queue + both generator suites PASS, 190 tests passed,
2 CI-only sentinels ignored, exit 0. Real TCP outage tests prove consumption after a
four-second disconnection; startup cancellation and lost-ack generation replacement pass.
Additional source/API/static gates are rerun on this reviewed working tree.

IMPL-EVAL round 2 found I1b: settlement during a handler outage still ended consumption.
Context ack/nack now use the same cancellable availability loop, while transport attempts
and standalone operational settlements remain bounded. Fences turn expired retries into
counted no-ops; a handler's own error still propagates after its fallback nack.
Real Redis/Garnet busy-handler outage tests now prove both continued consumption and delivery2
after expiry. Outage+compatibility suite: 16 pass, 1 optional no-Lua probe skipped in that run.
Feature-tier IMPL-EVAL limit remains 5 rounds; next is round3, same evaluator.

IMPL-EVAL round3 PASS: the independent evaluator re-ran its own busy-handler outage probe on
Redis and Garnet and confirmed continued consumption, delivery2 and counted stale ack.
It independently ran 16 core/outage tests with zero failures. No remaining blockers.

Final local combined queue+generator result: 192 passed, 2 CI-only sentinels ignored, exit0.
Structured check68files, queue lint66files, queue fmt66files, CLI lint/fmt2files: pass.
Redis-only and ports documentation gate now both exit0 after completing public type exports;
the full package still has the separately verified unchanged KV private-type-ref baseline.
JSR audit/publication dry-run OK; F16 navigation debt explicitly recorded.

Reconcile before implementation sign-off: PR #2483 is still draft; no labels/milestones,
locks/caches or foreign resources changed. Commit/push implementation and run evidence;
mark ready now that preliminary independent review has no blockers. Required scaffold-runtime
CI is coordinator-armed; final evaluator must inspect the exact pushed head. No merge here.
