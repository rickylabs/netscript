# Milestone Cluster — Orchestrating a Release Milestone

Operating profile for **milestone-cluster runs** — four topic orchestrators (`docs`, `internals`,
`fixes`, `features`) coordinated from intake to a landed cut. Each topic owns an exclusive issue set
and delegates coherent PR-sized leaves directly against `main`; read-only watchers report liveness,
one coordinator controls cross-topic ordering and merges, and one release captain owns publication.
This document is the **run**: what a milestone run produces and proves. The judgement — how to
cluster, sequence, delegate, and decide — is the `agent-milestone-orchestrator` skill (the
**role**); the canary schedule is [`canary-cadence.md`](./canary-cadence.md). A paragraph lives in
exactly one of the three and is referenced from the others.

> **Provenance.** Derived from `release-0.0.4--orchestration`, the first real execution of the
> milestone-orchestrator pattern (epic #1120, decision D2), whose instrumented merge record is
> [`cut-trace.md`](../../runs/release-0.0.4--orchestration/cut-trace.md) — 11 PRs, 42 issues, ~6h40m
> on 2026-08-03. Rules below are **[observed]** — recorded during that execution, in the trace
> itself, in the issues the run filed, or in the ratified design doc's dated observations, with the
> source cited at the claim — or **[asserted]** (proposed, unproven). Like `seed-run.md` and
> `supervisor.md`, this freezes the **stage contracts**, not the exemplar's exact folder tree.

## When to use a milestone cluster

Use it when the deliverable is a **landed milestone**: many issues closing through multiple PRs
authored by delegated supervisors, with canaries and (usually) a stable cut. Do not use it for a
single scoped change (`run-loop.md`) or for planning a board (`seed-run.md`). If the deliverable is
_code for one change_, run-loop; if it is _issues_, seed; if it is _a milestone landed_, this.

General harness mechanics — run activation, artifact discipline, the commit trail, evaluator
separation — are owned by `.agents/skills/netscript-harness` and `run-loop.md` and are not restated
here. This profile adds only what is specific to a milestone run.

This profile is **not** the generic multi-group supervisor profile. Milestone leaves target `main`
and are independently mergeable; they do not stack onto one integration branch. Use `supervisor.md`
only for a single deliverable whose phase groups must integrate before reaching its base branch.

## Run layout

- **Run dir** `.llm/runs/release-<version>--orchestration/` with the standard mandatory artifacts
  (`supervisor.md` first, then `plan.md` as the wave plan, `worklog.md`, `context-pack.md`,
  `drift.md`), plus:
- **`milestone-intake.json`** — the complete Step 0 sweep and owner-ratified admission record.
- **`milestone-inventory.json`** — the frozen target milestone and one disposition per issue.
- **`milestone-dependency-dag.json`** — RFC prerequisites and cross-epic ordering in topological
  waves.
- **`milestone-cluster-state.json`** — the single mutable control plane for lane ownership, leaf
  lifecycle, WIP, watchers, checkpoints, and release captain.
- **`milestone-status.md`** — generated from cluster state; never edited by hand.
- **`receipts/`** — durable references to gate evidence; raw domain reports remain in their native
  tools and are linked rather than copied.
- **`cut-trace.md`** — the instrumented merge record, captured **during the run from
  `git log origin/main`**, never reconstructed from recollection **[observed]**. It records every
  merge in order (time, commit, PR, closed issues), the wave clustering, re-planning events, and the
  failure modes that cost real time. It is the evidence base future cadence rules are earned from —
  the 0.0.4 trace is the reason this profile exists — and it is what canary payload audits are
  checked against.
- The milestone's _content_ lands through the delegated PRs, not the orchestrator's branch; the
  orchestrator's own commits are run artifacts and any doctrine promoted at close.

Create the five milestone artifacts from `templates/`, then run:

```text
deno task harness:milestone:render -- <run-dir>
deno task harness:milestone:validate -- <run-dir>
```

The validator is the dispatch gate. A missing, stale, or invalid artifact is a red gate, not an
informational warning.

## Step 0 — intake, cleanup, and scope freeze

Step 0 is performed by the coordinator (or one explicitly delegated intake agent) **before any
implementer or evaluator starts**:

1. Snapshot the target milestone, unmilestoned issues, Backlog, and later milestones at one
   `baselineMainSha`. Read acceptance and evidence, not labels alone.
2. Record every considered candidate in `milestone-intake.json`. An external candidate may enter
   only with owner ratification and one evidenced admission predicate: `release-critical`
   (P0/security/regression/release blocker), `dependency-required` (an accepted RFC or cross-epic
   prerequisite), or `high-value-coherent` (complete P1/feature scope that serves the release
   without displacing a critical prerequisite).
3. **Move every approved external candidate into the target milestone before freezing scope.** The
   intake records `targetMilestone` and `movedAt`; an approval without the actual move fails the
   gate. This is the mandatory opportunity to drag critical issues and worthwhile coherent features
   into the release rather than discovering them mid-train.
4. Inventory every resulting target-milestone issue with exactly one disposition: `active`, `move`,
   `close-fixed`, `close-duplicate`, or `close-superseded`. Moves/closes need written GitHub reason
   and evidence. Every active issue gets exactly one topic lane.
5. Build the dependency DAG. Each active issue appears once; every `requires`, `rfc-prerequisite`,
   and `cross-epic-order` edge points from an earlier wave to a later one.
6. Obtain owner ratification of intake and inventory, render status, and run
   `harness:milestone:validate`. Do not dispatch until it passes.

Scope may change after freeze only as an explicit re-intake checkpoint: append the new candidate
decision, perform the GitHub move, update inventory/DAG/state at current `main`, re-ratify, and
re-run the gate. Silent additions are forbidden.

## Cluster control plane

- Exactly four topic orchestrators exist: `docs`, `internals`, `fixes`, and `features`. Their issue
  sets are exclusive and equal the active frozen inventory.
- A topic orchestrator may create leaf PRs and supervise its issue set but cannot merge or publish.
  Each leaf targets `main`, owns a coherent connected issue group, and follows `run-loop.md`.
- WIP is bounded to two active implementation leaves and one evaluator per topic, with one global
  expensive gate. This preserves parallelism without reproducing contention failures.
- Watchers are event-driven and read-only (`mutationAuthority: false`). They report stale or blocked
  work to the coordinator; they never steer, merge, or mutate cluster state themselves.
- The coordinator owns scheduling, dependency release, merge authority, re-intake, and activation of
  the release captain. `milestone-cluster-state.json` is the only mutable source; regenerate
  `milestone-status.md` after every transition.
- The release captain remains inactive until every committed issue is closed or moved with reason,
  every leaf is terminal, exact-current-`main` evidence is sufficient and green, and no existing
  release lease is present. One agent then owns one writer lease for that content SHA. Topic agents
  and watchers never publish.

## Stage contracts

Lane assignments are configuration — bindings live only in [`lane-policy.md`](./lane-policy.md).

| Stage                     | Contract (produce → proof)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **0 — Intake gate**       | intake sweep + actual GitHub moves + cleaned inventory + dependency DAG + owner ratification → `harness:milestone:validate` passes before any worker/evaluator dispatch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **A — Cluster bootstrap** | `supervisor.md` + exactly four topic orchestrators + read-only watchers + single coordinator recorded in cluster state → rendered status is current                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **B — Wave plan**         | `plan.md`: coherent direct-to-`main` leaf clusters, topological sequence, meaningful canary checkpoints (per [`canary-cadence.md`](./canary-cadence.md)), and **dispatch preconditions checked: provider quota and paid-transport verification** — both became gates by costing real time in 0.0.4 (a hard stop on an exhausted quota; $7.43 billed to the wrong transport — `cut-trace.md` failure table) **[observed]**. These are procedural gates: the proof is the **recorded check output** (what was queried, when, result) in `worklog.md` before dispatch — a wave dispatched without that record is a did-not-run of the gate, visible as the record's absence |
| **C — Wave dispatch**     | topic orchestrators delegate one supervisor per PR cluster, launched attached through the agentic suite ([`tooling.md`](./tooling.md) maps the launcher/watcher/steering surfaces; [`agent-handoff.md`](./agent-handoff.md) owns the handoff protocol; the skill owns the judgement) → immutable leaf identity recorded (thread id, worktree, PR, head)                                                                                                                                                                                                                                                                                                                  |
| **D — Wave landing**      | every PR in the wave merged through the **pre-merge gate** below → per-PR gate record in `worklog.md`, merge appended to `cut-trace.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **E — Canary point**      | at the wave boundary: canary publish per `netscript-release`, then label + note + drift verdict per [`canary-cadence.md`](./canary-cadence.md) → the tool's explicit check records quoted in `worklog.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **C–E repeat**            | per wave, absorbing re-planning (`cut-trace.md` records what actually happened, the plan records what was intended — both are kept, neither is rewritten)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **F — Cut**               | cut-time checklist below, then the stable cut per `netscript-release` (its completion gate is owned there, not here) → checklist evidence in `worklog.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **G — Close**             | milestone bookkeeping, observational criteria routed to verification issues (#1090 pattern), lessons promoted per `netscript-harness` § Where Lessons Belong → closing `context-pack.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

**PLAN-EVAL of the wave plan [asserted]:** 0.0.4 ran without one — the pattern lived in one agent's
head, which is the gap #1120 closes. Until a trace shows otherwise, apply the standard harness rule
(a committed plan gets a separate-session PLAN-EVAL) rather than treating the wave plan as exempt;
record the choice in `supervisor.md` either way.

## The pre-merge gate **[observed]**

The empirical checklist the 0.0.4 orchestrator converged on, run per PR at stage D. Each row cites
what earned it a place — for most, a real firing; where the record shows something narrower, the row
says exactly what is and is not yet demonstrated. Items 6 and 7 were added _after_ being burned:

| # | Check                                                                                                | Firing evidence (the negative case)                                                                                                                                                                                                                                                                                                                                                                        | When it does not run                                                              |
| - | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1 | `close-gate` result is green                                                                         | red close-gates idled four supervisors in 0.0.4                                                                                                                                                                                                                                                                                                                                                            | a PR with no close-gate result is **unproven, not clean** — the result must exist |
| 2 | zero unticked `- [ ]` on every issue the PR closes                                                   | 15 unchecked boxes across #1078's issues forced the mid-flight split of #1024/#1061                                                                                                                                                                                                                                                                                                                        | an unfetched issue body counts as unticked                                        |
| 3 | no new `deno-lint-ignore` / `as unknown as` / `@ts-ignore` in the diff, **excluding `.llm/runs/**`** | two-part record: the exclusion fired in 0.0.4 (false positives from run artifacts and the scanner's own source), and the predicate itself is demonstrated on a synthetic diff — RED on a new ignore in publishable source, GREEN on excluded-path quotes (`release-0.0.4` follow-up demo: `.llm/runs/feat-milestone-orchestrator-artifacts--authoring/gate-demos.md` § Demo 1; #745 is the incident class) | a diff not scanned is a missing verdict, not a pass                               |
| 4 | named expensive gates report `SUCCESS`, not `SKIPPED`/`CANCELLED`                                    | #778/#775 looked mergeable with every substantive check skipped, on a base dead since 17 July — **"clean" repeatedly meant "nothing ran"**                                                                                                                                                                                                                                                                 | this check _is_ the did-not-run detector; name the gates, don't count greens      |
| 5 | the single decisive claim per issue, re-verified independently                                       | a `head -14` truncated log nearly auto-closed two issues with zero implementation; the raw log caught it                                                                                                                                                                                                                                                                                                   | an unverified claim stays a claim — record it as unverified                       |
| 6 | changed-file audit for `packages/**`/`plugins/**` on docs-lane PRs                                   | #1079: a docs slice landed framework source (upstream cause: #1020 labelled `type:docs` with code acceptance)                                                                                                                                                                                                                                                                                              | an unaudited docs PR is unaudited — say so in the gate record                     |
| 7 | the PR body's own checklist matches what shipped                                                     | #1088 merged asserting "implementation hard stop in force" while shipping the change (filed as #1105); `close-gate` validates _issue_ boxes, not _PR-body_ checklists                                                                                                                                                                                                                                      | not covered by close-gate — skipping this leaves the PR body unverified           |

## Gate integrity rules

These govern every gate this profile names and every gate a milestone run adds:

- **Proof of firing.** A gate enters this profile (or a run) only with its negative case
  demonstrated. The 0.0.4 run shipped two guards whose predicate could never be true — a watcher
  requiring non-draft when every PR was a draft, and an `origin/main..HEAD` ancestry check that is
  wrong under squash-merge because merged commits are never ancestors. Both did nothing and looked
  correct **[observed]**. That defect class (also #1022, #1012) is the signature failure of this
  kind of work. Corollary: **"is it merged" uses PR state, never commit ancestry.**
- **Pass is distinguishable from did-not-run.** Each gate states what it reports when it does not
  execute (see the table's last column). Absence of red is not green; silence is a failure.
- **The false-red trap (#1142).** `classify changes` corrupts `$GITHUB_OUTPUT` post-merge, so a
  merged PR's `statusCheckRollup` contains superseded red runs. Merge-history audits must compare
  check-run timestamps to the merge time and take **only the latest run per check name** — an audit
  that sums all runs manufactures false reds, the mirror image of check 4's false greens. The defect
  is observed (#1142), and both clauses of the rule are **demonstrated on live data**: merged PR
  #1155's rollup carries a post-merge `classify changes` FAILURE (+28s after merge) and a superseded
  pre-merge CANCELLED; applying the rule recovers the true pre-merge SUCCESS
  (`.llm/runs/feat-milestone-orchestrator-artifacts--authoring/gate-demos.md` § Demo 2).
- **Expensive gates are serialised across slices.** Three concurrent `scaffold.runtime` runs
  produced two failures that were contention, not defects **[observed]**.
- **The honesty rule.** A criterion that cannot be truthfully ticked **moves with its issue to the
  next milestone**; it is never ticked to clear a gate. Precedents: PR #1092 carried `Refs #1024` /
  `Closes #1061` when only #1061 was done; PR #1146 downgraded #1101 to `Refs` and moved it.
  Observational criteria ("a follow-up run shows…") cannot be closed by any PR — route them to a
  verification issue in the next milestone (#1090 pattern).

## Cut-time checklist **[observed]**

Run at stage F, before the stable cut. Each item is something 0.0.4 missed or nearly missed:

1. **Breaking changes surfaced from closed issues reach the notes.** The #1083 class: a closed issue
   whose deliverable _is_ a release note is invisible at cut time unless carried forward. The canary
   notes record each payload as it lands ([`canary-cadence.md`](./canary-cadence.md)); at the cut,
   read them while composing the stable intro and verify nothing of this class was dropped — today a
   manual read-through, since no mechanism feeds canary notes into the stable note.
2. **Issues moved out of the milestone are reflected in the notes**, each with its written reason —
   0.0.4 moved six issues and two PRs, all reasoned on the issue.
3. **Scope drift is an explicit checkpoint, not a discovery.** 0.0.4 began at 31 items and filed six
   defects from inside the run, two of them p0/p1 for the release's own purpose. The definition of
   done moved during the run — correctly — and the cut records that decision.

## Evaluator protocol for a milestone run

Per-PR evaluation composes what already triggers rather than spawning duplicate evaluators
**[observed — #1120 learnings]**: `openhands` + `status:plan-eval` dispatches PLAN-EVAL and
draft→ready dispatches IMPL-EVAL. The orchestrator selects an optional `eval:model:*` override
before the transition, then watches the automatic run; it does not also comment-trigger OpenHands.
The invariants that hold regardless (owned by `netscript-harness`/`lane-policy.md`, only their
milestone-run application stated here):

- **Generator ≠ evaluator, and the supervisor is not the evaluator either** — #1113 was written by
  one family, supervised by a second, evaluated by a third before merge **[observed — run record,
  #1113]**.
- **Reviewer substitution is a legitimate waiver [observed — design record, 2026-08-03]**: when the
  owner reviews a slice directly, no-lane-self-certifies is satisfied — a substitution of reviewer,
  not an absence of review — recorded in `drift.md`, never silently applied. Scope it by what the
  review last caught: **keep opposite-family review for code; it may be dropped for run artifacts
  and evidence prose.** The opposite-family pass earned its cost by finding non-failing inline `jq`
  substitutions — a check that could not fail — in a tool whose purpose is proving gates fire.
  Automated gates are unchanged by any waiver: they are evidence, not sign-off.

## Definition of done

A milestone run is done when all of the following hold, with evidence in the run dir:

- Every milestone issue is **closed with verified acceptance** (pre-merge gate, check 1–2) or
  **moved with a written reason** on the issue.
- Every declared canary point has its published version labelled and noted, with the drift gate's
  explicit check records quoted — a red or `not run` record is a finding to record, not a nuisance
  to hand-patch.
- The stable cut is complete per `netscript-release`'s hard completion gate (owned there).
- `cut-trace.md` records the actual merge order, re-planning events, and time-costing failures — the
  next milestone's rules are earned from it.
- Observational criteria are routed to verification issues in the next milestone (#1090 pattern).
- The cut-time checklist and scope-drift checkpoint are recorded in `worklog.md`.
- Cluster state has one completed release captain with publication and artifact-pinned production
  E2E evidence for the exact content SHA; generated status is current.

## What varies per run (do not cargo-cult)

Wave count and width, canary count (the trace shows ~three boundaries per milestone, not a quota),
whether the run ends in a stable cut or hands one off, lane bindings, and whether
`phase-registry.md` is needed. What does not vary: the stage contracts, the pre-merge gate, the gate
integrity rules, and the honesty rule.

## Checklist

- [ ] Deliverable is a landed milestone, not one change (run-loop) or a board (seed-run).
- [ ] Step 0 swept all four sources, moved approved critical/high-value candidates, cleaned stale
      scope, froze owner-ratified inventory, and validated an acyclic dependency DAG.
- [ ] `supervisor.md` written at stage A; four topic orchestrators, watchers, coordinator, and WIP
      limits recorded in cluster state.
- [ ] Wave plan committed with declared canary points; quota + transport verified before dispatch.
- [ ] PLAN-EVAL decision for the wave plan recorded in `supervisor.md`.
- [ ] Every merge passed the pre-merge gate with a per-PR record; `cut-trace.md` kept live.
- [ ] Every canary point labelled + noted with explicit check records quoted.
- [ ] No criterion ticked that was not truthfully done; movers carry written reasons.
- [ ] Cut-time checklist recorded before the stable cut.
- [ ] Observational criteria routed (#1090); lessons promoted; closing `context-pack.md` written.
- [ ] One release captain completed the exact-main stable release and artifact-pinned production
      E2E; generated milestone status is current.
