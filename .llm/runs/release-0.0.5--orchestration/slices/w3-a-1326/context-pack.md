# Context Pack: W3-A #1326 durable producer reconnect

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326` |
| Branch         | `fix/streams-durable-producer-reconnect`        |
| Current phase  | `impl — S1 contract and committed RED evidence` |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | none; Aspire runtime validation required        |

## Current State

PLAN-EVAL cycle 3 returned `PASS` and implementation is authorized. S1 now contains the standalone
v1 producer contract, new clock/random/transport ports, four independently failing behavioral tests,
and four single-symbol API-absence fixtures under the slice run dir. The existing
`StreamProducerPort` and concrete producer remain unchanged until S2. All eight REDs are recorded
separately, and the S1 package scoped check is green.

## Completed

- All requested skills and required harness/doctrine/profile/gate references read.
- Live issue #1326 read; seven acceptance rows quoted verbatim in the plan.
- W2-B #1329 research/plan/PLAN-EVAL/runtime evidence and shipped v1 envelope read.
- Exact AP-13 and connector-convergence debt rows cited without widening.
- Upstream client/server producer protocol inspected through `deno doc` and cached primary source.
- Initial-outage desired behavior reproduced RED with raw exit 1.
- Current focused tests, full export doc lint, JSR scan, and raw package publish dry-run recorded.
- Ordered S0–S7 plan and Design checkpoint written.
- PLAN-EVAL F1–F3 repaired: classified RED mechanics, S1 port compile story, scoped fitness/F-14
  evidence, and corrected client/server header-export wording.
- PLAN-EVAL F4 repaired: type-broken negative fixtures moved in the plan from package test roots to
  the slice run dir, preserving green scoped and repo CI checks without exclusions.

## In Progress

- S1 contract/RED commit, push, and PR comment before S2 implementation.

## Next Steps

1. Commit, push, and comment S1 with the eight separately classified raw exits.
2. Begin S2 by widening the existing producer port atomically with the concrete class.
3. Replace the four compile-time fixtures with behavioral tests while turning all eight REDs green.

## Key Decisions

| Decision                               | Source       | Notes                                                             |
| -------------------------------------- | ------------ | ----------------------------------------------------------------- |
| Finite seven-state lifecycle           | plan D1      | Exhaustion is visible terminal failure, not dormant retry.        |
| 8-attempt bounded exponential policy   | plan D2      | Deterministic clock/random ports.                                 |
| Dual FIFO bounds and reject-newest     | plan D4      | 256 events + 1 MiB UTF-8 defaults.                                |
| Every write returns completion receipt | plan D5–D8   | No silent accepted-write loss; ambiguity is `delivery-unknown`.   |
| Exact tuple/body replay                | plan D7      | Narrow adapter over upstream-exported protocol constants.         |
| Stop differs from close                | plan D11     | Only acknowledged close implies remote `streamClosed`.            |
| One write span survives outage         | plan D12–D13 | Same injected trace/correlation, span open until receipt settles. |
| W2-B envelope unchanged                | plan D15     | No offset parsing or second contract.                             |

## Files Changed

| Path                    | Status  | Notes                                                                  |
| ----------------------- | ------- | ---------------------------------------------------------------------- |
| Slice `supervisor.md`   | changed | Live branch/base/evaluator identity replaces stale preparation fields. |
| Slice `research.md`     | new     | Live issue, upstream constraints, JSR scan, debt, RED.                 |
| Slice `plan.md`         | new     | Locked decisions, exact acceptance, risks, gates, ordered slices.      |
| Slice `worklog.md`      | new     | Design checkpoint and baseline evidence.                               |
| Slice `context-pack.md` | new     | This resumable summary.                                                |
| Slice `drift.md`        | new     | Preparation/upstream/audit divergences.                                |

## Gates

| Gate family | Current status                       | Evidence                                                                                   |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| Static      | baseline green; reconnect RED proven | `worklog.md` gate table                                                                    |
| Fitness     | planned; AP-13 currently accepted    | Decisive package-scoped scan/check plus manual F-14 `PENDING_SCRIPT`; #1403 owns root gap. |
| Runtime     | not run                              | Token-free focused Aspire proof is S5; serialized gate requires grant.                     |
| Consumer    | not run                              | S4; #1398 gates stay deferred.                                                             |

## Open Questions

- None that force implementation rework. PLAN-EVAL may challenge the locked defaults or adapter
  seam; any such finding returns to plan-only repair.

## Drift and Debt

- Drift: stale preparation identity; upstream declaration/runtime mismatch; JSR helper banner false
  positive; root quality/doctrine omission tracked by #1403.
- Debt: exact producer AP-13 row may close only after S3; connector convergence remains open.

## Commits

- See the draft PR commit list + per-slice comments. No product commit exists yet.
