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
