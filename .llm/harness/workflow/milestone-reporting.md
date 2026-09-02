# Milestone Coordinator Reporting Contract

Binding reporting surface for a long-running milestone cluster. The coordinator derives every report
from `milestone-cluster-state.json` plus freshly reconciled GitHub/session/runtime evidence;
`milestone-status.md` is the generated, human-readable view. A report is a control checkpoint that
drives intervention and merge decisions. It is never a reason to pause independent delivery.

## Cadence

While a milestone has open committed issues, active leaves, a pending canary, or an incomplete
release captain, publish a coordinator report:

- once after cluster bootstrap;
- at least every **60 minutes** during active delivery;
- immediately after a merge batch, canary transition, scope re-intake, new release blocker,
  owner-only decision, supervisor recovery, or material ETA change; and
- once more at stable-cut completion.

Arm an event-driven watcher plus a 60-minute heartbeat. A heartbeat with no state transition still
requires a fresh reconciliation and report. After reporting, continue every independent workstream.
Do not end a coordinator turn merely because a report was published.

## Evidence and language

Before writing the report, reconcile current `main`, milestone issues, open PRs, evaluator verdicts,
topic sessions, and owned runtime resources. GitHub/Git and exact receipts are authoritative; chat
memory, a visible session, an exit code, and an old status page are not.

Write for an owner who should understand the train without reading CI logs:

- Lead with the outcome and exact release/canary readiness.
- Explain each red in plain English: what was observed, the actual or best-supported cause, its
  release impact, who owns it, and the next bounded action.
- Classify reds as `product`, `test-harness`, `infrastructure`, `lifecycle-metadata`, or
  `evaluator-transport`. A failed administrative gate must not be described as a product failure.
- Expand acronyms on first use when the meaning is not evident from the issue title.
- Name exact PRs/issues and heads where they change the decision; link raw evidence instead of
  copying logs.
- State `no owner decision needed` when true. Never manufacture a question to justify idling.

## Required report order

Every active report contains these sections, in this order:

1. **Outcome headline** — current main, whether the next canary/stable cut is dispatchable now, and
   the most important change since the previous report.
2. **Canary / release path** — target version, state, ETA range, confidence, evidence basis, and an
   ordered critical-path table. `Imminent` without a bounded path and ETA is invalid.
3. **Progress since the previous report** — merged PRs, closed issues, new intake, current open
   issue/PR counts, and the reason when a raw queue grew despite positive throughput.
4. **Next merge queue** — one row per near-term candidate: PR, lane, current evidence, remaining
   gate, and next action. `Ready` means the pre-merge gate can be run now, not merely that a label
   says ready.
5. **Current blockers** — the plain-English red classification described above. Separate a true
   release blocker from independent work that may continue.
6. **Orchestrator matrix** — every topic lane, its state, active items, last concrete progress,
   blocker, and next action. A session that is merely visible or polling is not `active`.
7. **Scope coverage** — open, owned, scheduled, and unscheduled issue counts. Every open issue must
   have exactly one owner and a delivery path; an empty `unscheduledIssueNumbers` is a gate.
8. **Environment hygiene** — last checked time plus Aspire applications, Docker containers, and
   custom networks. Unknown is reported as unknown, never zero.
9. **Owner decisions** — only genuinely owner-only decisions, each as one short concrete question
   with its blocked items and why coordinator authority is insufficient.

## ETA discipline

An ETA is a range with `confidence` (`high`, `medium`, or `low`) and a written basis. Derive it from
the ordered critical path, currently running gate durations, queue position, and known recovery
work. Do not subtract parallel work twice or assume a red rerun will pass. Reset the ETA immediately
when evidence changes and explain the delta in the next report.

Use `not scheduled` only when the checkpoint is genuinely not planned. A planned or qualifying
canary needs a non-empty critical path; a blocked canary names the blocking path rather than giving
an unqualified date.

## Pace and intervention

`lastConcreteProgressAt` means a commit, pushed head, PR transition, completed gate, evaluator
verdict, issue disposition, or growing deliverable artifact. Poll output and `standing by` are not
progress. If a lane has no concrete progress for 60 minutes and is not inside a named bounded
long-running gate, mark it `stalled`, inspect it, and submit a recovery action. If it is waiting on
a dependency, mark it `blocked` and dispatch any independent queued work in that lane.

The report must make throughput visible: merges and closures since the previous report, new intake,
open-queue counts, and why those counts changed. A growing PR list is acceptable only when the
report shows which scoped issues became delivery PRs and the coordinator continues consuming
exact-green packets.

## Machine-backed state

New milestone runs use cluster-state schema version 2 and populate `reporting`. The renderer turns
that object into the required report. The validator fails when:

- the latest report is more than the configured cadence behind `state.updatedAt`;
- the next due time exceeds the cadence;
- current-main identity is stale;
- open, owned, and scheduled scope counts disagree or unscheduled issues remain;
- the orchestrator matrix does not cover every topic lane exactly once;
- required ETA, merge-queue, blocker, environment, or owner-decision fields are malformed; or
- generated `milestone-status.md` is stale.

Schema version 1 remains readable for historical run recovery, but it does not satisfy the reporting
contract for a new milestone run.
