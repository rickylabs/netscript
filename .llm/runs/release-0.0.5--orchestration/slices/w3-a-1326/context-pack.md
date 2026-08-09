# Context Pack: W3-A #1326 durable producer reconnect

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `release-0.0.5--orchestration/slices/w3-a-1326` |
| Branch         | `fix/streams-durable-producer-reconnect`        |
| Current phase  | `plan-eval — hard stop before implementation`   |
| Archetype      | `3 — Runtime/Behavior`                          |
| Scope overlays | none; Aspire runtime validation required        |

## Current State

Research and Design are complete on clean exact base `aa8e151e6`. PLAN-EVAL cycle 1 returned
`FAIL_PLAN` on evidence mechanics, while confirming the contract and load-bearing research. The
repair separates four true runtime REDs from four explicitly weaker API-absence checks, keeps the
existing producer port unchanged in S1, and supplies package-scoped fitness commands because the
root gates omit this package. No product source has changed. A fresh orchestrator-launched
Claude/Fable PLAN-EVAL `PASS` remains mandatory.

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

## In Progress

- Cycle-2 `status:plan-eval` handoff to the milestone orchestrator.

## Next Steps

1. Orchestrator launches a fresh separate Claude · Fable 5 · medium PLAN-EVAL (cycle 2 of 2).
2. If and only if `plan-eval.md` is `PASS`, begin S1 with public contract and individual RED tests.
3. If cycle 2 is `FAIL_PLAN`, escalate under the two-failure harness rule; do not implement.

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
