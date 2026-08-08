# Escalation — what Plan-Gate governs in a milestone run

**Trigger:** two consecutive `FAIL_PLAN` cycles on the 0.0.5 wave plan. `netscript-harness` sets the
eval loop limit at two failures before escalation, so this is a harness-defined boundary, not a
judgement call.

**Status:** owner decision required. W2 continues; it is authorized under the v3 `PASS` and its own
per-group PLAN-EVALs, and neither cycle found fault with it.

## What is not in dispute

Cycle 2 confirmed as fixed or sound: the W3-B split, the expensive-gate practice (sufficient without
tooling), the #1373/#1374 adjudication, the #1343 pull, the locked module name as a decision
dependency, the W5-C GLM constraint, and four canary boundaries. Eight of its nine findings were
uncontested factual errors and are repaired in plan § v4.2 — scope arithmetic (27, not 26), #1169's
move, #1004's closure rule, the missing authority column, #1379's lock policy, the stale
`phase-registry.md`, approximate `cut-trace.md` timestamps, and W3's missing dispatch sub-order.

## The disagreement

Cycle 2 requires ordered commit-slice tables — files, per-slice claim, proving gate — for **all**
W3–W5 groups **inside the milestone plan, before the plan can pass**, citing `plan-gate.md:26-27`
and `plan-protocol.md:40`.

The orchestrator's position is that this is right for a `run-loop.md` run and wrong for a
`milestone-run.md` run, because the two profiles have different Plan-Gate subjects:

- `milestone-run.md` stage B defines the milestone plan's deliverable as **PR clusters, wave
  sequence, declared canary points, and dispatch preconditions**. Slice-level content is not in that
  contract.
- `run-loop.md` owns the slice contract, per change. In this run that lives in the **per-group
  brief**, and each brief takes its own separate-session PLAN-EVAL before its group implements. W2
  demonstrates it: #1394 and #1395 each hold a recorded Fable 5 `PASS` obtained exactly that way,
  and both verdicts found real defects — one traced the RED probe to a concrete `KvConnectionError`
  before any network call, the other caught a replay snapshot missing cursor and terminal state.

Two further reasons to prefer per-wave briefs, both concrete rather than theoretical:

1. **The dependent slices cannot be specified yet.** W3-A's slices depend on the SSE envelope W2-B
   has not frozen; W5-A's depend on the module-name and IA decisions W4-A has not made. Writing them
   now produces a plan that will be wrong by the time it is used.
2. **This run has already been bitten by exactly that.** #1202 was carried as owner-blocked through
   three documents because an inherited preflight was treated as ground truth and nobody read the
   issue. Pre-specifying nine more groups at maximum distance from their evidence multiplies that
   failure mode.

Cost of complying as asked: another full cycle authoring twelve groups' slice tables before W3 can
dispatch, against a standing owner instruction to prioritise concrete public framework fixes over
process work — and the tables would be rewritten as their dependencies resolve.

## Options

| #     | Option                                                                                                                                                                                                                                                                                                        | Consequence                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | **Ratify the split subject** (recommended): the milestone plan owns scope, clusters, waves, canaries and closure; each group's brief owns its slice table and takes its own PLAN-EVAL before that group implements. Re-run cycle 3 against the milestone plan **only**, with this scope stated in the prompt. | W3 dispatches after cycle 3 plus the milestone-move receipt. Slice-level rigour is unchanged — it moves to where the evidence is. Matches how W2 actually ran. |
| B     | Comply as asked: author ordered slice tables for all twelve W3–W5 groups now, then re-evaluate the whole plan.                                                                                                                                                                                                | One more long planning cycle before any W3 code. Tables for dependent groups get rewritten as W2/W4 resolve.                                                   |
| C     | Waive the third cycle: accept the v4.2 plan on the eight repaired findings and dispatch W3 on per-group briefs without a third milestone-plan evaluation.                                                                                                                                                     | Fastest. Leaves the milestone plan formally unpassed, which the run must then carry as recorded drift.                                                         |

**Recommendation: A.** It is the only option that keeps a real Plan-Gate on every group while
placing it where the group's dependencies are actually known, and it needs one short cycle rather
than a full re-plan.

**Not recommended: C.** Two evaluation cycles have each found real errors in this plan — including a
false baseline claim and a p1 issue mis-scoped across three documents. Dropping the gate now would
discard the mechanism that caught both.
