# Rolling Canary Cadence

The **schedule** contract of epic #1120: *when* a release canary goes out, *what* it contains, and
*where* anyone can see that in GitHub. It is one of three artifacts with a deliberate division of
labour — the `agent-milestone-orchestrator` skill is the **role** (who decides), the
[`milestone-run.md`](./milestone-run.md) profile is the **run** (what a milestone run must prove),
and this document is the **schedule**. A paragraph that would appear in two of them lives in one
and is referenced from the others.

What this document does **not** own:

- **Publish mechanics.** How to publish a canary safely — `release:canary`, `publish:readiness`,
  `release:preflight`, OIDC, the mandatory green canary pair, same-semver republish, rollback — is
  owned entirely by `.agents/skills/netscript-release`. This document says when a canary point
  occurs; that skill says how the publish at that point is executed.
- **The label/note mechanism.** Label derivation, payload computation, note rendering, and drift
  checking are implemented once in `.llm/tools/release/canary-label.ts`
  (`deno task release:canary-label`, shipped by #1121/#1122). This document states the contract
  that tool enforces; it does not restate the implementation.

**Disambiguation (#1119):** in this document "canary" always means a **release canary** — a JSR
prerelease of the workspace. The `agentic:provider-canary` / `agentic:rollout-canary` tasks are AI
provider/model rollout canaries and are unrelated; do not route release-cadence work through them,
and do not cite this document for them. The rename that resolves the collision is tracked as #1119
and is not attempted here.

## Evidence base

Every rule below is marked **[observed]** — derived from the instrumented 0.0.4 merge trace,
[`.llm/runs/release-0.0.4--orchestration/cut-trace.md`](../../runs/release-0.0.4--orchestration/cut-trace.md)
(11 PRs, 42 issues, 2026-08-03) — or **[asserted]** — a reasoned proposal with no supporting
observation yet. Asserted rules are the ones most likely to be wrong; attack them rather than
absorb them. Do not promote an assertion into an earned rule when citing this document.

## Trigger: the wave boundary **[observed]**

Merge times in the 0.0.4 trace self-cluster into three groups — 21 min, 42 min, 2h01m — and the
clusters *are* the orchestrator's dispatch waves. No new vocabulary is needed: **the canary
boundary is the wave boundary**, the point at which a dispatched group of supervisors has all
landed. The orchestrator declares that point as part of the wave plan (see the skill); this
document defines what the declaration means.

## Membership: content-derived, not plan-derived **[observed]**

This is the rule the trace *falsified* before it could be shipped, and the single most important
constraint on the cadence:

PR #1086 was not part of wave 2. It was dispatched mid-wave because #1089 blocked the owner's
docs-audit lane, and it merged **between two wave-2 PRs**. A cadence defining a canary as "the PRs
dispatched in wave N" would have mislabelled it.

Membership is therefore **what actually landed between the previous canary point and this one**,
computed from first-parent merge history. A PR that landed out of plan order is still in the
payload. The wave is a *dispatch* unit; the canary is a *content* unit; they usually coincide and
must never be assumed to. `release:canary-label` computes the payload exactly this way — from
merge history, never from a dispatch plan.

## Identity: the label is the published version (D3)

The GitHub label **is** the published prerelease version string:
`canary:<version>-canary.<n>` — e.g. `canary:0.0.5-canary.1`. The label is applied to every PR in
the payload and to the issues those PRs closed, so anyone can see which canary an issue or PR
shipped in without leaving GitHub.

Identity rules, all enforced by the tool rather than by convention:

- **The label is derived from what was actually published, never typed by hand.** After the canary
  publish (dispatched per `netscript-release`), run:

  ```bash
  deno task release:canary-label -- --published-version <x.y.z-canary.n>
  ```

  The tool refuses a version that JSR does not report as published, so a label for an unpublished
  version is impossible by construction.

- **The source of truth is the publish result, not the repo version field [observed].** At the
  time this cadence was designed, `deno.json` read `0.0.3` while the canary train was
  `0.0.4-canary.N` — `release:canary` takes a *stable target* and derives the prerelease from it.
  A generator reading the repo's `version` field would have emitted `canary:0.0.3-canary.1`,
  silently wrong in precisely the way D3 exists to prevent.

## The canary note

A canary version string alone answers *that* something shipped, never *what*. Each canary point
therefore publishes a GitHub release note, and **the payload is the note**: the same merge-history
derivation that selects the labelled PRs renders the note's content. One derivation, two views —
this is why the note lives in the same tool invocation as the label, and why a second rendering
path must never be added (two paths to the same fact is how a label and a note drift apart).

Contract (enforced by the tool):

- The note is a **GitHub release on the existing `v<version>` tag, marked prerelease**. A canary
  never takes `Latest` — that belongs to stable.
- Re-running is **idempotent**: an existing canary release is updated, not duplicated or failed.
- An empty payload (nothing merged since the previous canary point) produces an **explicit
  empty-payload note**, not a silent success and not a crash.
- Publishing a note for a never-published version **fails**, under the same identity constraint as
  the label.

**Consequence for the cut:** canary notes accumulate into the stable release note. The #1083
class — a closed issue whose deliverable *is* a release note and which is therefore invisible at
cut time — is satisfied continuously at each canary point rather than reconstructed at the cut,
which is exactly where it was historically dropped. The cut-time checklist in
[`milestone-run.md`](./milestone-run.md) verifies the accumulation; this document defines it.

## The drift gate

`release:canary-label` ends every run with a drift check comparing, in both directions, the
repo's `canary:*` labels against the canary versions actually published: a label with no published
version, or a published canary with no label, fails the gate.

Gate integrity, per the #1120 proof-of-firing bar:

- **Firing demonstrated, negative case shown.** #1121's acceptance recorded the drift gate failing
  on a fabricated mismatch before it was trusted — the negative case is on the record, not
  presumed.
- **Pass is distinguishable from did-not-run.** The tool allocates all five named checks
  (`published-version`, `merge-history-payload`, `label-application`,
  `release-note-publication`, `drift`) up front as `not run` and reports each explicitly, so a
  crash mid-way leaves visible `not run` records instead of silence. Silence is a failure, not a
  pass.
- **Known limitation:** the drift check is not yet target-scoped, so historical canaries from
  earlier trains report as missing labels (#1160). Treat that as the tracked defect it is — do not
  hand-patch labels to green the gate, and do not widen the gate's tolerance to silence it.

## Flexibility: what the cadence must absorb **[observed]**

Three re-planning events happened inside the single observed milestone, none of which broke the
wave structure:

- **#1089 jumped the entire queue** — folded into an already-open PR (#1086) because it blocked an
  external lane; shipped ~1h after being filed.
- **#1013 was deliberately deferred** behind #1075 despite sharing a surface, to avoid a
  five-issue PR on the release's most critical code.
- **#1024/#1061 were split out of #1078 mid-flight** when close-gate revealed 15 unchecked boxes
  across issues with no implementation.

A cadence that treats the *plan* as the contract breaks on all three. This one treats **merge
history** as the contract and absorbs all three without special handling — which is the reason the
membership rule above is load-bearing and not a stylistic preference.

## Open questions — owner-undecided **[asserted]**

Neither of these is settled. An orchestrator must not treat either answer as a rule:

1. **Does a canary publish at every wave boundary, or only at boundaries crossing a
   public-surface change?** Asserted preference: every boundary — the trace shows only ~three per
   milestone, so the cost is low and the observability is worth it.
2. **Does a failed canary block the next wave's dispatch, or only the cut?** Asserted preference:
   only the cut — blocking dispatch serialises the whole milestone on a publish step. (What a
   failed canary *is* — evidence, not an incident, never yanked by default — is owned by
   `netscript-release`.)

## Reference

| Surface | Owns |
| --- | --- |
| `.llm/tools/release/canary-label.ts` (`deno task release:canary-label`) | label derivation, payload computation, note rendering, drift gate |
| `.agents/skills/netscript-release` | all publish mechanics, the green canary pair, failed-canary doctrine, rollback |
| [`milestone-run.md`](./milestone-run.md) | the run shape that consumes this cadence; cut-time verification of note accumulation |
| `.agents/skills/agent-milestone-orchestrator` | the role that declares wave boundaries and decides when a canary goes out |
| [`cut-trace.md`](../../runs/release-0.0.4--orchestration/cut-trace.md) | the observed evidence base |
| #1149 · #1160 · #1119 | live-canary exercise (0.0.5) · drift-scoping defect · naming collision |
