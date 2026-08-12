---
name: agent-milestone-orchestrator
description: The milestone-orchestrator role for NetScript releases — reading a milestone into PR-sized clusters of linked issues, sequencing them into dispatch waves, delegating one supervisor per PR, holding merge authority, and deciding when a release canary goes out. Use when orchestrating a release milestone end-to-end, planning waves, delegating per-PR supervisors, or deciding canary points. The run shape lives in .llm/harness/workflow/milestone-run.md; the canary schedule in workflow/canary-cadence.md; publish mechanics in netscript-release.
---

# Agent Milestone Orchestrator

The **role** of running a release milestone: one orchestrator, many delegated supervisors, waves
of PRs, canary points, a cut. This skill is the judgement half of epic #1120 — the decisions the
0.0.3 → 0.0.4 orchestration carried in one agent's head, written down so the next orchestrator
does not rediscover them. The **run** half — artifacts, stage contracts, gate lists, definition of
done — is [`workflow/milestone-run.md`](../../../.llm/harness/workflow/milestone-run.md); the
canary **schedule** is
[`workflow/canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md). Nothing in this
skill restates them, publish mechanics (`netscript-release`), or lane routing (`lane-policy.md`).

## When to Use

- Driving a release milestone from open issues to a landed cut.
- Clustering milestone issues into PRs and sequencing dispatch waves.
- Deciding when a canary goes out, and what merge order serves it.
- Supervising delegated per-PR supervisors and holding merge authority.

## When Not to Use

- A single scoped change — that is an ordinary `run-loop.md` run.
- Planning a board of epics/issues — that is `workflow/seed-run.md`.
- Publishing, verifying, or rolling back a release — `netscript-release`.
- Routing models/providers to lanes — `workflow/lane-policy.md`, never a table here.

## Evidence discipline

Rules below are **[observed]** — recorded during the 0.0.4 execution: in the instrumented trace
(`.llm/runs/release-0.0.4--orchestration/cut-trace.md`), in the issues that run filed (#1113,
#1115, …), in the epic's ratified learnings (#1120), or in the ratified design doc's dated
observations — with the source cited at the claim — or **[asserted]** — plausible and unproven. The distinction is load-bearing: 0.0.4 shipped two guards whose predicate could never
fire, and they looked correct while doing nothing. Treat asserted rules as candidates to attack;
when your run falsifies or confirms one, record it in the run's `cut-trace.md` so the marker can
be upgraded with a citation, not by fiat.

## Reading a milestone into PR clusters

**One supervisor per PR, each PR closing a group of linked issues [observed — cut-trace merge
table; #1120 learnings].** This avoids
micro-PRs, and avoids a supervisor blocked because closing its issue depends on another lane's
work. Cluster by shared surface and shared acceptance, then check the cluster both ways:

- **Too big:** a cluster whose issues span the release's most critical code is split even when the
  issues share a surface — 0.0.4 deliberately deferred #1013 behind #1075 to avoid a five-issue PR
  on the most critical code in the release **[observed]**.
- **Mislabelled:** read each issue's *acceptance*, not its labels — #1020 was labelled `type:docs`
  while its acceptance required framework code, which later put framework source on a docs-lane
  PR **[observed]**.
- **Unimplementable as scoped:** an issue whose acceptance boxes cannot all be truthfully ticked
  by one PR gets split or moved *before* dispatch, not discovered at merge time — #1024/#1061 had
  to be split out mid-flight when this was found late **[observed]**.

## Wave sequencing and dispatch

**Waves are small [observed — #1120 learnings].** A workflow blocks until every agent in it
completes, so a large fan-out stops the next block from starting — and it is what froze the host
at load 160 in 0.0.4.
Sequence so that each wave's PRs are independent of each other; dependencies run *across* waves,
not inside one.

The wave is a **dispatch** unit, nothing more. It is not a content contract — see
[`canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md) for why membership of a
canary is computed from merge history, never from the dispatch plan.

Before dispatching a wave, the preconditions in `milestone-run.md` stage B (provider quota,
paid-transport verification) must be green — the orchestrator's judgement call is *sequencing
around* a constrained provider, not dispatching into it. Quota exhaustion is a first-class
failure mode, not bad luck: the 0.0.4 docs lane hit a hard cap mid-delivery and correctly refused
to substitute another model silently **[observed — #1120 learnings; cut-trace failure table]**.
Recovery judgement: redeem the soonest-expiring reset, and treat the provider status panel as
stale afterwards — verify with a real call, not the display **[observed — design record]**.

## Re-planning is normal

Three re-planning events happened inside the one observed milestone — a queue-jump folded into an
open PR, a deliberate deferral, a mid-flight split — and none broke the wave structure
**[observed]** (the full stories live in `canary-cadence.md` § Flexibility). The operating rule:
**the plan is a dispatch schedule, merge history is the record.** Absorb priority shifts by
re-clustering the *undispatched* remainder; never rewrite the record of what already landed, and
never hold a blocking fix hostage to wave order — the queue-jump shipped ~1h after being filed
because it was allowed to jump.

Scope drift is a checkpoint, not a failure: 0.0.4 filed six defects from inside the run, two of
them blockers for the release's own purpose **[observed]**. When the definition of done moves,
move it explicitly (a recorded decision at the wave boundary), not silently.

## Delegation and effort tiering

Select every lane from [`lane-policy.md`](../../../.llm/harness/workflow/lane-policy.md) — this
skill holds no routing. The orchestrator's delegation judgement, beyond routing:

- **Brief the gate as a deliverable.** Supervisors go idle at a red gate rather than escalating —
  four occurrences in 0.0.4, plus three slices hard-stopped on an environmental block the brief
  could have pre-empted **[observed — design record; cut-trace failure table]**. The brief names
  the gates the supervisor must turn green and the known environmental hazards, up front.
- **Launch attached, never one-shot — and through the agentic suite.** An app-server-attached
  thread takes further turns via its `threadId`; an ad-hoc `codex exec` is one-shot and
  unreachable — an hour was lost to this **[observed — #1120 learnings]**. The launcher, watcher,
  and steering surfaces are mapped in `.llm/harness/workflow/tooling.md`, and the handoff
  protocol in `workflow/agent-handoff.md` — never ad-hoc shell.
- **Intercept between turns, not on git activity.** `codex-watch --mode turn` fires on
  `task_complete`, when the agent is idle between turns — that is the clean point to read, steer,
  or stop; git activity is not that signal **[observed — #1120 learnings]**.
- **Let phase automation own OpenHands [observed — #1120 learnings].** For PLAN-EVAL, add
  `openhands` and transition the draft PR to `status:plan-eval`. For IMPL-EVAL, choose at most one
  `eval:model:*` override while draft, then make the PR ready once; automation enters
  `status:impl-eval` and dispatches exactly once. Never also post `@openhands-agent` manually for
  that head. A deliberate rerun moves away from and back to the relevant eval status. Local native
  evaluator sessions remain available when the run explicitly selects the local transport.

## Merge authority

The orchestrator holds merge authority: a delegated supervisor lands a PR, but only the
orchestrator merges it, and only through the **pre-merge gate defined in `milestone-run.md`** —
run per PR, recorded per PR. Two judgement rules sit with the authority:

- **Never steer or merge from a truncated log [observed — design record].** A `head -14` excerpt
  said two issues were satisfied; the raw log showed zero implementation. Pull the full artifact
  before acting.
- **Merge order is a decision the canary consumes.** The orchestrator chooses what lands before
  each declared canary point; `canary-cadence.md` turns whatever actually landed into the payload.
  Choose merge order to make canary points meaningful; do not expect the cadence to repair an
  incoherent order.

## When a canary goes out

The orchestrator declares canary points **at wave boundaries** as part of the wave plan — the
boundary, membership, identity, and note rules are all owned by
[`canary-cadence.md`](../../../.llm/harness/workflow/canary-cadence.md). Two cadence questions are
**owner-undecided** (every-boundary vs surface-gated; whether a failed canary blocks the next
dispatch or only the cut — both **[asserted]** there): do not resolve them by habit inside a run;
raise them, or follow the run's recorded decision.

## Honesty rules

- **A criterion that cannot be truthfully ticked moves with its issue** to the next milestone —
  it is never ticked to clear a gate. Precedents and enforcement live in `milestone-run.md`
  § Gate integrity.
- **Observational criteria cannot be closed by a PR.** "A follow-up run shows…" routes to a
  verification issue in the next milestone (#1090 pattern) at the moment you notice it, not at
  cut time.
- **Record what the run falsifies.** The most valuable output of 0.0.4 was a rule the trace
  disproved before it shipped. An orchestrator who patches over a falsified assumption instead of
  recording it has destroyed the evidence the next milestone needed.

## Supervision pitfalls

- **Liveness is not progress, and artifacts are not always where you launched [observed — run
  record, #1115].** A research agent believed idle for 70 minutes was 25/27 complete, writing
  into per-sub-agent worktrees, and came within one command of being killed. Verify a growing
  artifact, a new commit, or a live session — not an open socket — and look across the repo root
  before judging.
- **Never establish ownership by string match [observed — design record].** An "is a turn live
  here" check matched worktree paths quoted inside *other agents' brief text*. Match the actual
  `--cwd` argument; inverted, this mistake deletes a live agent's worktree.
- **Verify the artefact, never the exit code [observed — design record].** Three agents claimed
  to have stopped their AppHost; all three process trees were still running, while the stop
  command exited 0.

## Reference files

| File | Load when |
| --- | --- |
| `.llm/harness/workflow/milestone-run.md` | every milestone run — the run shape, gates, DoD |
| `.llm/harness/workflow/canary-cadence.md` | declaring canary points; label/note/drift contract |
| `.llm/harness/workflow/lane-policy.md` | lane and evaluator routing |
| `.llm/harness/workflow/tooling.md` | the agentic launch/watch/steer tool surface for stage C |
| `.llm/harness/workflow/agent-handoff.md` | handing work to OpenHands or local agents mid-run |
| `.agents/skills/netscript-release` | any publish, verification, or rollback step |
| `.agents/skills/netscript-pr` | branch/PR/label/milestone mechanics, close-gate |
| `.agents/skills/netscript-harness` | general harness operating model |
| `.llm/runs/release-0.0.4--orchestration/cut-trace.md` | the observed evidence base |
