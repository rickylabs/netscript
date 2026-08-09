# Context Pack: W3-A #1326 durable producer reconnect

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326` |
| Branch         | `fix/streams-durable-producer-reconnect`        |
| Current phase  | `impl — S2 reconnect supervisor ready to commit` |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | none; Aspire runtime validation required        |

## Current State

PLAN-EVAL cycle 3 returned `PASS` and implementation is authorized. S1 is committed and pushed with
all eight REDs recorded separately. S2 implements the finite supervisor, exact protocol transport,
dual bounded FIFO, receipts/readiness, and distinct stop/close behavior. All eight behaviors are now
green, the full core suite passes 26/26, and a real reference-server test proves duplicate and gap
semantics without adding a package dependency.

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
- S1 contract/RED slice committed as `11ee98e22`, pushed, and reported on draft PR #1402.
- S2 focused/core tests and scoped check/lint/format are green; lock remains unchanged.

## In Progress

- S2 commit, push, and PR comment before S3 telemetry implementation.

## Next Steps

1. Commit, push, and comment S2 with all eight GREENs and reference-server evidence.
2. Begin S3 by keeping one publish span open from acceptance through terminal receipt settlement.
3. Add bounded retry/recovery/rejection/unknown metrics, remove executable console reporting, and
   run the decisive package-scoped quality/doctrine pair plus manual F-14 evidence.

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
| Producer application/ports/adapters | changed | Finite reconnect supervisor and exact protocol edge.             |
| Core and plugin service tests | changed | Eight behaviors plus reference-server idempotency proof.                |
| Slice artifacts         | changed | S2 gates and bounded implementation drift.                              |
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

- `11ee98e22` — S1 contract and classified RED evidence.
- S2 is locally green and awaiting its required slice commit/push/comment.
