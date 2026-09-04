---
name: agent-milestone-orchestrator
description: The milestone-cluster role for NetScript releases — Step 0 scope intake and cleanup, dependency ordering, exactly four topic orchestrators (docs/internals/fixes/features), direct-to-main leaf PRs, bounded WIP, read-only watchers, merge coordination, meaningful canaries, and a singleton release captain. Use whenever landing a release milestone end-to-end or coordinating several issue groups toward a canary/stable cut. The run contract lives in .llm/harness/workflow/milestone-run.md; publication mechanics remain in netscript-release.
---

# Agent Milestone Cluster Orchestrator

The **role** of running a release milestone: one coordinator, exactly four topic orchestrators,
read-only watchers, direct-to-main leaf PRs, meaningful canary points, and one release captain. This
skill is the judgement half of epic #1120 — the decisions the 0.0.3 → 0.0.4 orchestration carried in
one agent's head, written down so the next orchestrator does not rediscover them. The **run** half —
artifacts, stage contracts, gate lists, definition of done — is
[`workflow/milestone-run.md`](../../../.llm/harness/workflow/milestone-run.md); the canary
**schedule** is [`workflow/canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md).
The recurring owner-facing status contract is
[`workflow/milestone-reporting.md`](../../../.llm/harness/workflow/milestone-reporting.md). Nothing
in this skill restates those contracts, publish mechanics (`netscript-release`), or lane routing
(`lane-policy.md`).

## When to Use

- Driving a release milestone from open issues to a landed cut.
- Sweeping adjacent issue pools for release-critical, prerequisite, or high-value coherent work.
- Clustering milestone issues into PRs and sequencing dispatch waves.
- Coordinating the docs, internals, fixes, and features topic lanes.
- Deciding when a canary goes out, what merge order serves it, and when the release captain may
  claim publication.

## When Not to Use

- A single scoped change — that is an ordinary `run-loop.md` run.
- A generic multi-group deliverable that needs one integration branch — use
  `workflow/supervisor.md`.
- Planning a board of epics/issues — that is `workflow/seed-run.md`.
- Publishing, verifying, or rolling back a release — `netscript-release`.
- Routing models/providers to lanes — `workflow/lane-policy.md`, never a table here.

## Evidence discipline

Rules below are **[observed]** — recorded during the 0.0.4 execution: in the
[archived instrumented trace](https://github.com/rickylabs/netscript/blob/d8187e5a8656de8f9443f4e33f0a91ece56a7dd2/.llm/runs/release-0.0.4--orchestration/cut-trace.md),
in the issues that run filed (#1113, #1115, …), in the epic's ratified learnings (#1120), or in the
ratified design doc's dated observations — with the source cited at the claim — or **[asserted]** —
plausible and unproven. The distinction is load-bearing: 0.0.4 shipped two guards whose predicate
could never fire, and they looked correct while doing nothing. Treat asserted rules as candidates to
attack; when your run falsifies or confirms one, record it in the run's `cut-trace.md` so the marker
can be upgraded with a citation, not by fiat.

## Step 0 judgement

Run the intake gate in `milestone-run.md` before creating topic workers. The intake agent reads the
target milestone, unmilestoned issues, Backlog, and later milestones at one main SHA. Labels are
leads, not evidence: acceptance, linked PRs, RFC dependencies, and current code decide admission.

Owner-ratified external work enters only as `release-critical`, `dependency-required`, or
`high-value-coherent`. **Admission includes performing the milestone move before scope freeze**;
recording an attractive issue without moving it is a failed Step 0. This prevents both failure
modes: missing blockers that appear mid-train, and opportunistic scope growth that displaces the
release's prerequisites. Clean fixed/duplicate/superseded work at the same checkpoint, assign every
active issue to one topic, then ratify and validate the DAG. No worker or evaluator launches while
the Step 0 validator is red.

## Four-topic cluster roles

- **Coordinator:** owns intake, DAG order, exclusive issue allocation, WIP, merge decisions,
  re-intake, canary checkpoints, and release-captain activation.
- **Topic orchestrators:** exactly `docs`, `internals`, `fixes`, `features`. Each owns only its
  allocated issues, delegates coherent leaves, and reviews progress. They do not publish.
- **Leaf supervisors:** one per direct-to-`main` PR, following `run-loop.md` and the evaluator
  lifecycle. A leaf is a connected issue group, not an arbitrary batch.
- **Watchers:** event-driven and read-only. They notify the coordinator about stale/blocked work;
  `mutationAuthority` remains false.
- **Release captain:** inactive until the exact-main readiness gate passes, then the only agent with
  a writer lease. Publication completion includes artifact-pinned production E2E.

Treat `milestone-cluster-state.json` as the control plane and `milestone-status.md` as its generated
view. Do not coordinate from chat memory or a hand-edited status page.

## Coordinator reporting and pace

Publish the generated coordinator report at the hourly and event-driven cadence in
`milestone-reporting.md`. The required shape is deliberately operational: outcome, canary ETA and
critical path, progress delta, merge queue, plain-English blockers, orchestrator matrix, scope
coverage, environment hygiene, and only genuine owner decisions. Refresh the evidence first.

A report is also an intervention gate. An orchestrator row with stale concrete progress, vague
`waiting`, or no next action must cause immediate steering or recovery; it cannot be rendered as
healthy merely because a session exists. Reporting never ends the coordinator turn and never blocks
independent lanes. After publishing, keep merging, dispatching, and unblocking.

## Reading a milestone into PR clusters

**One leaf supervisor per PR, each PR targeting `main` and closing a group of linked issues
[observed — cut-trace merge table; #1120 learnings].** This avoids micro-PRs, and avoids a
supervisor blocked because closing its issue depends on another lane's work. Cluster by shared
surface and shared acceptance, then check the cluster both ways:

- **Too big:** a cluster whose issues span the release's most critical code is split even when the
  issues share a surface — 0.0.4 deliberately deferred #1013 behind #1075 to avoid a five-issue PR
  on the most critical code in the release **[observed]**.
- **Mislabelled:** read each issue's _acceptance_, not its labels — #1020 was labelled `type:docs`
  while its acceptance required framework code, which later put framework source on a docs-lane PR
  **[observed]**.
- **Unimplementable as scoped:** an issue whose acceptance boxes cannot all be truthfully ticked by
  one PR gets split or moved _before_ dispatch, not discovered at merge time — #1024/#1061 had to be
  split out mid-flight when this was found late **[observed]**.

## Wave sequencing and dispatch

**Waves are small [observed — #1120 learnings].** A workflow blocks until every agent in it
completes, so a large fan-out stops the next block from starting — and it is what froze the host at
load 160 in 0.0.4. Sequence so that each wave's PRs are independent of each other; validated DAG
dependencies run _across_ waves, not inside one. Keep at most two implementation leaves and one
evaluator active per topic, and serialize global expensive gates.

The wave is a **dispatch** unit, nothing more. It is not a content contract — see
[`canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md) for why membership of a
canary is computed from merge history, never from the dispatch plan.

Before dispatching a wave, the preconditions in `milestone-run.md` stage B (provider quota,
paid-transport verification) must be green — the orchestrator's judgement call is _sequencing
around_ a constrained provider, not dispatching into it. Quota exhaustion is a first-class failure
mode, not bad luck: the 0.0.4 docs lane hit a hard cap mid-delivery and correctly refused to
substitute another model silently **[observed — #1120 learnings; cut-trace failure table]**.
Recovery judgement: redeem the soonest-expiring reset, and treat the provider status panel as stale
afterwards — verify with a real call, not the display **[observed — design record]**.

## Re-planning is normal

Three re-planning events happened inside the one observed milestone — a queue-jump folded into an
open PR, a deliberate deferral, a mid-flight split — and none broke the wave structure
**[observed]** (the full stories live in `canary-cadence.md` § Flexibility). The operating rule:
**the plan is a dispatch schedule, merge history is the record.** Absorb priority shifts by
re-clustering the _undispatched_ remainder; never rewrite the record of what already landed, and
never hold a blocking fix hostage to wave order — the queue-jump shipped ~1h after being filed
because it was allowed to jump.

Scope drift is a checkpoint, not a failure: 0.0.4 filed six defects from inside the run, two of them
blockers for the release's own purpose **[observed]**. When the definition of done moves, move it
explicitly (a recorded decision at the wave boundary), not silently.

## Delegation and effort tiering

Select every lane from [`lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md) — this
skill holds no routing. The orchestrator's delegation judgement, beyond routing:

- **Brief the gate as a deliverable.** Supervisors go idle at a red gate rather than escalating —
  four occurrences in 0.0.4, plus three slices hard-stopped on an environmental block the brief
  could have pre-empted **[observed — design record; cut-trace failure table]**. The brief names the
  gates the supervisor must turn green and the known environmental hazards, up front.
- **Launch attached, never one-shot — and through the agentic suite.** An app-server-attached thread
  takes further turns via its `threadId`; an ad-hoc `codex exec` is one-shot and unreachable — an
  hour was lost to this **[observed — #1120 learnings]**. The launcher, watcher, and steering
  surfaces are mapped in `.llm/harness/workflow/tooling.md`, and the handoff protocol in
  `workflow/agent-handoff.md` — never ad-hoc shell.
- **Intercept between turns, not on git activity.** `codex-watch --mode turn` fires on
  `task_complete`, when the agent is idle between turns — that is the clean point to read, steer, or
  stop; git activity is not that signal **[observed — #1120 learnings]**.
- **Let phase automation own OpenHands [observed — #1120 learnings].** For PLAN-EVAL, add
  `openhands` and transition the draft PR to `status:plan-eval`. For IMPL-EVAL, choose at most one
  `eval:model:*` override while draft, add `openhands`, then make the PR ready once; automation
  enters `status:impl-eval` and dispatches exactly once. Never also post `@openhands-agent` manually
  for that head. Readiness without `openhands` never spends. A deliberate rerun moves away from and
  back to the relevant eval status while `openhands` remains present. OpenHands is an explicit
  fallback for cloud lanes or machines without the full local CLI swarm; native evaluator sessions
  remain the default when the local matrix can run them.

## Merge authority

The coordinator holds merge authority: a delegated topic/leaf supervisor lands a PR, but only the
coordinator merges it, and only through the **pre-merge gate defined in `milestone-run.md`** — run
per PR, recorded per PR. Two judgement rules sit with the authority:

- **Never steer or merge from a truncated log [observed — design record].** A `head -14` excerpt
  said two issues were satisfied; the raw log showed zero implementation. Pull the full artifact
  before acting.
- **Merge order is a decision the canary consumes.** The orchestrator chooses what lands before each
  declared canary point; `canary-cadence.md` turns whatever actually landed into the payload. Choose
  merge order to make canary points meaningful; do not expect the cadence to repair an incoherent
  order.

## When a canary goes out

The coordinator declares canary points at **meaningful wave checkpoints**, never per leaf, as part
of the wave plan — the boundary, membership, identity, and note rules are all owned by
[`canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md). Two cadence questions are
**owner-undecided** (every-boundary vs surface-gated; whether a failed canary blocks the next
dispatch or only the cut — both **[asserted]** there): do not resolve them by habit inside a run;
raise them, or follow the run's recorded decision.

## Honesty rules

- **A criterion that cannot be truthfully ticked moves with its issue** to the next milestone — it
  is never ticked to clear a gate. Precedents and enforcement live in `milestone-run.md` § Gate
  integrity.
- **Observational criteria cannot be closed by a PR.** "A follow-up run shows…" routes to a
  verification issue in the next milestone (#1090 pattern) at the moment you notice it, not at cut
  time.
- **Record what the run falsifies.** The most valuable output of 0.0.4 was a rule the trace
  disproved before it shipped. An orchestrator who patches over a falsified assumption instead of
  recording it has destroyed the evidence the next milestone needed.

## Supervision pitfalls

- **Liveness is not progress, and artifacts are not always where you launched [observed — run
  record, #1115].** A research agent believed idle for 70 minutes was 25/27 complete, writing into
  per-sub-agent worktrees, and came within one command of being killed. Verify a growing artifact, a
  new commit, or a live session — not an open socket — and look across the repo root before judging.
- **Never establish ownership by string match [observed — design record].** An "is a turn live here"
  check matched worktree paths quoted inside _other agents' brief text_. Match the actual `--cwd`
  argument; inverted, this mistake deletes a live agent's worktree.
- **Verify the artefact, never the exit code [observed — design record].** Three agents claimed to
  have stopped their AppHost; all three process trees were still running, while the stop command
  exited 0.

## Reference files

| File                                                                                                                                                                 | Load when                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `.llm/harness/workflow/milestone-run.md`                                                                                                                             | every milestone run — the run shape, gates, DoD         |
| `.llm/harness/workflow/canary-cadence.md`                                                                                                                            | declaring canary points; label/note/drift contract      |
| `.llm/harness/workflow/milestone-reporting.md`                                                                                                                       | hourly/event-driven owner report and pace gate          |
| `.llm/harness/workflow/lane-policy.md`                                                                                                                               | lane and evaluator routing                              |
| `.llm/harness/workflow/tooling.md`                                                                                                                                   | the agentic launch/watch/steer tool surface for stage C |
| `.llm/harness/workflow/agent-handoff.md`                                                                                                                             | handing work to OpenHands or local agents mid-run       |
| `.agents/skills/netscript-release`                                                                                                                                   | any publish, verification, or rollback step             |
| `.agents/skills/netscript-pr`                                                                                                                                        | branch/PR/label/milestone mechanics, close-gate         |
| `.agents/skills/netscript-harness`                                                                                                                                   | general harness operating model                         |
| [Archived 0.0.4 cut trace](https://github.com/rickylabs/netscript/blob/d8187e5a8656de8f9443f4e33f0a91ece56a7dd2/.llm/runs/release-0.0.4--orchestration/cut-trace.md) | the observed evidence base                              |
